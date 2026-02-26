-- ═══════════════════════════════════════════════════
-- M Coffee Shop POS — Database Schema Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'General',
    image TEXT NOT NULL DEFAULT '☕',
    description TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL,
    customer_type TEXT NOT NULL DEFAULT 'Walk-in',
    table_no TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
    change NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 3. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stock NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'pcs',
    min_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
    cost_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'General',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL DEFAULT 'Miscellaneous',
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Order Counter (sequence for order numbers)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;

-- ═══════════════════════════════════════════════════
-- Indexes for performance
-- ═══════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

-- ═══════════════════════════════════════════════════
-- Row Level Security (RLS) — Allow public read/write
-- (For a POS used on a local network, this is fine.
--  Restrict later with auth if needed.)
-- ═══════════════════════════════════════════════════
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════
-- Seed default products
-- ═══════════════════════════════════════════════════
INSERT INTO products (name, price, category, image, is_available) VALUES
    ('Caramel Latte', 180, 'Espresso', '☕', true),
    ('Flat White', 160, 'Espresso', '☕', true),
    ('Americano', 130, 'Espresso', '☕', true),
    ('Cappuccino', 165, 'Espresso', '☕', true),
    ('Espresso Shot', 100, 'Espresso', '☕', true),
    ('Mocha', 185, 'Espresso', '☕', true),
    ('Java Chip Frappe', 210, 'Frappe', '🥤', true),
    ('Caramel Frappe', 200, 'Frappe', '🥤', true),
    ('Matcha Frappe', 195, 'Frappe', '🍵', true),
    ('Cookies & Cream Frappe', 210, 'Frappe', '🥤', true),
    ('Blueberry Muffin', 95, 'Pastry', '🧁', true),
    ('Croissant', 85, 'Pastry', '🥐', true),
    ('Cinnamon Roll', 110, 'Pastry', '🍥', true),
    ('Chocolate Cake Slice', 130, 'Pastry', '🍰', true),
    ('Mango Smoothie', 160, 'Non-Coffee', '🥭', true),
    ('Strawberry Shake', 170, 'Non-Coffee', '🍓', true),
    ('Hot Chocolate', 145, 'Non-Coffee', '🍫', true),
    ('Classic Milk Tea', 130, 'Tea', '🧋', true),
    ('Earl Grey', 120, 'Tea', '🫖', true),
    ('Jasmine Green Tea', 115, 'Tea', '🍵', true);

-- Seed default inventory
INSERT INTO inventory (name, stock, unit, min_stock, cost_per_unit, category) VALUES
    ('Arabica Beans', 12.5, 'kg', 5, 850, 'Coffee'),
    ('Whole Milk', 5.0, 'L', 8, 85, 'Dairy'),
    ('Caramel Syrup', 8.0, 'Bottles', 3, 320, 'Syrup'),
    ('Paper Cups (12oz)', 150, 'pcs', 50, 5, 'Packaging'),
    ('Vanilla Syrup', 6.0, 'Bottles', 3, 310, 'Syrup'),
    ('Chocolate Powder', 3.0, 'kg', 2, 420, 'Ingredients'),
    ('Matcha Powder', 1.5, 'kg', 1, 1200, 'Ingredients'),
    ('Sugar', 10, 'kg', 5, 60, 'Ingredients'),
    ('Straws', 200, 'pcs', 100, 2, 'Packaging'),
    ('Napkins', 300, 'pcs', 100, 1, 'Packaging');

-- Grant sequence usage
GRANT USAGE, SELECT ON SEQUENCE order_number_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE order_number_seq TO authenticated;
