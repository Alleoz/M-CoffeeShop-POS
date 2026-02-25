"use client";

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import Modal from '@/components/UI/Modal';
import { useCartStore } from '@/store/useCartStore';
import { getProducts, createOrder } from '@/lib/data';
import { Product, Order } from '@/types/database';
import {
    User,
    Store,
    MapPin,
    Bike,
    ShoppingCart,
    Plus,
    Minus,
    ChevronRight,
    ChevronLeft,
    Banknote,
    CreditCard,
    QrCode,
    Check,
    Printer,
    X,
    Search,
    Coffee,
} from 'lucide-react';
import { clsx } from 'clsx';

const categories = ['All', 'Espresso', 'Frappe', 'Pastry', 'Non-Coffee', 'Tea'];

export default function POSPage() {
    const [step, setStep] = useState(1);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
    const [mounted, setMounted] = useState(false);

    const {
        customerType, setCustomerType,
        tableNo, setTableNo,
        cart, addItem, removeItem, updateQuantity,
        getSubtotal, getTotal, getItemCount,
        clearCart
    } = useCartStore();

    useEffect(() => {
        setProducts(getProducts().filter(p => p.is_available));
        setMounted(true);
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [products, activeCategory, searchQuery]);

    const handleTypeSelect = (type: string) => {
        setCustomerType(type);
        if (type === 'Dine-in') {
            setStep(2);
        } else {
            setTableNo('');
            setStep(3);
        }
    };

    const subtotal = getSubtotal();
    const total = getTotal();
    const change = parseFloat(amountPaid || '0') - total;

    const handleProcessPayment = () => {
        if (paymentMethod === 'Cash' && change < 0) return;

        const order = createOrder({
            customer_type: customerType,
            table_no: tableNo || null,
            items: cart.map(item => ({
                product_id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity,
            })),
            subtotal,
            tax: 0,
            total,
            payment_method: paymentMethod,
            amount_paid: paymentMethod === 'Cash' ? parseFloat(amountPaid || '0') : total,
            change: paymentMethod === 'Cash' ? Math.max(0, change) : 0,
            status: 'Pending',
        });

        setCompletedOrder(order);
        setShowPayment(false);
        clearCart();
    };

    const handleNewOrder = () => {
        setCompletedOrder(null);
        setStep(1);
        setAmountPaid('');
        setPaymentMethod('Cash');
        setActiveCategory('All');
        setSearchQuery('');
    };

    const quickAmounts = [100, 200, 500, 1000];

    if (!mounted) return (
        <div className="flex bg-slate-50 dark:bg-background-dark min-h-screen">
            <Sidebar />
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin-slow">
                    <Coffee size={40} className="text-primary" />
                </div>
            </div>
        </div>
    );

    // ─── Order Complete Screen ───
    if (completedOrder) {
        return (
            <div className="flex bg-slate-50 dark:bg-[#0b0f1a] min-h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto flex items-center justify-center p-6">
                        <div className="max-w-md w-full animate-fade-in-scale">
                            {/* Success Header */}
                            <div className="text-center mb-8">
                                <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4 animate-bounce-subtle">
                                    <Check size={40} className="text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight mb-1">Order Complete!</h2>
                                <p className="text-slate-400 text-sm">Order #{completedOrder.order_number} has been placed.</p>
                            </div>

                            {/* Receipt Card */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden receipt-printable">
                                <div className="bg-primary p-4 text-center text-white">
                                    <p className="font-black text-lg font-display">M Coffee Shop</p>
                                    <p className="text-xs opacity-75">Thank you for your order!</p>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between text-xs text-slate-400 mb-4">
                                        <span>Order #{completedOrder.order_number}</span>
                                        <span>{new Date(completedOrder.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400 mb-4 pb-4 border-b border-dashed border-slate-200 dark:border-slate-700">
                                        <span>{completedOrder.customer_type}{completedOrder.table_no ? ` • Table ${completedOrder.table_no}` : ''}</span>
                                        <span>{completedOrder.payment_method}</span>
                                    </div>

                                    <div className="space-y-2 mb-4 pb-4 border-b border-dashed border-slate-200 dark:border-slate-700">
                                        {completedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">
                                                    <span className="font-bold">{item.quantity}x</span> {item.name}
                                                </span>
                                                <span className="font-bold">₱{item.subtotal.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Subtotal</span>
                                            <span>₱{completedOrder.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Tax</span>
                                            <span>₱{completedOrder.tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-base font-black pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                                            <span>Total</span>
                                            <span className="text-primary">₱{completedOrder.total.toFixed(2)}</span>
                                        </div>
                                        {completedOrder.payment_method === 'Cash' && (
                                            <>
                                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                                    <span>Amount Paid</span>
                                                    <span>₱{completedOrder.amount_paid.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm font-bold text-emerald-600 mt-1">
                                                    <span>Change</span>
                                                    <span>₱{completedOrder.change.toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => window.print()} className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                    <Printer size={16} />
                                    Print Receipt
                                </button>
                                <button onClick={handleNewOrder} className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                    New Order
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-slate-50 dark:bg-[#0b0f1a] min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-hidden p-4 md:p-6">

                    {/* ─── Step 1: Order Type ─── */}
                    {step === 1 && (
                        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto animate-fade-in">
                            <div className="text-center mb-10">
                                <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-primary/25">
                                    <Coffee size={28} />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight mb-2 font-display">New Order</h2>
                                <p className="text-slate-400 text-sm">How will this customer be ordering?</p>
                            </div>
                            <div className="grid grid-cols-2 gap-5 w-full stagger-children">
                                {[
                                    { id: 'Walk-in', icon: User, label: 'Walk-in', desc: 'Quick counter order', gradient: 'from-blue-500 to-indigo-600' },
                                    { id: 'Dine-in', icon: Store, label: 'Dine-in', desc: 'Eating in the shop', gradient: 'from-emerald-500 to-teal-600' },
                                    { id: 'Takeout', icon: MapPin, label: 'Takeout', desc: 'Pack to go', gradient: 'from-amber-500 to-orange-600' },
                                    { id: 'Delivery', icon: Bike, label: 'Delivery', desc: 'Rider pickup', gradient: 'from-violet-500 to-purple-600' },
                                ].map((type, idx) => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleTypeSelect(type.id)}
                                        className="flex flex-col items-center justify-center gap-3 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/40 dark:hover:border-primary/40 transition-all group card-hover animate-fade-in"
                                        style={{ animationDelay: `${idx * 80}ms` }}
                                    >
                                        <div className={`size-16 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                            <type.icon size={28} />
                                        </div>
                                        <span className="font-black text-lg font-display">{type.label}</span>
                                        <span className="text-xs text-slate-400">{type.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ─── Step 2: Table Selection ─── */}
                    {step === 2 && (
                        <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto animate-fade-in">
                            <h2 className="text-2xl font-black mb-2 tracking-tight">Select Table</h2>
                            <p className="text-slate-400 text-sm mb-8">Choose a table number for this dine-in order.</p>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 w-full shadow-lg">
                                <div className="grid grid-cols-4 gap-3 mb-6 stagger-children">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => { setTableNo(num); setStep(3); }}
                                            className={clsx(
                                                "aspect-square flex items-center justify-center rounded-xl border-2 font-black text-lg transition-all hover:scale-105 animate-fade-in",
                                                tableNo === num
                                                    ? "bg-primary text-white border-transparent shadow-lg shadow-primary/25"
                                                    : "border-slate-200 dark:border-slate-700 hover:border-primary/40 dark:hover:border-primary/40"
                                            )}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-full py-3 text-slate-500 text-sm font-bold hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ChevronLeft size={16} />
                                    Back to Order Type
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ─── Step 3: Menu + Cart ─── */}
                    {step === 3 && (
                        <div className="h-full flex gap-4 xl:gap-6 animate-fade-in relative">
                            {/* Menu Section */}
                            <div className="flex-1 flex flex-col min-w-0">
                                {/* Category Tabs & Search */}
                                <div className="flex items-center gap-3 mb-5">
                                    <button onClick={() => { setStep(1); clearCart(); }} className="size-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0">
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className="relative flex-1 max-w-xs">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search menu..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={clsx(
                                                "px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                                                activeCategory === cat
                                                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                                                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/40 dark:hover:border-primary/40"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Product grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4 overflow-y-auto pr-2 flex-1 stagger-children pb-20 xl:pb-0">
                                    {filteredProducts.map((p, idx) => {
                                        const inCart = cart.find(c => c.id === p.id);
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => addItem({ id: p.id, name: p.name, price: p.price, quantity: 1, image: p.image })}
                                                className={clsx(
                                                    "bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm cursor-pointer group card-hover animate-fade-in relative overflow-hidden",
                                                    inCart
                                                        ? "border-primary/40 dark:border-primary/60 ring-1 ring-primary/20"
                                                        : "border-slate-200 dark:border-slate-800 hover:border-primary/40"
                                                )}
                                                style={{ animationDelay: `${(idx % 8) * 40}ms` }}
                                            >
                                                {inCart && (
                                                    <div className="absolute top-3 right-3 size-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shadow-md">
                                                        {inCart.quantity}
                                                    </div>
                                                )}
                                                <div className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-xl mb-3 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                                                    {p.image}
                                                </div>
                                                <h3 className="font-bold text-sm mb-1 truncate">{p.name}</h3>
                                                <p className="text-primary font-black text-lg">₱{p.price.toFixed(0)}</p>
                                            </div>
                                        );
                                    })}
                                    {filteredProducts.length === 0 && (
                                        <div className="col-span-full py-20 text-center text-slate-400">
                                            <Coffee size={40} className="mx-auto mb-3 opacity-50" />
                                            <p className="text-sm font-bold">No products found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Floating Cart Button - visible on tablet/mobile only */}
                            <button
                                onClick={() => setShowCart(true)}
                                className="xl:hidden fixed bottom-6 right-6 z-30 bg-primary text-white rounded-2xl px-6 py-4 shadow-2xl shadow-primary/30 flex items-center gap-3 font-black text-sm animate-slide-up"
                            >
                                <ShoppingCart size={20} />
                                <span>Cart</span>
                                {getItemCount() > 0 && (
                                    <span className="bg-white text-primary text-xs font-black px-2 py-0.5 rounded-full">
                                        {getItemCount()}
                                    </span>
                                )}
                                {total > 0 && (
                                    <span className="text-white/80">₱{total.toFixed(0)}</span>
                                )}
                            </button>

                            {/* Cart Overlay Backdrop - tablet/mobile */}
                            {showCart && (
                                <div
                                    className="xl:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
                                    onClick={() => setShowCart(false)}
                                />
                            )}

                            {/* Cart Panel */}
                            <div className={clsx(
                                "flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl",
                                // Desktop: fixed width sidebar
                                "xl:w-[340px] xl:relative xl:rounded-2xl xl:animate-slide-right",
                                // Tablet/Mobile: slide-up overlay from bottom
                                "xl:translate-y-0 xl:opacity-100",
                                "fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[85vh] xl:max-h-none xl:static xl:inset-auto",
                                showCart ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 xl:translate-y-0 xl:opacity-100",
                                "transition-all duration-300 ease-in-out"
                            )}>
                                {/* Cart Header */}
                                <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800">
                                    {/* Drag handle - mobile only */}
                                    <div className="xl:hidden w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-3" />
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-lg font-display">Cart</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-full">
                                                {getItemCount()} items
                                            </span>
                                            <button
                                                onClick={() => setShowCart(false)}
                                                className="xl:hidden size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                            {customerType}{tableNo ? ` • T${tableNo}` : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Cart Items */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {cart.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-16">
                                            <ShoppingCart size={48} className="mb-3" />
                                            <p className="text-sm font-bold">Cart is empty</p>
                                            <p className="text-[10px] mt-1">Tap items from the menu</p>
                                        </div>
                                    ) : (
                                        cart.map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 animate-fade-in">
                                                <div className="size-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-xl border border-slate-200 dark:border-slate-700 shrink-0">
                                                    {item.image}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-xs truncate">{item.name}</p>
                                                    <p className="text-primary font-black text-xs">₱{(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shrink-0">
                                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity - 1); }} className="size-7 md:size-6 flex items-center justify-center hover:text-rose-500 transition-colors rounded">
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-xs font-black min-w-[1.25rem] text-center">{item.quantity}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity + 1); }} className="size-7 md:size-6 flex items-center justify-center hover:text-emerald-500 transition-colors rounded">
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Cart Footer / Totals */}
                                <div className="p-4 md:p-5 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-slate-400 text-xs font-bold">Subtotal</span>
                                        <span className="font-bold text-sm">₱{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                        <span className="text-slate-400 text-xs font-bold">Tax (0%)</span>
                                        <span className="font-bold text-sm">₱0.00</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-5">
                                        <span className="font-black text-base font-display">Total</span>
                                        <span className="font-black text-2xl text-primary">₱{total.toFixed(2)}</span>
                                    </div>
                                    <button
                                        disabled={cart.length === 0}
                                        onClick={() => { setShowPayment(true); setShowCart(false); }}
                                        className="w-full bg-primary text-white font-black py-4 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
                                    >
                                        Process Payment
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ─── Payment Modal ─── */}
            <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Process Payment" maxWidth="max-w-md">
                <div className="space-y-5">
                    {/* Payment Method */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payment Method</p>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'Cash', icon: Banknote, color: 'emerald' },
                                { id: 'Card', icon: CreditCard, color: 'blue' },
                                { id: 'E-Wallet', icon: QrCode, color: 'violet' },
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => { setPaymentMethod(method.id); if (method.id !== 'Cash') setAmountPaid(''); }}
                                    className={clsx(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                        paymentMethod === method.id
                                            ? "border-primary bg-primary/5 dark:bg-primary/10 dark:border-primary"
                                            : "border-slate-200 dark:border-slate-700 hover:border-primary/40"
                                    )}
                                >
                                    <method.icon size={22} className={paymentMethod === method.id ? "text-primary" : "text-slate-400"} />
                                    <span className="text-xs font-bold">{method.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                        <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Order Summary</p>
                        <div className="space-y-1.5 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-slate-500">{item.quantity}× {item.name}</span>
                                    <span className="font-bold">₱{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-base font-black font-display">
                            <span>Total</span>
                            <span className="text-primary">₱{total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Cash Amount Input */}
                    {paymentMethod === 'Cash' && (
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Amount Received</p>
                            <input
                                type="number"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                placeholder="Enter amount..."
                                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-lg font-black text-center outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white dark:bg-slate-900 transition-all font-display"
                            />
                            <div className="grid grid-cols-4 gap-2 mt-3">
                                {quickAmounts.map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setAmountPaid(String(amt))}
                                        className="py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        ₱{amt}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setAmountPaid(String(total))}
                                className="w-full mt-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-primary"
                            >
                                Exact Amount (₱{total.toFixed(2)})
                            </button>
                            {amountPaid && change >= 0 && (
                                <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center animate-fade-in">
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Change</p>
                                    <p className="text-2xl font-black text-emerald-600">₱{change.toFixed(2)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Process Button */}
                    <button
                        onClick={handleProcessPayment}
                        disabled={paymentMethod === 'Cash' && (change < 0 || !amountPaid)}
                        className="w-full bg-primary text-white font-black py-4 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        <Check size={18} />
                        Complete Payment
                    </button>
                </div>
            </Modal>
        </div>
    );
}
