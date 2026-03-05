"use client";

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import Modal from '@/components/UI/Modal';
import { getOrders, updateOrder, createOrder } from '@/lib/data';
import { Order, OrderItem } from '@/types/database';
import {
    Search,
    Coffee,
    Eye,
    RotateCcw,
    Trash2,
    Edit3,
    Check,
    X,
    AlertTriangle,
    ChevronDown,
    Calendar,
    Filter,
    Clock,
    ShoppingBag,
    Banknote,
    CreditCard,
    QrCode,
    Plus,
    Minus,
    DollarSign,
    ArrowLeft,
} from 'lucide-react';
import { clsx } from 'clsx';

type ActionType = 'refund' | 'void' | 'edit' | null;

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Detail / Action modals
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [actionType, setActionType] = useState<ActionType>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Edit state
    const [editItems, setEditItems] = useState<OrderItem[]>([]);
    const [editPaymentMethod, setEditPaymentMethod] = useState('Cash');

    // Refund state
    const [refundReason, setRefundReason] = useState('');

    const refreshOrders = async () => {
        const data = await getOrders();
        setOrders(data);
    };

    useEffect(() => {
        refreshOrders().then(() => setMounted(true));
    }, []);

    // Filter orders
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            // Status filter
            if (statusFilter !== 'all' && o.status !== statusFilter) return false;
            // Search filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchesNumber = o.order_number.toLowerCase().includes(q);
                const matchesType = o.customer_type.toLowerCase().includes(q);
                const matchesItems = o.items.some(i => i.name.toLowerCase().includes(q));
                if (!matchesNumber && !matchesType && !matchesItems) return false;
            }
            // Date range filter
            if (dateFrom) {
                const orderDate = new Date(o.created_at).toISOString().split('T')[0];
                if (orderDate < dateFrom) return false;
            }
            if (dateTo) {
                const orderDate = new Date(o.created_at).toISOString().split('T')[0];
                if (orderDate > dateTo) return false;
            }
            return true;
        });
    }, [orders, statusFilter, searchQuery, dateFrom, dateTo]);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    // ─── Order Actions ───

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setShowDetail(true);
        setActionType(null);
    };

    const handleStartRefund = (order: Order) => {
        setSelectedOrder(order);
        setActionType('refund');
        setRefundReason('');
        setShowDetail(false);
    };

    const handleStartVoid = (order: Order) => {
        setSelectedOrder(order);
        setActionType('void');
        setShowDetail(false);
    };

    const handleStartEdit = (order: Order) => {
        setSelectedOrder(order);
        setEditItems(order.items.map(i => ({ ...i })));
        setEditPaymentMethod(order.payment_method);
        setActionType('edit');
        setShowDetail(false);
    };

    const handleConfirmRefund = async () => {
        if (!selectedOrder) return;
        setActionLoading(true);
        try {
            await updateOrder(selectedOrder.id, {
                status: 'Cancelled',
            });
            showToast('success', `Order #${selectedOrder.order_number} has been refunded.`);
            setActionType(null);
            setSelectedOrder(null);
            await refreshOrders();
        } catch {
            showToast('error', 'Failed to process refund.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmVoid = async () => {
        if (!selectedOrder) return;
        setActionLoading(true);
        try {
            await updateOrder(selectedOrder.id, {
                status: 'Cancelled',
            });
            showToast('success', `Order #${selectedOrder.order_number} has been voided.`);
            setActionType(null);
            setSelectedOrder(null);
            await refreshOrders();
        } catch {
            showToast('error', 'Failed to void order.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmEdit = async () => {
        if (!selectedOrder) return;
        setActionLoading(true);
        try {
            const newSubtotal = editItems.reduce((s, i) => s + i.subtotal, 0);
            const newTotal = newSubtotal; // tax = 0

            await updateOrder(selectedOrder.id, {
                items: editItems,
                subtotal: newSubtotal,
                total: newTotal,
                payment_method: editPaymentMethod,
            });
            showToast('success', `Order #${selectedOrder.order_number} has been updated.`);
            setActionType(null);
            setSelectedOrder(null);
            await refreshOrders();
        } catch {
            showToast('error', 'Failed to update order.');
        } finally {
            setActionLoading(false);
        }
    };

    const updateEditItemQty = (idx: number, delta: number) => {
        setEditItems(prev => {
            const next = [...prev];
            const item = { ...next[idx] };
            item.quantity = Math.max(1, item.quantity + delta);
            item.subtotal = item.price * item.quantity;
            next[idx] = item;
            return next;
        });
    };

    const removeEditItem = (idx: number) => {
        setEditItems(prev => prev.filter((_, i) => i !== idx));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-50 text-emerald-600';
            case 'Pending': return 'bg-amber-50 text-amber-600';
            case 'In Progress': return 'bg-blue-50 text-blue-600';
            case 'Ready': return 'bg-violet-50 text-violet-600';
            case 'Cancelled': return 'bg-rose-50 text-rose-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'Cash': return Banknote;
            case 'Card': return CreditCard;
            case 'E-Wallet': return QrCode;
            default: return DollarSign;
        }
    };

    // Stats
    const totalFiltered = filteredOrders.length;
    const totalRevenue = filteredOrders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0);
    const cancelledCount = filteredOrders.filter(o => o.status === 'Cancelled').length;

    return (
        <div className="flex bg-bg-app min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {/* Toast */}
                    {toast && (
                        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold shadow-lg animate-fade-in ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                            {toast.message}
                        </div>
                    )}

                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-in">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight font-display">Order History</h1>
                            <p className="text-slate-500 text-sm mt-1">Manage, refund, edit, or void past orders.</p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 stagger-children">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm card-hover animate-fade-in">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                    <ShoppingBag size={18} />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orders Found</span>
                            </div>
                            <p className="text-2xl font-black tracking-tight">{mounted ? totalFiltered : '—'}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm card-hover animate-fade-in" style={{ animationDelay: '80ms' }}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                                    <DollarSign size={18} />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue</span>
                            </div>
                            <p className="text-2xl font-black tracking-tight">{mounted ? `₱${totalRevenue.toLocaleString('en', { minimumFractionDigits: 2 })}` : '—'}</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm card-hover animate-fade-in" style={{ animationDelay: '160ms' }}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="size-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                                    <RotateCcw size={18} />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Refunded / Voided</span>
                            </div>
                            <p className="text-2xl font-black tracking-tight">{mounted ? cancelledCount : '—'}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm animate-slide-up">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                            {/* Search */}
                            <div className="relative flex-1 w-full lg:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                                />
                            </div>
                            {/* Status filter */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {['all', 'Pending', 'In Progress', 'Ready', 'Completed', 'Cancelled'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={clsx(
                                            "px-3 py-2 rounded-lg text-xs font-bold transition-all",
                                            statusFilter === status
                                                ? "bg-primary text-white shadow-lg shadow-primary/25"
                                                : "bg-slate-50 border border-slate-200 text-slate-500 hover:border-slate-300"
                                        )}
                                    >
                                        {status === 'all' ? 'All' : status}
                                    </button>
                                ))}
                            </div>
                            {/* Date range */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} className="text-slate-400" />
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all"
                                    />
                                </div>
                                <span className="text-xs text-slate-300 font-bold">→</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white transition-all"
                                />
                                {(dateFrom || dateTo) && (
                                    <button
                                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-slide-up">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[700px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Order #</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Date & Time</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Type</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Items</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Total</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Payment</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Status</th>
                                        <th className="px-4 md:px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {mounted && filteredOrders.map((order) => {
                                        const PayIcon = getPaymentIcon(order.payment_method);
                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-4 md:px-6 py-4">
                                                    <span className="font-extrabold text-text-primary">#{order.order_number}</span>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-slate-500 text-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={12} className="text-slate-400" />
                                                        {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                                        <span className="text-slate-300">•</span>
                                                        {new Date(order.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    <span className="text-xs font-bold text-slate-600">{order.customer_type}</span>
                                                    {order.table_no && <span className="text-[10px] text-slate-400 ml-1">T{order.table_no}</span>}
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-xs text-slate-500">
                                                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    <span className={clsx("font-extrabold", order.status === 'Cancelled' ? "text-slate-400 line-through" : "text-text-primary")}>
                                                        ₱{order.total.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <PayIcon size={14} className="text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-500">{order.payment_method}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    <span className={clsx("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider", getStatusColor(order.status))}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <button
                                                            onClick={() => handleViewOrder(order)}
                                                            title="View Details"
                                                            className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                        {order.status !== 'Cancelled' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleStartEdit(order)}
                                                                    title="Edit Order"
                                                                    className="size-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                                                                >
                                                                    <Edit3 size={15} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStartRefund(order)}
                                                                    title="Refund Order"
                                                                    className="size-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors"
                                                                >
                                                                    <RotateCcw size={15} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStartVoid(order)}
                                                                    title="Void / Delete Order"
                                                                    className="size-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {mounted && filteredOrders.length === 0 && (
                            <div className="py-16 text-center text-slate-400">
                                <ShoppingBag size={40} className="mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-bold">No orders found</p>
                                <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* ─── Order Detail Modal ─── */}
            <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title={`Order #${selectedOrder?.order_number || ''}`} maxWidth="max-w-lg">
                {selectedOrder && (
                    <div className="space-y-5">
                        {/* Order Info */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold", getStatusColor(selectedOrder.status))}>
                                {selectedOrder.status}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">
                                {new Date(selectedOrder.created_at).toLocaleString('en-PH')}
                            </span>
                        </div>
                        <div className="flex gap-4 text-sm">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Type</p>
                                <p className="font-bold">{selectedOrder.customer_type}</p>
                            </div>
                            {selectedOrder.table_no && (
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Table</p>
                                    <p className="font-bold">{selectedOrder.table_no}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Payment</p>
                                <p className="font-bold">{selectedOrder.payment_method}</p>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-slate-600">
                                        <span className="font-bold">{item.quantity}×</span> {item.name}
                                    </span>
                                    <span className="font-bold">₱{item.subtotal.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-extrabold text-base">
                                <span>Total</span>
                                <span className="text-primary">₱{selectedOrder.total.toFixed(2)}</span>
                            </div>
                            {selectedOrder.payment_method === 'Cash' && (
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Paid: ₱{selectedOrder.amount_paid.toFixed(2)}</span>
                                    <span>Change: ₱{selectedOrder.change.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {selectedOrder.status !== 'Cancelled' && (
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => handleStartEdit(selectedOrder)}
                                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all group"
                                >
                                    <Edit3 size={18} className="text-slate-400 group-hover:text-amber-500" />
                                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-amber-600">Edit</span>
                                </button>
                                <button
                                    onClick={() => handleStartRefund(selectedOrder)}
                                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-slate-200 hover:border-violet-400 hover:bg-violet-50 transition-all group"
                                >
                                    <RotateCcw size={18} className="text-slate-400 group-hover:text-violet-500" />
                                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-violet-600">Refund</span>
                                </button>
                                <button
                                    onClick={() => handleStartVoid(selectedOrder)}
                                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-slate-200 hover:border-rose-400 hover:bg-rose-50 transition-all group"
                                >
                                    <Trash2 size={18} className="text-slate-400 group-hover:text-rose-500" />
                                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-rose-600">Void</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* ─── Refund Confirmation Modal ─── */}
            <Modal isOpen={actionType === 'refund'} onClose={() => setActionType(null)} title="Refund Order" maxWidth="max-w-sm">
                {selectedOrder && (
                    <div className="space-y-5">
                        <div className="bg-violet-50 rounded-xl p-4 text-center">
                            <div className="size-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3">
                                <RotateCcw size={24} className="text-violet-600" />
                            </div>
                            <p className="font-extrabold text-violet-900 text-lg mb-1">Refund Order #{selectedOrder.order_number}?</p>
                            <p className="text-sm text-violet-600">Amount: <span className="font-extrabold">₱{selectedOrder.total.toFixed(2)}</span></p>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Reason (optional)</label>
                            <textarea
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Why is this order being refunded?"
                                rows={3}
                                className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white transition-all resize-none"
                            />
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 font-medium">This will mark the order as cancelled/refunded. This action cannot be undone.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setActionType(null)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRefund}
                                disabled={actionLoading}
                                className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-lg shadow-violet-600/25 hover:bg-violet-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Coffee size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                                Confirm Refund
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ─── Void/Delete Confirmation Modal ─── */}
            <Modal isOpen={actionType === 'void'} onClose={() => setActionType(null)} title="Void Order" maxWidth="max-w-sm">
                {selectedOrder && (
                    <div className="space-y-5">
                        <div className="bg-rose-50 rounded-xl p-4 text-center">
                            <div className="size-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3">
                                <Trash2 size={24} className="text-rose-600" />
                            </div>
                            <p className="font-extrabold text-rose-900 text-lg mb-1">Void Order #{selectedOrder.order_number}?</p>
                            <p className="text-sm text-rose-600">This removes the order from all calculations.</p>
                        </div>

                        {/* Order summary */}
                        <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-slate-500">
                                    <span>{item.quantity}× {item.name}</span>
                                    <span className="font-bold">₱{item.subtotal.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t border-slate-200 pt-1.5 mt-1.5 flex justify-between font-extrabold text-sm">
                                <span>Total</span>
                                <span className="text-rose-500 line-through">₱{selectedOrder.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5">
                            <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-rose-700 font-medium">This will permanently void this order. It will be marked as cancelled and excluded from reports.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setActionType(null)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmVoid}
                                disabled={actionLoading}
                                className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-600/25 hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Coffee size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                Void Order
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ─── Edit Order Modal ─── */}
            <Modal isOpen={actionType === 'edit'} onClose={() => setActionType(null)} title={`Edit Order #${selectedOrder?.order_number || ''}`} maxWidth="max-w-md">
                {selectedOrder && (
                    <div className="space-y-5">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                            <Edit3 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 font-medium">Modify item quantities, remove items, or change the payment method. The total will be recalculated automatically.</p>
                        </div>

                        {/* Editable Items */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Order Items</label>
                            <div className="space-y-2">
                                {editItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 animate-fade-in">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-xs truncate text-text-primary">{item.name}</p>
                                            <p className="text-primary font-extrabold text-xs">₱{item.subtotal.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white rounded-lg p-1 border border-slate-200 shrink-0">
                                            <button onClick={() => updateEditItemQty(idx, -1)} className="size-7 flex items-center justify-center hover:text-rose-500 transition-colors rounded text-slate-500">
                                                <Minus size={14} />
                                            </button>
                                            <span className="text-xs font-extrabold min-w-[1.25rem] text-center">{item.quantity}</span>
                                            <button onClick={() => updateEditItemQty(idx, 1)} className="size-7 flex items-center justify-center bg-primary text-white rounded hover:bg-primary/80 transition-colors">
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button onClick={() => removeEditItem(idx)} className="size-7 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {editItems.length === 0 && (
                                    <div className="py-6 text-center text-slate-400 text-xs font-bold">
                                        No items remaining. This should be voided instead.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Payment Method</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'Cash', icon: Banknote },
                                    { id: 'Card', icon: CreditCard },
                                    { id: 'E-Wallet', icon: QrCode },
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setEditPaymentMethod(m.id)}
                                        className={clsx(
                                            "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                                            editPaymentMethod === m.id
                                                ? "border-primary bg-primary/5"
                                                : "border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        <m.icon size={18} className={editPaymentMethod === m.id ? "text-primary" : "text-slate-400"} />
                                        <span className="text-[10px] font-bold">{m.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* New Total */}
                        <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Original Total</p>
                                <p className="text-sm text-slate-400 line-through">₱{selectedOrder.total.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">New Total</p>
                                <p className="text-xl font-extrabold text-primary">₱{editItems.reduce((s, i) => s + i.subtotal, 0).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setActionType(null)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmEdit}
                                disabled={actionLoading || editItems.length === 0}
                                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Coffee size={16} className="animate-spin" /> : <Check size={16} />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
