"use client";

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import { getTodayStats, getRecentOrders, getLowStockItems } from '@/lib/data';
import { Order, InventoryItem } from '@/types/database';
import SalesChart from '@/components/Dashboard/SalesChart';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    ShoppingBag,
    TrendingDown,
    ArrowUpRight,
    Clock,
    AlertTriangle,
    Package,
    DollarSign,
    Activity,
    Coffee,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function Dashboard() {
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalExpenses: 0, averageOrderValue: 0 });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const [statsData, ordersData, lowStockData] = await Promise.all([
                getTodayStats(),
                getRecentOrders(8),
                getLowStockItems(),
            ]);
            setStats(statsData);
            setRecentOrders(ordersData);
            setLowStock(lowStockData);
            setMounted(true);
        };
        loadData();
    }, []);

    const statCards = [
        {
            name: "Today's Revenue",
            value: `₱${stats.totalRevenue.toLocaleString('en', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            gradient: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            text: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            name: "Today's Orders",
            value: stats.totalOrders.toString(),
            icon: ShoppingBag,
            gradient: 'from-blue-500 to-indigo-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-600 dark:text-blue-400',
        },
        {
            name: "Today's Expenses",
            value: `₱${stats.totalExpenses.toLocaleString('en', { minimumFractionDigits: 2 })}`,
            icon: TrendingDown,
            gradient: 'from-rose-500 to-pink-600',
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            text: 'text-rose-600 dark:text-rose-400',
        },
        {
            name: 'Avg. Order Value',
            value: `₱${stats.averageOrderValue.toLocaleString('en', { minimumFractionDigits: 2 })}`,
            icon: Activity,
            gradient: 'from-primary to-primary/80',
            bg: 'bg-primary/10',
            text: 'text-primary',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
            case 'Pending': return 'bg-primary/10 text-primary';
            case 'In Progress': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
            case 'Ready': return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400';
            case 'Cancelled': return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="flex bg-slate-50 dark:bg-background-dark min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {/* Page Title */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                    >
                        <div>
                            <h1 className="text-2xl font-black tracking-tight font-display">Good day! ☕</h1>
                            <p className="text-slate-500 text-sm mt-1">Here&apos;s what&apos;s happening at M Coffee Shop today.</p>
                        </div>
                    </motion.div>

                    {/* Stat Cards */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ staggerChildren: 0.1 }}
                        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8"
                    >
                        {statCards.map((stat, idx) => (
                            <motion.div
                                key={stat.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-all"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={clsx("size-11 rounded-xl flex items-center justify-center", stat.bg)}>
                                        <stat.icon size={20} className={stat.text} />
                                    </div>
                                </div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.name}</p>
                                <p className="text-2xl font-black tracking-tight">{mounted ? stat.value : '—'}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Sales Overview Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                <Activity size={16} className="text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-base font-black">Sales Overview</h2>
                                <p className="text-xs text-slate-500">Hourly revenue from today</p>
                            </div>
                        </div>
                        <SalesChart />
                    </motion.div>

                    {/* Two-column layout */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Recent Transactions */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                        <Clock size={16} className="text-blue-500" />
                                    </div>
                                    <h2 className="text-base font-black">Recent Orders</h2>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{recentOrders.length} orders</span>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {!mounted ? (
                                    <div className="py-16 text-center text-slate-400 text-sm">Loading...</div>
                                ) : recentOrders.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <Coffee size={40} className="mx-auto mb-3 text-slate-300" />
                                        <p className="text-sm font-bold text-slate-400">No orders yet today</p>
                                        <p className="text-xs text-slate-400 mt-1">Start taking orders from the POS page!</p>
                                    </div>
                                ) : (
                                    recentOrders.map((order) => (
                                        <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="size-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black text-[10px]">
                                                    #{order.order_number}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{order.customer_type} {order.table_no ? `• Table ${order.table_no}` : ''}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{order.items.length} item{order.items.length !== 1 ? 's' : ''} • {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={clsx("px-2.5 py-1 rounded-full text-[10px] font-bold", getStatusColor(order.status))}>
                                                    {order.status}
                                                </span>
                                                <span className="font-black text-sm">₱{order.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>

                        {/* Inventory Alerts */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <AlertTriangle size={16} className="text-primary" />
                                </div>
                                <h2 className="text-base font-black font-display">Low Stock Alerts</h2>
                            </div>
                            <div className="p-4 space-y-3">
                                {!mounted ? (
                                    <div className="py-12 text-center text-slate-400 text-sm">Loading...</div>
                                ) : lowStock.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Package size={36} className="mx-auto mb-3 text-emerald-400" />
                                        <p className="text-sm font-bold text-emerald-500">All good!</p>
                                        <p className="text-xs text-slate-400 mt-1">All supplies are well-stocked.</p>
                                    </div>
                                ) : (
                                    lowStock.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20">
                                            <div className="size-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                                <AlertTriangle size={14} className="text-rose-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold">{item.name}</p>
                                                <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                                                    {item.stock} {item.unit} remaining (min: {item.min_stock})
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
}
