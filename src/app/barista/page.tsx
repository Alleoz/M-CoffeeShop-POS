"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import { getOrders, updateOrder } from '@/lib/data';
import { Order } from '@/types/database';
import {
    Clock,
    CheckCircle2,
    PlayCircle,
    Coffee,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function BaristaScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [mounted, setMounted] = useState(false);

    const refreshOrders = async () => {
        const allOrders = await getOrders();
        setOrders(allOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled'));
    };

    useEffect(() => {
        refreshOrders().then(() => setMounted(true));
        const interval = setInterval(refreshOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const moveStatus = async (id: string, nextStatus: Order['status']) => {
        await updateOrder(id, {
            status: nextStatus,
            ...(nextStatus === 'Completed' ? { completed_at: new Date().toISOString() } : {}),
        });
        await refreshOrders();
    };

    const getTimeSince = (dateStr: string) => {
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    const pendingOrders = orders.filter(o => o.status === 'Pending');
    const inProgressOrders = orders.filter(o => o.status === 'In Progress');
    const readyOrders = orders.filter(o => o.status === 'Ready');

    return (
        <div className="flex bg-slate-50 dark:bg-background-dark min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-hidden flex flex-col">
                    {/* KDS Sub-header */}
                    <div className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <Coffee size={18} />
                            </div>
                            <div>
                                <h1 className="font-black text-lg tracking-tight leading-none font-display">Barista KDS</h1>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kitchen Display System</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={refreshOrders} className="size-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/5 transition-all">
                                <RefreshCw size={16} />
                            </button>
                            <div className="text-right">
                                <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                    <span className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                                    Live
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* KDS Columns */}
                    <div className="flex-1 overflow-auto p-4 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6">
                        {/* Pending Column */}
                        <div className="lg:w-1/3 lg:min-w-[280px] flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="font-black text-sm uppercase text-slate-400 flex items-center gap-2">
                                    <AlertCircle size={14} className="text-primary" />
                                    Pending
                                </h2>
                                <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-full">
                                    {pendingOrders.length}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                                {pendingOrders.length === 0 && (
                                    <div className="text-center py-20 opacity-40">
                                        <Coffee size={32} className="mx-auto mb-2" />
                                        <p className="text-xs font-bold">No pending orders</p>
                                    </div>
                                )}
                                {pendingOrders.map((order, idx) => (
                                    <div key={order.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-primary/40 dark:hover:border-primary/40 transition-all animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-black text-slate-400">ORDER #{order.order_number}</p>
                                                <p className="text-sm font-black mt-0.5">{order.customer_type}{order.table_no ? ` • Table ${order.table_no}` : ''}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                                                <Clock size={12} />
                                                {getTimeSince(order.created_at)}
                                            </div>
                                        </div>
                                        <ul className="space-y-2 mb-5">
                                            {order.items.map((item, i) => (
                                                <li key={i} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                                        <span className="size-1.5 rounded-full bg-primary" />
                                                        {item.name}
                                                    </div>
                                                    <span className="text-xs font-black text-slate-400">×{item.quantity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => moveStatus(order.id, 'In Progress')}
                                            className="w-full py-3 rounded-xl bg-primary text-white font-black text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                        >
                                            <PlayCircle size={14} />
                                            Start Prep
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* In Progress Column */}
                        <div className="lg:w-1/3 lg:min-w-[280px] flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="font-black text-sm uppercase text-slate-400 flex items-center gap-2">
                                    <PlayCircle size={14} className="text-blue-500" />
                                    In Progress
                                </h2>
                                <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full">
                                    {inProgressOrders.length}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                                {inProgressOrders.length === 0 && (
                                    <div className="text-center py-20 opacity-40">
                                        <Coffee size={32} className="mx-auto mb-2" />
                                        <p className="text-xs font-bold">No orders in progress</p>
                                    </div>
                                )}
                                {inProgressOrders.map((order, idx) => (
                                    <div key={order.id} className="bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 shadow-sm animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-black text-blue-500 uppercase tracking-wider">PREPARING</p>
                                                <p className="text-sm font-black mt-0.5">{order.customer_type}{order.table_no ? ` • Table ${order.table_no}` : ''}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-blue-400 text-[10px] font-bold">
                                                <Clock size={12} />
                                                {getTimeSince(order.created_at)}
                                            </div>
                                        </div>
                                        <ul className="space-y-2 mb-5">
                                            {order.items.map((item, i) => (
                                                <li key={i} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                                        <span className="size-1.5 rounded-full bg-blue-500" />
                                                        {item.name}
                                                    </div>
                                                    <span className="text-xs font-black text-slate-400">×{item.quantity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => moveStatus(order.id, 'Ready')}
                                            className="w-full py-3 rounded-xl bg-primary text-white font-black text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                        >
                                            <CheckCircle2 size={14} />
                                            Mark as Ready
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ready Column */}
                        <div className="lg:w-1/3 lg:min-w-[280px] flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="font-black text-sm uppercase text-slate-400 flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    Ready to Serve
                                </h2>
                                <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full">
                                    {readyOrders.length}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                                {readyOrders.length === 0 && (
                                    <div className="text-center py-20 opacity-40">
                                        <Coffee size={32} className="mx-auto mb-2" />
                                        <p className="text-xs font-bold">No ready orders</p>
                                    </div>
                                )}
                                {readyOrders.map((order, idx) => (
                                    <div key={order.id} className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-5 animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-black text-emerald-500">READY TO SERVE</p>
                                                <p className="text-sm font-black mt-0.5">{order.customer_type}{order.table_no ? ` • Table ${order.table_no}` : ''}</p>
                                            </div>
                                            <CheckCircle2 size={18} className="text-emerald-500" />
                                        </div>
                                        <ul className="space-y-2 mb-5">
                                            {order.items.map((item, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                                    <CheckCircle2 size={12} className="text-emerald-400" />
                                                    {item.name} <span className="text-xs text-slate-400">×{item.quantity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => moveStatus(order.id, 'Completed')}
                                            className="w-full py-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 text-emerald-600 font-black text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={14} />
                                            Complete Order
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
