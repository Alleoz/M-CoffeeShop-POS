import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
    try {
        const { email, password, business_name } = await req.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required.' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters.' },
                { status: 400 }
            );
        }

        // Check if any owner already exists (limit to 1)
        const { data: existingOwners, error: checkErr } = await supabaseAdmin
            .from('pos_owners')
            .select('id')
            .limit(1);

        if (checkErr) {
            console.error('Check owner error:', checkErr);
            return NextResponse.json(
                { error: 'Server error. Please try again.' },
                { status: 500 }
            );
        }

        if (existingOwners && existingOwners.length > 0) {
            return NextResponse.json(
                { error: 'An owner account already exists. Only one owner is allowed per POS system.' },
                { status: 409 }
            );
        }

        // Create Supabase Auth user for the owner
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError) {
            // Check if user already exists in auth
            if (authError.message?.includes('already been registered')) {
                return NextResponse.json(
                    { error: 'This email is already registered.' },
                    { status: 409 }
                );
            }
            console.error('Auth create error:', authError);
            return NextResponse.json(
                { error: 'Failed to create account.' },
                { status: 500 }
            );
        }

        // Insert into pos_owners table
        const { error: insertError } = await supabaseAdmin
            .from('pos_owners')
            .insert({
                id: authData.user.id,
                email: email.toLowerCase(),
                business_name: business_name || 'M Café & Thrift Shop',
                is_approved: false,
                created_at: new Date().toISOString(),
            });

        if (insertError) {
            // Cleanup: remove auth user if insert fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            console.error('Insert owner error:', insertError);
            return NextResponse.json(
                { error: 'Failed to register owner.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Registration successful! Your account is pending approval by the system administrator.',
            owner: {
                id: authData.user.id,
                email: email.toLowerCase(),
                is_approved: false,
            },
        });
    } catch (err) {
        console.error('Owner register error:', err);
        return NextResponse.json(
            { error: 'Registration failed.' },
            { status: 500 }
        );
    }
}
