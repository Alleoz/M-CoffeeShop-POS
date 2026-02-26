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
} from 'lucide-react';
import { clsx } from 'clsx';

const expenseCategories = ['Supplies', 'Utilities', 'Marketing', 'Maintenance', 'Salaries', 'Rent', 'Miscellaneous'];

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [mounted, setMounted] = useState(false);

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
        refreshExpenses().then(() => setMounted(true));
    }, []);

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
            case 'Supplies': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
            case 'Utilities': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
            case 'Marketing': return 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400';
            case 'Maintenance': return 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400';
            case 'Salaries': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
            case 'Rent': return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    return (
        <div className="flex bg-slate-50 dark:bg-background-dark min-h-screen">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 stagger-children">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm card-hover animate-fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-11 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
                                    <DollarSign size={20} />
                                </div>
                                <span className="font-bold text-slate-400 text-sm">Month-to-Date</span>
                            </div>
                            <p className="text-3xl font-black tracking-tight">₱{mounted ? totalMonthExpenses.toLocaleString('en', { minimumFractionDigits: 2 }) : '—'}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm card-hover animate-fade-in" style={{ animationDelay: '80ms' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <TrendingDown size={20} />
                                </div>
                                <span className="font-bold text-slate-400 text-sm">Today&apos;s Expenses</span>
                            </div>
                            <p className="text-3xl font-black tracking-tight">₱{mounted ? totalTodayExpenses.toLocaleString('en', { minimumFractionDigits: 2 }) : '—'}</p>
                        </div>
                    </div>

                    {/* Expenses Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm animate-slide-up">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[500px]">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Date</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Category</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Amount</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider hidden md:table-cell">Description</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {mounted && expenses.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-4 md:px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
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
                                            <td className="px-4 md:px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate hidden md:table-cell">
                                                {expense.description || '—'}
                                            </td>
                                            <td className="px-4 md:px-6 py-4 text-right">
                                                <button onClick={() => handleDelete(expense.id)} className="size-8 flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 ml-auto">
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {mounted && expenses.length === 0 && (
                            <div className="py-16 text-center text-slate-400">
                                <Wallet size={40} className="mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-bold">No expenses logged yet</p>
                                <p className="text-xs mt-1">Click &quot;Log Expense&quot; to start tracking.</p>
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
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white dark:bg-slate-900 transition-all font-display"
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
                                            ? "border-primary bg-primary/5 text-primary dark:bg-primary/10 dark:border-primary dark:text-primary"
                                            : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
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
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white dark:bg-slate-900 transition-all font-display"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Description (optional)</label>
                        <textarea
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="What was this expense for?"
                            rows={3}
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white dark:bg-slate-900 transition-all resize-none"
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
