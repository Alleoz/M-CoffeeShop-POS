import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required.' },
                { status: 400 }
            );
        }

        // Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });

        if (authError || !authData.session) {
            return NextResponse.json(
                { error: 'Invalid email or password.' },
                { status: 401 }
            );
        }

        // Check if owner record exists and is approved
        const { data: owner, error: ownerErr } = await supabaseAdmin
            .from('pos_owners')
            .select('id, email, business_name, is_approved')
            .eq('id', authData.user.id)
            .single();

        if (ownerErr || !owner) {
            return NextResponse.json(
                { error: 'No owner account found for this email.' },
                { status: 403 }
            );
        }

        if (!owner.is_approved) {
            return NextResponse.json(
                { error: 'Your account is pending approval. Please contact the system administrator.', pending: true },
                { status: 403 }
            );
        }

        return NextResponse.json({
            message: 'Login successful.',
            session: {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
            },
            owner: {
                id: owner.id,
                email: owner.email,
                business_name: owner.business_name,
                is_approved: owner.is_approved,
            },
        });
    } catch (err) {
        console.error('Owner login error:', err);
        return NextResponse.json(
            { error: 'Login failed.' },
            { status: 500 }
        );
    }
}
