import { Product, Order, InventoryItem, Expense } from '@/types/database';

// Default products for initial seed
const defaultProducts: Product[] = [
    { id: '1', name: 'Caramel Latte', price: 180, category: 'Espresso', image: '☕', is_available: true, created_at: new Date().toISOString() },
    { id: '2', name: 'Flat White', price: 160, category: 'Espresso', image: '☕', is_available: true, created_at: new Date().toISOString() },
    { id: '3', name: 'Americano', price: 130, category: 'Espresso', image: '☕', is_available: true, created_at: new Date().toISOString() },
    { id: '4', name: 'Cappuccino', price: 165, category: 'Espresso', image: '☕', is_available: true, created_at: new Date().toISOString() },
    { id: '5', name: 'Espresso Shot', price: 100, category: 'Espresso', image: '☕', is_available: true, created_at: new Date().toISOString() },
    { id: '6', name: 'Mocha', price: 185, category: 'Espresso', image: '☕', is_available: true, created_at: new Date().toISOString() },
    { id: '7', name: 'Java Chip Frappe', price: 210, category: 'Frappe', image: '🥤', is_available: true, created_at: new Date().toISOString() },
    { id: '8', name: 'Caramel Frappe', price: 200, category: 'Frappe', image: '🥤', is_available: true, created_at: new Date().toISOString() },
    { id: '9', name: 'Matcha Frappe', price: 195, category: 'Frappe', image: '🍵', is_available: true, created_at: new Date().toISOString() },
    { id: '10', name: 'Cookies & Cream Frappe', price: 210, category: 'Frappe', image: '🥤', is_available: true, created_at: new Date().toISOString() },
    { id: '11', name: 'Blueberry Muffin', price: 95, category: 'Pastry', image: '🧁', is_available: true, created_at: new Date().toISOString() },
    { id: '12', name: 'Croissant', price: 85, category: 'Pastry', image: '🥐', is_available: true, created_at: new Date().toISOString() },
    { id: '13', name: 'Cinnamon Roll', price: 110, category: 'Pastry', image: '🍥', is_available: true, created_at: new Date().toISOString() },
    { id: '14', name: 'Chocolate Cake Slice', price: 130, category: 'Pastry', image: '🍰', is_available: true, created_at: new Date().toISOString() },
    { id: '15', name: 'Mango Smoothie', price: 160, category: 'Non-Coffee', image: '🥭', is_available: true, created_at: new Date().toISOString() },
    { id: '16', name: 'Strawberry Shake', price: 170, category: 'Non-Coffee', image: '🍓', is_available: true, created_at: new Date().toISOString() },
    { id: '17', name: 'Hot Chocolate', price: 145, category: 'Non-Coffee', image: '🍫', is_available: true, created_at: new Date().toISOString() },
    { id: '18', name: 'Classic Milk Tea', price: 130, category: 'Tea', image: '🧋', is_available: true, created_at: new Date().toISOString() },
    { id: '19', name: 'Earl Grey', price: 120, category: 'Tea', image: '🫖', is_available: true, created_at: new Date().toISOString() },
    { id: '20', name: 'Jasmine Green Tea', price: 115, category: 'Tea', image: '🍵', is_available: true, created_at: new Date().toISOString() },
];

const defaultInventory: InventoryItem[] = [
    { id: '1', name: 'Arabica Beans', stock: 12.5, unit: 'kg', min_stock: 5, cost_per_unit: 850, category: 'Coffee', updated_at: new Date().toISOString() },
    { id: '2', name: 'Whole Milk', stock: 5.0, unit: 'L', min_stock: 8, cost_per_unit: 85, category: 'Dairy', updated_at: new Date().toISOString() },
    { id: '3', name: 'Caramel Syrup', stock: 8.0, unit: 'Bottles', min_stock: 3, cost_per_unit: 320, category: 'Syrup', updated_at: new Date().toISOString() },
    { id: '4', name: 'Paper Cups (12oz)', stock: 150, unit: 'pcs', min_stock: 50, cost_per_unit: 5, category: 'Packaging', updated_at: new Date().toISOString() },
    { id: '5', name: 'Vanilla Syrup', stock: 6.0, unit: 'Bottles', min_stock: 3, cost_per_unit: 310, category: 'Syrup', updated_at: new Date().toISOString() },
    { id: '6', name: 'Chocolate Powder', stock: 3.0, unit: 'kg', min_stock: 2, cost_per_unit: 420, category: 'Ingredients', updated_at: new Date().toISOString() },
    { id: '7', name: 'Matcha Powder', stock: 1.5, unit: 'kg', min_stock: 1, cost_per_unit: 1200, category: 'Ingredients', updated_at: new Date().toISOString() },
    { id: '8', name: 'Sugar', stock: 10, unit: 'kg', min_stock: 5, cost_per_unit: 60, category: 'Ingredients', updated_at: new Date().toISOString() },
    { id: '9', name: 'Straws', stock: 200, unit: 'pcs', min_stock: 100, cost_per_unit: 2, category: 'Packaging', updated_at: new Date().toISOString() },
    { id: '10', name: 'Napkins', stock: 300, unit: 'pcs', min_stock: 100, cost_per_unit: 1, category: 'Packaging', updated_at: new Date().toISOString() },
];

