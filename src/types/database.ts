// Database types matching Supabase schema

export interface ProductSize {
    name: string;   // e.g. "16oz", "22oz"
    price: number;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    image: string;
    description?: string;
    is_available: boolean;
    sizes?: ProductSize[] | null;
    created_at: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    stock: number;
    unit: string;
    min_stock: number;
    cost_per_unit: number;
    category: string;
    updated_at: string;
}

export interface Order {
    id: string;
    order_number: string;
    customer_type: string;
    table_no: string | null;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    payment_method: string;
    amount_paid: number;
    change: number;
    status: 'Pending' | 'In Progress' | 'Ready' | 'Completed' | 'Cancelled';
    created_at: string;
    completed_at?: string;
}

export interface OrderItem {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
}

export interface Expense {
    id: string;
    date: string;
    category: string;
    amount: number;
    description: string;
    created_at: string;
}

export interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    totalExpenses: number;
    averageOrderValue: number;
}
