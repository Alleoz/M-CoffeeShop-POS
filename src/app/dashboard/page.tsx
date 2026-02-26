"use client";

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import { getTodayStats, getRecentOrders, getLowStockItems } from '@/lib/data';
import { Order, InventoryItem } from '@/types/database';
import SalesChart from '@/components/Dashboard/SalesChart';
import { motion } from 'framer-motion';
import {
    ShoppingBag,
    TrendingDown,
    Clock,
    AlertTriangle,
    Boxes,
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
            bg: 'bg-success-bg',
            text: 'text-success',
        },
        {
            name: "Today's Orders",
            value: stats.totalOrders.toString(),
            icon: ShoppingBag,
            bg: 'bg-blue-50',
            text: 'text-blue-600',
        },
        {
            name: "Today's Expenses",
            value: `₱${stats.totalExpenses.toLocaleString('en', { minimumFractionDigits: 2 })}`,
            icon: TrendingDown,
            bg: 'bg-error-bg',
            text: 'text-error',
        },
        {
            name: 'Avg. Order Value',
            value: `₱${stats.averageOrderValue.toLocaleString('en', { minimumFractionDigits: 2 })}`,
            icon: Activity,
            bg: 'bg-primary/10',
            text: 'text-primary',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-success-bg text-success';
            case 'Pending': return 'bg-warning-bg text-warning';
            case 'In Progress': return 'bg-blue-50 text-blue-600';
            case 'Ready': return 'bg-primary/10 text-primary';
            case 'Cancelled': return 'bg-bg-muted text-text-tertiary';
            default: return 'bg-bg-muted text-text-secondary';
        }
    };

    return (
        <div className="flex bg-bg-app min-h-screen">
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
                            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Good day! ☕</h1>
                            <p className="text-text-secondary text-sm mt-1">Here&apos;s what&apos;s happening at M Coffee Shop today.</p>
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
                                whileHover={{ y: -4, boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.06)" }}
                                className="bg-white rounded-xl border border-border p-5 shadow-card transition-all"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={clsx("size-11 rounded-xl flex items-center justify-center", stat.bg)}>
                                        <stat.icon size={20} className={stat.text} />
                                    </div>
                                </div>
                                <p className="text-text-tertiary text-xs font-bold uppercase tracking-wider mb-1">{stat.name}</p>
                                <p className="text-2xl font-extrabold tracking-tight text-text-primary">{mounted ? stat.value : '—'}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Sales Overview Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="bg-white rounded-xl border border-border p-6 shadow-card mb-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-9 rounded-lg bg-success-bg flex items-center justify-center">
                                <Activity size={16} className="text-success" />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-text-primary">Sales Overview</h2>
                                <p className="text-xs text-text-secondary">Hourly revenue from today</p>
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
                            className="xl:col-span-2 bg-white rounded-xl border border-border shadow-card overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-border-light flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Clock size={16} className="text-blue-500" />
                                    </div>
                                    <h2 className="text-base font-extrabold text-text-primary">Recent Orders</h2>
                                </div>
                                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{recentOrders.length} orders</span>
                            </div>
                            <div className="divide-y divide-border-light">
                                {!mounted ? (
                                    <div className="py-16 text-center text-text-tertiary text-sm">Loading...</div>
                                ) : recentOrders.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <Coffee size={40} className="mx-auto mb-3 text-text-tertiary opacity-40" />
                                        <p className="text-sm font-bold text-text-tertiary">No orders yet today</p>
                                        <p className="text-xs text-text-tertiary mt-1">Start taking orders from the POS page!</p>
                                    </div>
                                ) : (
                                    recentOrders.map((order) => (
                                        <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-bg-highlight transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="size-9 rounded-lg bg-bg-muted flex items-center justify-center text-text-secondary font-extrabold text-[10px]">
                                                    #{order.order_number}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text-primary">{order.customer_type} {order.table_no ? `• Table ${order.table_no}` : ''}</p>
                                                    <p className="text-[10px] text-text-tertiary mt-0.5">{order.items.length} item{order.items.length !== 1 ? 's' : ''} • {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={clsx("px-2.5 py-1 rounded-full text-[10px] font-bold", getStatusColor(order.status))}>
                                                    {order.status}
                                                </span>
                                                <span className="font-extrabold text-sm text-text-primary">₱{order.total.toFixed(2)}</span>
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
                            className="bg-white rounded-xl border border-border shadow-card overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-border-light flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-warning-bg flex items-center justify-center">
                                    <AlertTriangle size={16} className="text-warning" />
                                </div>
                                <h2 className="text-base font-extrabold text-text-primary">Low Stock Alerts</h2>
                            </div>
                            <div className="p-4 space-y-3">
                                {!mounted ? (
                                    <div className="py-12 text-center text-text-tertiary text-sm">Loading...</div>
                                ) : lowStock.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Boxes size={36} className="mx-auto mb-3 text-success opacity-60" />
                                        <p className="text-sm font-bold text-success">All good!</p>
                                        <p className="text-xs text-text-tertiary mt-1">All supplies are well-stocked.</p>
                                    </div>
                                ) : (
                                    lowStock.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-error-bg/50 border border-error/10">
                                            <div className="size-9 rounded-lg bg-error-bg flex items-center justify-center">
                                                <AlertTriangle size={14} className="text-error" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-text-primary">{item.name}</p>
                                                <p className="text-[10px] text-error font-bold mt-0.5">
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