// ─────────── Helpers ───────────
const STORAGE_KEYS = {
    PRODUCTS: 'mcoffee_products',
    ORDERS: 'mcoffee_orders',
    INVENTORY: 'mcoffee_inventory',
    EXPENSES: 'mcoffee_expenses',
    ORDER_COUNTER: 'mcoffee_order_counter',
};

function getFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function saveToStorage<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
}

// ─────────── Products ───────────
export function getProducts(): Product[] {
    return getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, defaultProducts);
}
export function saveProducts(products: Product[]): void {
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
}
export function addProduct(product: Omit<Product, 'id' | 'created_at'>): Product {
    const products = getProducts();
    const newProduct: Product = {
        ...product,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
    };
    products.push(newProduct);
    saveProducts(products);
    return newProduct;
}
export function updateProduct(id: string, updates: Partial<Product>): void {
    const products = getProducts().map(p => p.id === id ? { ...p, ...updates } : p);
    saveProducts(products);
}
export function deleteProduct(id: string): void {
    saveProducts(getProducts().filter(p => p.id !== id));
}

// ─────────── Orders ───────────
export function getOrders(): Order[] {
    return getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
}
export function saveOrders(orders: Order[]): void {
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
}
function getNextOrderNumber(): string {
    const counter = getFromStorage<number>(STORAGE_KEYS.ORDER_COUNTER, 0) + 1;
    saveToStorage(STORAGE_KEYS.ORDER_COUNTER, counter);
    return String(counter).padStart(4, '0');
}
export function createOrder(order: Omit<Order, 'id' | 'order_number' | 'created_at'>): Order {
    const orders = getOrders();
    const newOrder: Order = {
        ...order,
        id: crypto.randomUUID(),
        order_number: getNextOrderNumber(),
        created_at: new Date().toISOString(),
    };
    orders.unshift(newOrder);
    saveOrders(orders);
    return newOrder;
}
export function updateOrder(id: string, updates: Partial<Order>): void {
    const orders = getOrders().map(o => o.id === id ? { ...o, ...updates } : o);
    saveOrders(orders);
}

// ─────────── Inventory ───────────
export function getInventory(): InventoryItem[] {
    return getFromStorage<InventoryItem[]>(STORAGE_KEYS.INVENTORY, defaultInventory);
}
export function saveInventory(items: InventoryItem[]): void {
    saveToStorage(STORAGE_KEYS.INVENTORY, items);
}
export function addInventoryItem(item: Omit<InventoryItem, 'id' | 'updated_at'>): InventoryItem {
    const items = getInventory();
    const newItem: InventoryItem = { ...item, id: crypto.randomUUID(), updated_at: new Date().toISOString() };
    items.push(newItem);
    saveInventory(items);
    return newItem;
}
export function updateInventoryItem(id: string, updates: Partial<InventoryItem>): void {
    const items = getInventory().map(i => i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i);
    saveInventory(items);
}
export function deleteInventoryItem(id: string): void {
    saveInventory(getInventory().filter(i => i.id !== id));
}

// ─────────── Expenses ───────────
export function getExpenses(): Expense[] {
    return getFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, []);
}
export function saveExpenses(expenses: Expense[]): void {
    saveToStorage(STORAGE_KEYS.EXPENSES, expenses);
}
export function addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Expense {
    const expenses = getExpenses();
    const newExpense: Expense = { ...expense, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    expenses.unshift(newExpense);
    saveExpenses(expenses);
    return newExpense;
}
export function deleteExpense(id: string): void {
    saveExpenses(getExpenses().filter(e => e.id !== id));
}

// ─────────── Dashboard Stats ───────────
export function getTodayStats() {
    const today = new Date().toISOString().slice(0, 10);
    const orders = getOrders().filter(o => o.created_at.slice(0, 10) === today && o.status !== 'Cancelled');
    const expenses = getExpenses().filter(e => e.date === today);

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalRevenue, totalOrders, totalExpenses, averageOrderValue };
}

export function getRecentOrders(limit = 10): Order[] {
    return getOrders().slice(0, limit);
}

export function getLowStockItems(): InventoryItem[] {
    return getInventory().filter(i => i.stock <= i.min_stock);
}
