import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET — Fetch attendance records (with filters)
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const staffId = url.searchParams.get('staff_id');
    const from = url.searchParams.get('from');       // YYYY-MM-DD
    const to = url.searchParams.get('to');             // YYYY-MM-DD
    const today = url.searchParams.get('today');       // "true" = only today
    const allStaff = url.searchParams.get('all');      // "true" = admin view

    let query = supabaseAdmin
        .from('attendance')
        .select('id, staff_id, clock_in, clock_out, work_date, total_minutes, notes, staff:staff_id(name, role)')
        .order('clock_in', { ascending: false });

    // Filter by staff
    if (staffId && allStaff !== 'true') {
        query = query.eq('staff_id', staffId);
    }

    // Filter by date range
    if (today === 'true') {
        const todayDate = new Date().toISOString().split('T')[0];
        query = query.eq('work_date', todayDate);
    } else {
        if (from) query = query.gte('work_date', from);
        if (to) query = query.lte('work_date', to);
    }

    query = query.limit(200);

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST — Clock In or Clock Out
export async function POST(req: NextRequest) {
    try {
        const { staff_id, action, notes } = await req.json();

        if (!staff_id || !action) {
            return NextResponse.json({ error: 'staff_id and action are required.' }, { status: 400 });
        }

        if (action === 'clock_in') {
            // Check if there's already an open clock-in (no clock_out) today
            const todayDate = new Date().toISOString().split('T')[0];
            const { data: existing } = await supabaseAdmin
                .from('attendance')
                .select('id')
                .eq('staff_id', staff_id)
                .eq('work_date', todayDate)
                .is('clock_out', null)
                .limit(1);

            if (existing && existing.length > 0) {
                return NextResponse.json({ error: 'You are already clocked in. Clock out first.' }, { status: 409 });
            }

            // Create clock-in record
            const { data, error } = await supabaseAdmin
                .from('attendance')
                .insert({
                    staff_id,
                    clock_in: new Date().toISOString(),
                    work_date: todayDate,
                    notes: notes || null,
                })
                .select('id, clock_in, work_date')
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ message: 'Clocked in!', record: data }, { status: 201 });

        } else if (action === 'clock_out') {
            // Find the open clock-in record for today
            const todayDate = new Date().toISOString().split('T')[0];
            const { data: openRecord } = await supabaseAdmin
                .from('attendance')
                .select('id, clock_in')
                .eq('staff_id', staff_id)
                .eq('work_date', todayDate)
                .is('clock_out', null)
                .order('clock_in', { ascending: false })
                .limit(1)
                .single();

            if (!openRecord) {
                return NextResponse.json({ error: 'No active clock-in found. Clock in first.' }, { status: 404 });
            }

            // Calculate total minutes
            const clockIn = new Date(openRecord.clock_in);
            const clockOut = new Date();
            const totalMinutes = Math.round((clockOut.getTime() - clockIn.getTime()) / 60000);

            // Update record with clock-out
            const { data, error } = await supabaseAdmin
                .from('attendance')
                .update({
                    clock_out: clockOut.toISOString(),
                    total_minutes: totalMinutes,
                })
                .eq('id', openRecord.id)
                .select('id, clock_in, clock_out, total_minutes')
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ message: 'Clocked out!', record: data });

        } else {
            return NextResponse.json({ error: 'Action must be "clock_in" or "clock_out".' }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ error: 'Failed to process attendance.' }, { status: 500 });
    }
}
