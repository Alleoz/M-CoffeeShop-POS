import { supabase } from './supabase';
import { Product, Order, InventoryItem, Expense, OrderItem, ProductSize } from '@/types/database';

// ─────────── Products ───────────
export async function getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return (data || []).map(row => ({
        ...row,
        price: Number(row.price),
        sizes: row.sizes ? (row.sizes as unknown as ProductSize[]).map(s => ({ ...s, price: Number(s.price) })) : null,
    }));
}

export async function saveProducts(products: Product[]): Promise<void> {
    // Upsert all products
    const { error } = await supabase
        .from('products')
        .upsert(products, { onConflict: 'id' });

    if (error) console.error('Error saving products:', error);
}

export async function addProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .insert({
            name: product.name,
            price: product.price,
            category: product.category,
            image: product.image,
            description: product.description || null,
            is_available: product.is_available,
            sizes: product.sizes || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding product:', error);
        return null;
    }

    return {
        ...data,
        price: Number(data.price),
        sizes: data.sizes ? (data.sizes as unknown as ProductSize[]).map(s => ({ ...s, price: Number(s.price) })) : null,
    };
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

    if (error) console.error('Error updating product:', error);
}

export async function deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) console.error('Error deleting product:', error);
}

// ─────────── Orders ───────────
export async function getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return (data || []).map(row => ({
        ...row,
        subtotal: Number(row.subtotal),
        tax: Number(row.tax),
        total: Number(row.total),
        amount_paid: Number(row.amount_paid),
        change: Number(row.change),
        items: (row.items as unknown as OrderItem[]) || [],
    }));
}

export async function saveOrders(orders: Order[]): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .upsert(orders, { onConflict: 'id' });

    if (error) console.error('Error saving orders:', error);
}

async function getNextOrderNumber(): Promise<string> {
    const { data, error } = await supabase
        .rpc('nextval', { seq_name: 'order_number_seq' });

    if (error) {
        // Fallback: use timestamp-based number
        console.error('Error getting order number:', error);
        return String(Date.now()).slice(-6);
    }

    return String(data).padStart(4, '0');
}

export async function createOrder(order: Omit<Order, 'id' | 'order_number' | 'created_at'>): Promise<Order | null> {
    const orderNumber = await getNextOrderNumber();

    const { data, error } = await supabase
        .from('orders')
        .insert({
            order_number: orderNumber,
            customer_type: order.customer_type,
            table_no: order.table_no,
            items: order.items as unknown as Record<string, unknown>[],
            subtotal: order.subtotal,
            tax: order.tax,
            total: order.total,
            payment_method: order.payment_method,
            amount_paid: order.amount_paid,
            change: order.change,
            status: order.status,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating order:', error);
        return null;
    }

    return {
        ...data,
        subtotal: Number(data.subtotal),
        tax: Number(data.tax),
        total: Number(data.total),
        amount_paid: Number(data.amount_paid),
        change: Number(data.change),
        items: (data.items as unknown as OrderItem[]) || [],
    };
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id);

    if (error) console.error('Error updating order:', error);
}

// ─────────── Inventory ───────────
export async function getInventory(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching inventory:', error);
        return [];
    }

    return (data || []).map(row => ({
        ...row,
        stock: Number(row.stock),
        min_stock: Number(row.min_stock),
        cost_per_unit: Number(row.cost_per_unit),
    }));
}

export async function saveInventory(items: InventoryItem[]): Promise<void> {
    const { error } = await supabase
        .from('inventory')
        .upsert(items, { onConflict: 'id' });

    if (error) console.error('Error saving inventory:', error);
}

export async function addInventoryItem(item: Omit<InventoryItem, 'id' | 'updated_at'>): Promise<InventoryItem | null> {
    const { data, error } = await supabase
        .from('inventory')
        .insert({
            name: item.name,
            stock: item.stock,
            unit: item.unit,
            min_stock: item.min_stock,
            cost_per_unit: item.cost_per_unit,
            category: item.category,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding inventory item:', error);
        return null;
    }

    return {
        ...data,
        stock: Number(data.stock),
        min_stock: Number(data.min_stock),
        cost_per_unit: Number(data.cost_per_unit),
    };
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
    const { error } = await supabase
        .from('inventory')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) console.error('Error updating inventory item:', error);
}

