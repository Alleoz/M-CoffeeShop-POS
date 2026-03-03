import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST — Approve an owner (requires admin secret key)
export async function POST(req: NextRequest) {
    try {
        const { owner_id, admin_secret } = await req.json();

        // Verify admin secret (you set this in your .env)
        const expectedSecret = process.env.OWNER_ADMIN_SECRET;
        if (!expectedSecret || admin_secret !== expectedSecret) {
            return NextResponse.json(
                { error: 'Unauthorized. Invalid admin secret.' },
                { status: 401 }
            );
        }

        if (!owner_id) {
            return NextResponse.json(
                { error: 'owner_id is required.' },
                { status: 400 }
            );
        }

        // Update approval status
        const { data, error } = await supabaseAdmin
            .from('pos_owners')
            .update({ is_approved: true, approved_at: new Date().toISOString() })
            .eq('id', owner_id)
            .select('id, email, business_name, is_approved')
            .single();

        if (error || !data) {
            console.error('Approve owner error:', error);
            return NextResponse.json(
                { error: 'Failed to approve owner.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Owner approved successfully!',
            owner: data,
        });
    } catch (err) {
        console.error('Approve error:', err);
        return NextResponse.json(
            { error: 'Approval failed.' },
            { status: 500 }
        );
    }
}
