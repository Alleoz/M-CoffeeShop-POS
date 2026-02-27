-- ============================================
-- ATTENDANCE TABLE MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create the attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clock_out TIMESTAMPTZ,
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_minutes INTEGER, -- computed on clock-out
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX idx_attendance_staff_id ON attendance(staff_id);
CREATE INDEX idx_attendance_work_date ON attendance(work_date);
CREATE INDEX idx_attendance_staff_date ON attendance(staff_id, work_date);

-- 3. Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies — authenticated users can read/write
CREATE POLICY "Allow authenticated read attendance"
    ON attendance FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert attendance"
    ON attendance FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update attendance"
    ON attendance FOR UPDATE
    TO authenticated
    USING (true);

-- Done! Now you can use the Attendance feature.
