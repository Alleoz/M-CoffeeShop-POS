import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';

// In-memory rate limiting
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

function getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
}

export async function POST(req: NextRequest) {
    try {
        const { pin } = await req.json();
        const ip = getClientIP(req);

        // --- Rate limiting ---
        const attempts = failedAttempts.get(ip);
        if (attempts && attempts.lockedUntil > Date.now()) {
            const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
            return NextResponse.json(
                { error: `Too many failed attempts. Try again in ${remainingSeconds}s.`, locked: true, remainingSeconds },
                { status: 429 }
            );
        }

        // --- Validate input ---
        if (!pin || typeof pin !== 'string' || pin.length < 4 || pin.length > 6) {
            return NextResponse.json({ error: 'Invalid PIN format.' }, { status: 400 });
        }

        // --- Fetch active staff (using service_role, bypasses RLS) ---
        const { data: staffList, error: staffErr } = await supabaseAdmin
            .from('staff')
            .select('id, name, role, pin_hash')
            .eq('is_active', true);

        if (staffErr || !staffList || staffList.length === 0) {
            console.error('Staff query error:', staffErr);
            return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
        }

        // --- Verify PIN using bcryptjs ---
        let matchedStaff = null;
        for (const staff of staffList) {
            if (await bcrypt.compare(pin, staff.pin_hash)) {
                matchedStaff = staff;
                break;
            }
        }

        if (!matchedStaff) {
            // Increment failed attempts
            const current = failedAttempts.get(ip) || { count: 0, lockedUntil: 0 };
            current.count += 1;

            if (current.count >= MAX_ATTEMPTS) {
                current.lockedUntil = Date.now() + LOCKOUT_MS;
                current.count = 0;
                failedAttempts.set(ip, current);
                return NextResponse.json(
                    { error: 'Too many failed attempts. Locked for 5 minutes.', locked: true, remainingSeconds: 300 },
                    { status: 429 }
                );
            }

            failedAttempts.set(ip, current);
            return NextResponse.json(
                { error: 'Invalid PIN.', attemptsRemaining: MAX_ATTEMPTS - current.count },
                { status: 401 }
            );
        }

        // --- Sign in as POS auth user to get a Supabase session ---
        const posEmail = process.env.POS_AUTH_EMAIL;
        const posPassword = process.env.POS_AUTH_PASSWORD;

        if (!posEmail || !posPassword) {
            console.error('POS_AUTH_EMAIL or POS_AUTH_PASSWORD not set');
            return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email: posEmail,
            password: posPassword,
        });

        if (authError || !authData.session) {
            console.error('Supabase Auth error:', authError);
            return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
        }

        // --- Clear rate limit on success ---
        failedAttempts.delete(ip);

        // --- Log activity (fire & forget) ---
        supabaseAdmin.from('activity_log').insert({
            staff_id: matchedStaff.id,
            staff_name: matchedStaff.name,
            action: 'login',
            details: { role: matchedStaff.role },
        }).then();

        return NextResponse.json({
            session: {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
            },
            staff: {
                id: matchedStaff.id,
                name: matchedStaff.name,
                role: matchedStaff.role,
            },
        });
    } catch (err) {
        console.error('Login route error:', err);
        return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
    }
}
