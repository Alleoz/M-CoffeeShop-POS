"use client";

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import { getOrders, getExpenses } from '@/lib/data';
import {
    exportOrders,
    exportInventory,
    exportExpenses,
    exportProducts,
    exportSalesSummary,
    EXPORT_OPTIONS,
    ExportType,
} from '@/lib/export';
import { Order, Expense } from '@/types/database';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    BarChart3,
    Coffee,
    CreditCard,
    Banknote,
    QrCode,
    Receipt,
    Download,
    FileSpreadsheet,
    CheckCircle2,
    Calendar,
} from 'lucide-react';
import { clsx } from 'clsx';

type DateRange = '7d' | '30d' | 'all';

export default function ReportsPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [dateRange, setDateRange] = useState<DateRange>('30d');
    const [mounted, setMounted] = useState(false);

    // Export state
    const [selectedExport, setSelectedExport] = useState<ExportType>('orders');
    const [exportDateFrom, setExportDateFrom] = useState('');
    const [exportDateTo, setExportDateTo] = useState('');
    const [exportSuccess, setExportSuccess] = useState('');

    useEffect(() => {
        const loadData = async () => {
            const [ordersData, expensesData] = await Promise.all([
                getOrders(),
                getExpenses(),
            ]);
            setOrders(ordersData);
            setExpenses(expensesData);
            setMounted(true);

            // Set default export date range to this month
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
            const today = now.toISOString().slice(0, 10);
            setExportDateFrom(firstDay);
            setExportDateTo(today);
        };
        loadData();
    }, []);

    const filteredOrders = useMemo(() => {
        if (dateRange === 'all') return orders.filter(o => o.status !== 'Cancelled');
        const days = dateRange === '7d' ? 7 : 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return orders.filter(o => new Date(o.created_at) >= cutoff && o.status !== 'Cancelled');
    }, [orders, dateRange]);

    const filteredExpenses = useMemo(() => {
        if (dateRange === 'all') return expenses;
        const days = dateRange === '7d' ? 7 : 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return expenses.filter(e => new Date(e.date) >= cutoff);
    }, [expenses, dateRange]);

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Payment method breakdown
    const paymentBreakdown = useMemo(() => {
        const breakdown: Record<string, { count: number; total: number }> = {};
        filteredOrders.forEach(o => {
            if (!breakdown[o.payment_method]) breakdown[o.payment_method] = { count: 0, total: 0 };
            breakdown[o.payment_method].count++;
            breakdown[o.payment_method].total += o.total;
        });
        return breakdown;
    }, [filteredOrders]);

    // Top selling items
    const topItems = useMemo(() => {
        const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};
        filteredOrders.forEach(o => {
            o.items.forEach(item => {
                if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
                itemMap[item.name].qty += item.quantity;
                itemMap[item.name].revenue += item.subtotal;
            });
        });
        return Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 8);
    }, [filteredOrders]);

    // Expense by category
    const expenseByCategory = useMemo(() => {
        const map: Record<string, number> = {};
        filteredExpenses.forEach(e => {
            map[e.category] = (map[e.category] || 0) + e.amount;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [filteredExpenses]);

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'Cash': return Banknote;
            case 'Card': return CreditCard;
            case 'E-Wallet': return QrCode;
            default: return DollarSign;
        }
    };

    const handleExport = async () => {
        const dateRangeParam = (exportDateFrom && exportDateTo)
            ? { from: exportDateFrom, to: exportDateTo }
            : undefined;

        let count = 0;
        switch (selectedExport) {
            case 'orders':
                count = await exportOrders(dateRangeParam);
                break;
            case 'inventory':
                count = await exportInventory();
                break;
            case 'expenses':
                count = await exportExpenses(dateRangeParam);
                break;
            case 'products':
                count = await exportProducts();
                break;
            case 'sales_summary':
                count = await exportSalesSummary(dateRangeParam);
                break;
        }

        const label = EXPORT_OPTIONS.find(o => o.value === selectedExport)?.label || '';
        setExportSuccess(`✓ Exported ${count} ${label.toLowerCase()} records`);
        setTimeout(() => setExportSuccess(''), 4000);
    };

    return (
        <div className="flex bg-slate-50 dark:bg-background-dark min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {/* Title + Date Range */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight font-display">Reports</h1>
                            <p className="text-slate-500 text-sm mt-1">Financial overview and sales analytics.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                            {(['7d', '30d', 'all'] as DateRange[]).map(range => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                        dateRange === range
                                            ? "bg-primary text-white shadow-lg shadow-primary/25"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8 stagger-children">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm card-hover animate-fade-in">
                            <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 mb-4">
                                <TrendingUp size={20} />
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                            <p className="text-2xl font-black tracking-tight">{mounted ? `₱${totalRevenue.toLocaleString('en', { minimumFractionDigits: 2 })}` : '—'}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm card-hover animate-fade-in" style={{ animationDelay: '80ms' }}>
                            <div className="size-11 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 mb-4">
                                <TrendingDown size={20} />
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Expenses</p>
                            <p className="text-2xl font-black tracking-tight">{mounted ? `₱${totalExpenses.toLocaleString('en', { minimumFractionDigits: 2 })}` : '—'}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm card-hover animate-fade-in" style={{ animationDelay: '160ms' }}>
                            <div className={clsx("size-11 rounded-xl flex items-center justify-center mb-4", netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" : "bg-rose-50 dark:bg-rose-900/20 text-rose-500")}>
                                <DollarSign size={20} />
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Net Profit</p>
                            <p className={clsx("text-2xl font-black tracking-tight", netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                {mounted ? `₱${netProfit.toLocaleString('en', { minimumFractionDigits: 2 })}` : '—'}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm card-hover animate-fade-in" style={{ animationDelay: '240ms' }}>
                            <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 mb-4">
                                <ShoppingBag size={20} />
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Orders ({totalOrders})</p>
                            <p className="text-2xl font-black tracking-tight">{mounted ? `₱${avgOrderValue.toLocaleString('en', { minimumFractionDigits: 2 })}` : '—'} <span className="text-sm text-slate-400 font-bold">avg</span></p>
                        </div>
                    </div>

                    {/* Export Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 animate-slide-up overflow-hidden">
                        <div className="px-4 md:px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <Download size={16} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-black font-display">Export Data</h2>
                                <p className="text-[10px] text-slate-400 font-medium">Download reports as CSV files for Excel / Google Sheets</p>
                            </div>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* Data Type Selection */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Data to Export</label>
                                    <div className="space-y-2">
                                        {EXPORT_OPTIONS.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => setSelectedExport(option.value)}
                                                className={clsx(
                                                    "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3",
                                                    selectedExport === option.value
                                                        ? "border-primary bg-primary/5 dark:bg-primary/10 dark:border-primary/40"
                                                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "size-8 rounded-lg flex items-center justify-center shrink-0",
                                                    selectedExport === option.value
                                                        ? "bg-primary text-white"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                                )}>
                                                    <FileSpreadsheet size={14} />
                                                </div>
                                                <div>
                                                    <p className={clsx("text-sm font-bold", selectedExport === option.value && "text-primary dark:text-primary")}>{option.label}</p>
                                                    <p className="text-[10px] text-slate-400">{option.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Range + Action */}
                                <div className="lg:col-span-2 flex flex-col justify-between">
                                    {/* Date range (only for orders, expenses, sales_summary) */}
                                    {['orders', 'expenses', 'sales_summary'].includes(selectedExport) && (
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
                                                <Calendar size={12} className="inline mr-1" />
                                                Date Range (optional)
                                            </label>
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div>
                                                    <label className="text-[10px] text-slate-400 font-bold mb-1 block">From</label>
                                                    <input
                                                        type="date"
                                                        value={exportDateFrom}
                                                        onChange={(e) => setExportDateFrom(e.target.value)}
                                                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white dark:bg-slate-800 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-400 font-bold mb-1 block">To</label>
                                                    <input
                                                        type="date"
                                                        value={exportDateTo}
                                                        onChange={(e) => setExportDateTo(e.target.value)}
                                                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white dark:bg-slate-800 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {['inventory', 'products'].includes(selectedExport) && (
                                        <div className="mb-6">
                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
                                                <p className="text-xs text-slate-400 font-bold">This export includes all current data</p>
                                                <p className="text-[10px] text-slate-400 mt-1">No date filter needed</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Preview info */}
                                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 mb-4">
                                        <p className="text-xs font-bold text-slate-500 mb-2">Export Preview</p>
                                        <div className="flex items-center gap-6 text-sm">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold block">Format</span>
                                                <span className="font-bold">CSV (Excel compatible)</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold block">Type</span>
                                                <span className="font-bold">{EXPORT_OPTIONS.find(o => o.value === selectedExport)?.label}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold block">Currency</span>
                                                <span className="font-bold">₱ PHP</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Export Button */}
                                    <button
                                        onClick={handleExport}
                                        className="w-full py-4 rounded-xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download size={18} />
                                        Export {EXPORT_OPTIONS.find(o => o.value === selectedExport)?.label} as CSV
                                    </button>

                                    {/* Success message */}
                                    {exportSuccess && (
                                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold mt-3 animate-fade-in bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3">
                                            <CheckCircle2 size={14} />
                                            {exportSuccess}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                        {/* Top Selling Items */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Coffee size={16} className="text-primary" />
                                </div>
                                <h2 className="text-base font-black font-display">Top Selling Items</h2>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {mounted && topItems.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 text-sm">
                                        <BarChart3 size={36} className="mx-auto mb-3 opacity-50" />
                                        <p className="font-bold">No sales data yet</p>
                                    </div>
                                ) : (
                                    topItems.map((item, idx) => (
                                        <div key={item.name} className="px-4 md:px-6 py-3.5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-slate-300 w-5">{idx + 1}.</span>
                                                <span className="text-sm font-bold">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-slate-400 font-bold">{item.qty} sold</span>
                                                <span className="text-sm font-black text-primary">₱{item.revenue.toFixed(0)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Payment Breakdown + Expense Categories */}
                        <div className="space-y-6">
                            {/* Payment Methods */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                                        <CreditCard size={16} className="text-violet-500" />
                                    </div>
                                    <h2 className="text-base font-black">Payment Methods</h2>
                                </div>
                                <div className="p-5 space-y-3">
                                    {Object.entries(paymentBreakdown).length === 0 && (
                                        <p className="text-center text-slate-400 text-sm py-6">No payment data</p>
                                    )}
                                    {Object.entries(paymentBreakdown).map(([method, data]) => {
                                        const Icon = getPaymentIcon(method);
                                        const pct = totalRevenue > 0 ? (data.total / totalRevenue * 100) : 0;
                                        return (
                                            <div key={method} className="flex items-center gap-3">
                                                <div className="size-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                                    <Icon size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-xs font-bold">{method}</span>
                                                        <span className="text-xs font-bold text-slate-400">{data.count} orders • ₱{data.total.toFixed(0)}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                                        <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Expense by Category */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                                        <Receipt size={16} className="text-rose-500" />
                                    </div>
                                    <h2 className="text-base font-black">Expenses by Category</h2>
                                </div>
                                <div className="p-5 space-y-3">
                                    {expenseByCategory.length === 0 && (
                                        <p className="text-center text-slate-400 text-sm py-6">No expense data</p>
                                    )}
                                    {expenseByCategory.map(([category, amount]) => {
                                        const pct = totalExpenses > 0 ? (amount / totalExpenses * 100) : 0;
                                        return (
                                            <div key={category} className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-500">{category}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-slate-400 font-bold">{pct.toFixed(0)}%</span>
                                                    <span className="text-sm font-black text-rose-500">₱{amount.toFixed(0)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