export async function deleteInventoryItem(id: string): Promise<void> {
    const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

    if (error) console.error('Error deleting inventory item:', error);
}

// ─────────── Expenses ───────────
export async function getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching expenses:', error);
        return [];
    }

    return (data || []).map(row => ({
        ...row,
        amount: Number(row.amount),
    }));
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
    const { error } = await supabase
        .from('expenses')
        .upsert(expenses, { onConflict: 'id' });

    if (error) console.error('Error saving expenses:', error);
}

export async function addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense | null> {
    const { data, error } = await supabase
        .from('expenses')
        .insert({
            date: expense.date,
            category: expense.category,
            amount: expense.amount,
            description: expense.description,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding expense:', error);
        return null;
    }

    return { ...data, amount: Number(data.amount) };
}

export async function deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

    if (error) console.error('Error deleting expense:', error);
}

// ─────────── Helpers ───────────
/** Returns the local date string (YYYY-MM-DD) and ISO boundaries for "today" in the user's timezone. */
function getLocalToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    // Build start/end of day as local Date objects, then convert to ISO for Supabase queries
    const startOfDay = new Date(year, now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(year, now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return {
        dateStr: today,
        startISO: startOfDay.toISOString(),
        endISO: endOfDay.toISOString(),
    };
}

// ─────────── Dashboard Stats ───────────
export async function getTodayStats() {
    const { dateStr, startISO, endISO } = getLocalToday();

    const [ordersResult, expensesResult] = await Promise.all([
        supabase
            .from('orders')
            .select('total')
            .gte('created_at', startISO)
            .lte('created_at', endISO)
            .neq('status', 'Cancelled'),
        supabase
            .from('expenses')
            .select('amount')
            .eq('date', dateStr),
    ]);

    const orders = ordersResult.data || [];
    const expenses = expensesResult.data || [];

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = orders.length;
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalRevenue, totalOrders, totalExpenses, averageOrderValue };
}

export async function getRecentOrders(limit = 10): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent orders:', error);
        return [];
    }

    return (data || []).map(row => ({
        ...row,
        subtotal: Number(row.subtotal),
        tax: Number(row.tax),
        total: Number(row.total),
        amount_paid: Number(row.amount_paid),
        change: Number(row.change),
        items: (row.items as unknown as OrderItem[]) || [],
    }));
}

export async function getHourlySales(): Promise<{ name: string; sales: number }[]> {
    const { startISO, endISO } = getLocalToday();
    const currentHour = new Date().getHours();

    const { data, error } = await supabase
        .from('orders')
        .select('total, created_at')
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .neq('status', 'Cancelled');

    if (error) {
        console.error('Error fetching hourly sales:', error);
        return [];
    }

    const orders = data || [];

    // Aggregate totals by hour (using local hours)
    const hourlyMap: Record<number, number> = {};
    for (const order of orders) {
        const hour = new Date(order.created_at).getHours();
        hourlyMap[hour] = (hourlyMap[hour] || 0) + Number(order.total);
    }

    // Build time labels from 6 AM up to current hour (typical coffee shop hours)
    const startHour = 6;
    const endHour = Math.max(startHour, currentHour);
    const result: { name: string; sales: number }[] = [];

    for (let h = startHour; h <= endHour; h++) {
        const ampm = h < 12 ? 'AM' : 'PM';
        const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
        result.push({
            name: `${display} ${ampm}`,
            sales: Math.round(hourlyMap[h] || 0),
        });
    }

    return result;
}

export async function getLowStockItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
        .from('inventory')
        .select('*');

    if (error) {
        console.error('Error fetching low stock items:', error);
        return [];
    }

    // Filter client-side since Supabase can't compare two columns directly in a simple query
    return (data || [])
        .map(row => ({
            ...row,
            stock: Number(row.stock),
            min_stock: Number(row.min_stock),
            cost_per_unit: Number(row.cost_per_unit),
        }))
        .filter(i => i.stock <= i.min_stock);
}
