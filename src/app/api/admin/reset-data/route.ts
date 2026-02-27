import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST — Clear data tables (admin only)
// Usage: POST /api/admin/reset-data
// Body: { "tables": ["orders", "expenses", "activity_log", "attendance"] }
// Or:   { "tables": ["all"] }  — clears all transactional data (NOT products, inventory, or staff)
export async function POST(req: NextRequest) {
    try {
        const { tables, confirm } = await req.json();

        if (confirm !== 'YES_CLEAR_DATA') {
            return NextResponse.json({
                error: 'Safety check: include { "confirm": "YES_CLEAR_DATA" } to proceed.',
                hint: 'This will permanently delete data. Send confirm: "YES_CLEAR_DATA" to proceed.',
            }, { status: 400 });
        }

        const ALLOWED_TABLES = ['orders', 'expenses', 'activity_log', 'attendance'];
        const targetTables = tables?.includes('all') ? ALLOWED_TABLES : (tables || []).filter((t: string) => ALLOWED_TABLES.includes(t));

        if (targetTables.length === 0) {
            return NextResponse.json({
                error: 'No valid tables specified.',
                allowed: ALLOWED_TABLES,
            }, { status: 400 });
        }

        const results: Record<string, string> = {};

        for (const table of targetTables) {
            const { error } = await supabaseAdmin
                .from(table)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // deletes all rows

            results[table] = error ? `Error: ${error.message}` : 'Cleared ✓';
        }

        return NextResponse.json({
            message: 'Data reset complete.',
            results,
            note: 'Products, inventory, and staff were NOT touched.',
        });
    } catch {
        return NextResponse.json({ error: 'Failed to reset data.' }, { status: 500 });
    }
}
