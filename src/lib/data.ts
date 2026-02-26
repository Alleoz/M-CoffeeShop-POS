import { supabase } from './supabase';
import { Product, Order, InventoryItem, Expense, OrderItem } from '@/types/database';

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
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding product:', error);
        return null;
    }

    return { ...data, price: Number(data.price) };
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

// ─────────── Dashboard Stats ───────────
export async function getTodayStats() {
    const today = new Date().toISOString().slice(0, 10);

    const [ordersResult, expensesResult] = await Promise.all([
        supabase
            .from('orders')
            .select('total')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`)
            .neq('status', 'Cancelled'),
        supabase
            .from('expenses')
            .select('amount')
            .eq('date', today),
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
