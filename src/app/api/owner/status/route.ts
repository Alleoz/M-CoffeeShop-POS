import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET — Check if an owner exists & its status
export async function GET() {
    try {
        const { data: owner, error } = await supabaseAdmin
            .from('pos_owners')
            .select('id, email, business_name, is_approved, created_at')
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Owner status check error:', error);
            return NextResponse.json(
                { error: 'Failed to check status.' },
                { status: 500 }
            );
        }

        if (!owner) {
            return NextResponse.json({
                exists: false,
                message: 'No owner registered yet.',
            });
        }

        return NextResponse.json({
            exists: true,
            owner: {
                id: owner.id,
                email: owner.email,
                business_name: owner.business_name,
                is_approved: owner.is_approved,
                created_at: owner.created_at,
            },
        });
    } catch (err) {
        console.error('Owner status error:', err);
        return NextResponse.json(
            { error: 'Server error.' },
            { status: 500 }
        );
    }
}
