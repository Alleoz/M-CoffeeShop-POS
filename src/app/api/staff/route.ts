import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';

// GET — List all staff (no pin_hash)
export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('staff')
        .select('id, name, role, is_active, created_at, updated_at')
        .order('created_at', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST — Create new staff
export async function POST(req: NextRequest) {
    try {
        const { name, pin, role } = await req.json();

        if (!name || !pin || !role) {
            return NextResponse.json({ error: 'Name, PIN, and role are required.' }, { status: 400 });
        }
        if (pin.length < 4 || pin.length > 6) {
            return NextResponse.json({ error: 'PIN must be 4-6 digits.' }, { status: 400 });
        }
        if (!['admin', 'manager', 'cashier', 'barista'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
        }

        // Check for duplicate PIN
        const { data: allStaff } = await supabaseAdmin
            .from('staff')
            .select('id, pin_hash')
            .eq('is_active', true);

        if (allStaff) {
            for (const s of allStaff) {
                if (await bcrypt.compare(pin, s.pin_hash)) {
                    return NextResponse.json({ error: 'This PIN is already in use by another staff member.' }, { status: 409 });
                }
            }
        }

        const pin_hash = await bcrypt.hash(pin, 10);

        const { data, error } = await supabaseAdmin
            .from('staff')
            .insert({ name, pin_hash, role })
            .select('id, name, role, is_active, created_at')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create staff.' }, { status: 500 });
    }
}

// PUT — Update staff (name, role, or PIN reset)
export async function PUT(req: NextRequest) {
    try {
        const { id, name, role, pin, is_active } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Staff ID is required.' }, { status: 400 });
        }

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (name) updates.name = name;
        if (role) updates.role = role;
        if (typeof is_active === 'boolean') updates.is_active = is_active;

        if (pin) {
            if (pin.length < 4 || pin.length > 6) {
                return NextResponse.json({ error: 'PIN must be 4-6 digits.' }, { status: 400 });
            }
            // Check for duplicate PIN
            const { data: allStaff } = await supabaseAdmin
                .from('staff')
                .select('id, pin_hash')
                .eq('is_active', true)
                .neq('id', id);

            if (allStaff) {
                for (const s of allStaff) {
                    if (await bcrypt.compare(pin, s.pin_hash)) {
                        return NextResponse.json({ error: 'This PIN is already in use.' }, { status: 409 });
                    }
                }
            }

            updates.pin_hash = await bcrypt.hash(pin, 10);
        }

        const { data, error } = await supabaseAdmin
            .from('staff')
            .update(updates)
            .eq('id', id)
            .select('id, name, role, is_active, updated_at')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to update staff.' }, { status: 500 });
    }
}

// DELETE — Deactivate staff (soft delete)
export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Staff ID is required.' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('staff')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Staff deactivated.' });
    } catch {
        return NextResponse.json({ error: 'Failed to delete staff.' }, { status: 500 });
    }
}
