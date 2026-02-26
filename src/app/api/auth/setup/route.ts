import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// One-time setup: creates the POS Auth user in Supabase
// Call POST /api/auth/setup once after configuring env vars
export async function POST() {
    try {
        const posEmail = process.env.POS_AUTH_EMAIL;
        const posPassword = process.env.POS_AUTH_PASSWORD;

        if (!posEmail || !posPassword) {
            return NextResponse.json(
                { error: 'POS_AUTH_EMAIL and POS_AUTH_PASSWORD must be set in environment.' },
                { status: 500 }
            );
        }

        // Check if user already exists
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find((u) => u.email === posEmail);

        if (existing) {
            return NextResponse.json({
                message: 'POS Auth user already exists.',
                userId: existing.id,
            });
        }

        // Create POS auth user (auto-confirmed)
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: posEmail,
            password: posPassword,
            email_confirm: true,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'POS Auth user created successfully!',
            userId: data.user.id,
        });
    } catch (err) {
        console.error('Setup error:', err);
        return NextResponse.json({ error: 'Setup failed.' }, { status: 500 });
    }
}
