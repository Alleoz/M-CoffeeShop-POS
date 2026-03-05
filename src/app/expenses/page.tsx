"use client";

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import Modal from '@/components/UI/Modal';
import { getExpenses, addExpense, deleteExpense } from '@/lib/data';
import { Expense } from '@/types/database';
import {
    Wallet,
    TrendingDown,
    Calendar,
    Plus,
    DollarSign,
    Trash2,
    Tag,
    FileText,
    Filter,
} from 'lucide-react';
import { clsx } from 'clsx';

const expenseCategories = ['Supplies', 'Utilities', 'Marketing', 'Maintenance', 'Salaries', 'Rent', 'Miscellaneous'];

type FilterRange = 'today' | '7d' | '30d' | 'all' | 'custom';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Date filter
    const [filterRange, setFilterRange] = useState<FilterRange>('all');
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');

    // Form
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formCategory, setFormCategory] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formDescription, setFormDescription] = useState('');

    const refreshExpenses = async () => {
        const data = await getExpenses();
        setExpenses(data);
    };

    useEffect(() => {
        refreshExpenses().then(() => {
            setMounted(true);
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
            const today = now.toISOString().slice(0, 10);
            setCustomDateFrom(firstDay);
            setCustomDateTo(today);
        });
    }, []);

    // Filtered expenses based on date range
    const filteredExpenses = useMemo(() => {
        if (filterRange === 'all') return expenses;
        if (filterRange === 'custom') {
            return expenses.filter(e => {
                if (customDateFrom && e.date < customDateFrom) return false;
                if (customDateTo && e.date > customDateTo) return false;
                return true;
            });
        }
        const today = new Date().toISOString().slice(0, 10);
        if (filterRange === 'today') {
            return expenses.filter(e => e.date === today);
        }
        const days = filterRange === '7d' ? 7 : 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        return expenses.filter(e => e.date >= cutoffStr);
    }, [expenses, filterRange, customDateFrom, customDateTo]);

    const totalFilteredExpenses = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    }, [filteredExpenses]);

    const totalMonthExpenses = useMemo(() => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return expenses.filter(e => e.date.startsWith(currentMonth)).reduce((sum, e) => sum + e.amount, 0);
    }, [expenses]);

    const totalTodayExpenses = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
    }, [expenses]);

    const handleAddExpense = async () => {
        if (!formCategory || !formAmount || !formDate) return;
        await addExpense({
            date: formDate,
            category: formCategory,
            amount: parseFloat(formAmount),
            description: formDescription,
        });
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormCategory('');
        setFormAmount('');
        setFormDescription('');
        setShowAdd(false);
        await refreshExpenses();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this expense record?')) {
            await deleteExpense(id);
            await refreshExpenses();
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Supplies': return 'bg-blue-50 text-blue-600';
            case 'Utilities': return 'bg-amber-50 text-amber-600';
            case 'Marketing': return 'bg-violet-50 text-violet-600';
            case 'Maintenance': return 'bg-teal-50 text-teal-600';
            case 'Salaries': return 'bg-emerald-50 text-emerald-600';
            case 'Rent': return 'bg-rose-50 text-rose-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="flex bg-bg-app min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight font-display">Expenses</h1>
                            <p className="text-slate-500 text-sm mt-1">Track and manage your operational costs.</p>
                        </div>
                        <button
                            onClick={() => setShowAdd(true)}
                            className="flex items-center justify-center gap-2 rounded-xl h-11 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
                        >
                            <Plus size={18} />
                            Log Expense
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 stagger-children">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm card-hover animate-fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                                    <DollarSign size={20} />
                                </div>
                                <span className="font-bold text-slate-400 text-sm">Month-to-Date</span>
                            </div>
                            <p className="text-3xl font-black tracking-tight">₱{mounted ? totalMonthExpenses.toLocaleString('en', { minimumFractionDigits: 2 }) : '—'}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm card-hover animate-fade-in" style={{ animationDelay: '80ms' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <TrendingDown size={20} />
                                </div>
                                <span className="font-bold text-slate-400 text-sm">Today&apos;s Expenses</span>
                            </div>
                            <p className="text-3xl font-black tracking-tight">₱{mounted ? totalTodayExpenses.toLocaleString('en', { minimumFractionDigits: 2 }) : '—'}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm card-hover animate-fade-in" style={{ animationDelay: '160ms' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-11 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500">
                                    <Filter size={20} />
                                </div>
                                <span className="font-bold text-slate-400 text-sm">Filtered Total</span>
                            </div>
                            <p className="text-3xl font-black tracking-tight">₱{mounted ? totalFilteredExpenses.toLocaleString('en', { minimumFractionDigits: 2 }) : '—'}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">{filteredExpenses.length} records</p>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm animate-slide-up">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                                {(['today', '7d', '30d', 'all', 'custom'] as FilterRange[]).map(range => (
                                    <button
                                        key={range}
                                        onClick={() => setFilterRange(range)}
                                        className={clsx(
                                            "px-3 py-2 rounded-lg text-xs font-bold transition-all",
                                            filterRange === range
                                                ? "bg-primary text-white shadow-lg shadow-primary/25"
                                                : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        {range === 'today' ? 'Today' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === 'all' ? 'All' : 'Custom'}
                                    </button>
                                ))}
                            </div>
                            {filterRange === 'custom' && (
                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 animate-fade-in">
                                    <Calendar size={14} className="text-primary shrink-0" />
                                    <input
                                        type="date"
                                        value={customDateFrom}
                                        onChange={(e) => setCustomDateFrom(e.target.value)}
                                        className="border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all"
                                    />
                                    <span className="text-xs text-slate-300 font-bold">→</span>
                                    <input
                                        type="date"
                                        value={customDateTo}
                                        onChange={(e) => setCustomDateTo(e.target.value)}
                                        className="border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expenses Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-slide-up">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[500px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Date</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Category</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Amount</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider hidden md:table-cell">Description</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {mounted && filteredExpenses.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 md:px-6 py-4 text-slate-600 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-slate-400 hidden sm:block" />
                                                    {expense.date}
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-6 py-4">
                                                <span className={clsx("px-2 md:px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider", getCategoryColor(expense.category))}>
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-6 py-4 font-black text-rose-500">
                                                -₱{expense.amount.toFixed(2)}
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-slate-500 max-w-xs truncate hidden md:table-cell">
                                                {expense.description || '—'}
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-right">
                                                <button onClick={() => handleDelete(expense.id)} className="size-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 ml-auto">
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {mounted && filteredExpenses.length === 0 && (
                            <div className="py-16 text-center text-slate-400">
                                <Wallet size={40} className="mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-bold">{expenses.length === 0 ? 'No expenses logged yet' : 'No expenses match this filter'}</p>
                                <p className="text-xs mt-1">{expenses.length === 0 ? 'Click "Log Expense" to start tracking.' : 'Try changing the date range.'}</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Add Expense Modal */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Log New Expense">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Date</label>
                        <input
                            type="date"
                            value={formDate}
                            onChange={(e) => setFormDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all font-display"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
                        <div className="flex flex-wrap gap-2">
                            {expenseCategories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFormCategory(cat)}
                                    className={clsx(
                                        "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                                        formCategory === cat
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Amount (₱)</label>
                        <input
                            type="number"
                            value={formAmount}
                            onChange={(e) => setFormAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-slate-200 rounded-xl py-3 px-4 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all font-display"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Description (optional)</label>
                        <textarea
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="What was this expense for?"
                            rows={3}
                            className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all resize-none"
                        />
                    </div>
                    <button
                        onClick={handleAddExpense}
                        disabled={!formCategory || !formAmount}
                        className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Log Expense
                    </button>
                </div>
            </Modal>
        </div>
    );
}
