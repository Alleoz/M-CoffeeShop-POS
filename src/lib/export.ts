import { getOrders, getInventory, getExpenses, getProducts } from './data';

// ─────────── CSV Helpers ───────────
function escapeCsv(value: string | number | boolean | null | undefined): string {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
    const headerLine = headers.map(escapeCsv).join(',');
    const dataLines = rows.map(row => row.map(escapeCsv).join(','));
    return [headerLine, ...dataLines].join('\n');
}

function downloadCsv(filename: string, csvContent: string) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ─────────── Export Functions ───────────

export function exportOrders(dateRange?: { from: string; to: string }) {
    let orders = getOrders();

    if (dateRange) {
        orders = orders.filter(o => {
            const d = o.created_at.slice(0, 10);
            return d >= dateRange.from && d <= dateRange.to;
        });
    }

    const headers = [
        'Order #', 'Date', 'Time', 'Customer Type', 'Table', 'Items',
        'Subtotal (₱)', 'Tax (₱)', 'Total (₱)', 'Payment Method',
        'Amount Paid (₱)', 'Change (₱)', 'Status',
    ];

    const rows = orders.map(o => {
        const date = new Date(o.created_at);
        const itemsSummary = o.items.map(i => `${i.name} x${i.quantity}`).join('; ');
        return [
            o.order_number,
            date.toLocaleDateString('en-PH'),
            date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
            o.customer_type,
            o.table_no || '—',
            itemsSummary,
            o.subtotal.toFixed(2),
            o.tax.toFixed(2),
            o.total.toFixed(2),
            o.payment_method,
            o.amount_paid.toFixed(2),
            o.change.toFixed(2),
            o.status,
        ];
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsv(`MCoffee_Orders_${dateStr}.csv`, toCsv(headers, rows));
    return orders.length;
}

export function exportInventory() {
    const inventory = getInventory();

    const headers = [
        'Item Name', 'Category', 'Current Stock', 'Unit',
        'Min Stock Level', 'Cost per Unit (₱)', 'Total Value (₱)',
        'Status', 'Last Updated',
    ];

    const rows = inventory.map(i => {
        let status = 'Healthy';
        if (i.stock <= 0) status = 'Out of Stock';
        else if (i.stock <= i.min_stock) status = 'Low Stock';

        return [
            i.name,
            i.category,
            i.stock,
            i.unit,
            i.min_stock,
            i.cost_per_unit.toFixed(2),
            (i.stock * i.cost_per_unit).toFixed(2),
            status,
            new Date(i.updated_at).toLocaleDateString('en-PH'),
        ];
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsv(`MCoffee_Inventory_${dateStr}.csv`, toCsv(headers, rows));
    return inventory.length;
}

export function exportExpenses(dateRange?: { from: string; to: string }) {
    let expenses = getExpenses();

    if (dateRange) {
        expenses = expenses.filter(e => {
            return e.date >= dateRange.from && e.date <= dateRange.to;
        });
    }

    const headers = [
        'Date', 'Category', 'Amount (₱)', 'Description',
    ];

    const rows = expenses.map(e => [
        e.date,
        e.category,
        e.amount.toFixed(2),
        e.description || '—',
    ]);

    // Add total row
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    rows.push(['', '', '', '']);
    rows.push(['TOTAL', '', total.toFixed(2), '']);

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsv(`MCoffee_Expenses_${dateStr}.csv`, toCsv(headers, rows));
    return expenses.length;
}

export function exportProducts() {
    const products = getProducts();

    const headers = [
        'ID', 'Name', 'Category', 'Price (₱)', 'Available', 'Created',
    ];

    const rows = products.map(p => [
        p.id,
        p.name,
        p.category,
        p.price.toFixed(2),
        p.is_available ? 'Yes' : 'No',
        new Date(p.created_at).toLocaleDateString('en-PH'),
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsv(`MCoffee_Products_${dateStr}.csv`, toCsv(headers, rows));
    return products.length;
}

export function exportSalesSummary(dateRange?: { from: string; to: string }) {
    let orders = getOrders().filter(o => o.status !== 'Cancelled');
    let expenses = getExpenses();

    if (dateRange) {
        orders = orders.filter(o => {
            const d = o.created_at.slice(0, 10);
            return d >= dateRange.from && d <= dateRange.to;
        });
        expenses = expenses.filter(e => e.date >= dateRange.from && e.date <= dateRange.to);
    }

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Payment breakdown
    const paymentMap: Record<string, { count: number; total: number }> = {};
    orders.forEach(o => {
        if (!paymentMap[o.payment_method]) paymentMap[o.payment_method] = { count: 0, total: 0 };
        paymentMap[o.payment_method].count++;
        paymentMap[o.payment_method].total += o.total;
    });

    // Top items
    const itemMap: Record<string, { qty: number; revenue: number }> = {};
    orders.forEach(o => {
        o.items.forEach(item => {
            if (!itemMap[item.name]) itemMap[item.name] = { qty: 0, revenue: 0 };
            itemMap[item.name].qty += item.quantity;
            itemMap[item.name].revenue += item.subtotal;
        });
    });
    const topItems = Object.entries(itemMap).sort((a, b) => b[1].qty - a[1].qty).slice(0, 15);

    // Expense breakdown
    const expCatMap: Record<string, number> = {};
    expenses.forEach(e => {
        expCatMap[e.category] = (expCatMap[e.category] || 0) + e.amount;
    });

    // Build CSV sections
    const lines: string[] = [];

    lines.push('M COFFEE SHOP - SALES SUMMARY REPORT');
    lines.push(`Generated: ${new Date().toLocaleString('en-PH')}`);
    if (dateRange) lines.push(`Period: ${dateRange.from} to ${dateRange.to}`);
    lines.push('');

    lines.push('[ FINANCIAL OVERVIEW ]');
    lines.push(`Total Revenue,₱${totalRevenue.toFixed(2)}`);
    lines.push(`Total Expenses,₱${totalExpenses.toFixed(2)}`);
    lines.push(`Net Profit,₱${netProfit.toFixed(2)}`);
    lines.push(`Total Orders,${totalOrders}`);
    lines.push(`Average Order Value,₱${avgOrder.toFixed(2)}`);
    lines.push('');

    lines.push('[ PAYMENT METHOD BREAKDOWN ]');
    lines.push('Method,Orders,Total (₱)');
    Object.entries(paymentMap).forEach(([method, data]) => {
        lines.push(`${method},${data.count},${data.total.toFixed(2)}`);
    });
    lines.push('');

    lines.push('[ TOP SELLING ITEMS ]');
    lines.push('Rank,Item,Qty Sold,Revenue (₱)');
    topItems.forEach(([name, data], idx) => {
        lines.push(`${idx + 1},${escapeCsv(name)},${data.qty},${data.revenue.toFixed(2)}`);
    });
    lines.push('');

    lines.push('[ EXPENSES BY CATEGORY ]');
    lines.push('Category,Amount (₱)');
    Object.entries(expCatMap).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
        lines.push(`${cat},${amt.toFixed(2)}`);
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsv(`MCoffee_SalesSummary_${dateStr}.csv`, lines.join('\n'));
    return totalOrders;
}

export type ExportType = 'orders' | 'inventory' | 'expenses' | 'products' | 'sales_summary';

export const EXPORT_OPTIONS: { value: ExportType; label: string; description: string }[] = [
    { value: 'orders', label: 'Orders', description: 'All order transactions with item details' },
    { value: 'inventory', label: 'Inventory', description: 'Current stock levels and values' },
    { value: 'expenses', label: 'Expenses', description: 'All logged operational expenses' },
    { value: 'products', label: 'Product Menu', description: 'Complete product catalog with prices' },
    { value: 'sales_summary', label: 'Sales Summary', description: 'Financial overview with analytics' },
];
