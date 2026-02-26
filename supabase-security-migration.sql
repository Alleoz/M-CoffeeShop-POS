-- ============================================================
-- M Coffee POS - Security Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Enable pgcrypto for PIN hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create staff table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'barista')),
    is_active BOOLEAN DEFAULT true,
    failed_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id),
    staff_name TEXT,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS on new tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 5. Insert default admin (PIN: 1234 — change after first login!)
INSERT INTO staff (name, pin_hash, role)
SELECT 'Admin', crypt('1234', gen_salt('bf')), 'admin'
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE name = 'Admin' AND role = 'admin');

-- 6. Create secure PIN verification function (service_role only)
CREATE OR REPLACE FUNCTION verify_staff_pin(input_pin TEXT)
RETURNS TABLE (staff_id UUID, staff_name TEXT, staff_role TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.role
    FROM staff s
    WHERE s.pin_hash = crypt(input_pin, s.pin_hash)
    AND s.is_active = true
    AND (s.locked_until IS NULL OR s.locked_until < now());
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_staff_pin FROM public;
REVOKE EXECUTE ON FUNCTION verify_staff_pin FROM anon;
REVOKE EXECUTE ON FUNCTION verify_staff_pin FROM authenticated;
GRANT EXECUTE ON FUNCTION verify_staff_pin TO service_role;

-- 7. Drop ALL old permissive "Allow public" policies
DROP POLICY IF EXISTS "Allow public select on products" ON products;
DROP POLICY IF EXISTS "Allow public insert on products" ON products;
DROP POLICY IF EXISTS "Allow public update on products" ON products;
DROP POLICY IF EXISTS "Allow public delete on products" ON products;

DROP POLICY IF EXISTS "Allow public select on orders" ON orders;
DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
DROP POLICY IF EXISTS "Allow public update on orders" ON orders;
DROP POLICY IF EXISTS "Allow public delete on orders" ON orders;

DROP POLICY IF EXISTS "Allow public select on inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public insert on inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public update on inventory" ON inventory;
DROP POLICY IF EXISTS "Allow public delete on inventory" ON inventory;

DROP POLICY IF EXISTS "Allow public select on expenses" ON expenses;
DROP POLICY IF EXISTS "Allow public insert on expenses" ON expenses;
DROP POLICY IF EXISTS "Allow public update on expenses" ON expenses;
DROP POLICY IF EXISTS "Allow public delete on expenses" ON expenses;

-- 8. Create new AUTHENTICATED-ONLY policies
CREATE POLICY "auth_select_products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_products" ON products FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select_orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_orders" ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_orders" ON orders FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select_inventory" ON inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_inventory" ON inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_inventory" ON inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_inventory" ON inventory FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select_expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_expenses" ON expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_expenses" ON expenses FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select_staff" ON staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_staff" ON staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_staff" ON staff FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_staff" ON staff FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select_activity_log" ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_activity_log" ON activity_log FOR INSERT TO authenticated WITH CHECK (true);
