"use client";

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import Modal from '@/components/UI/Modal';
import ProductImage from '@/components/UI/ProductImage';
import { useCartStore } from '@/store/useCartStore';
import { getProducts, createOrder } from '@/lib/data';
import { printReceipt } from '@/lib/printReceipt';
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
    const [processing, setProcessing] = useState(false);
    const [sizePickerProduct, setSizePickerProduct] = useState<Product | null>(null);

    const {
        customerType, setCustomerType,
        tableNo, setTableNo,
        cart, addItem, removeItem, updateQuantity,
        getSubtotal, getTotal, getItemCount,
        clearCart
    } = useCartStore();

    useEffect(() => {
        const loadProducts = async () => {
            const data = await getProducts();
            setProducts(data.filter(p => p.is_available));
            setMounted(true);
        };
        loadProducts();
    }, []);

    // Derive categories dynamically from products
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return ['All', ...Array.from(cats).sort()];
    }, [products]);

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

    const handleProductClick = (product: Product) => {
        if (product.sizes && product.sizes.length > 0) {
            // Show size picker
            setSizePickerProduct(product);
        } else {
            // Add directly to cart (no sizes)
            addItem({
                id: product.id,
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image,
            });
        }
    };

    const handleSizeSelect = (product: Product, sizeName: string, sizePrice: number) => {
        const cartId = `${product.id}-${sizeName}`;
        addItem({
            id: cartId,
            productId: product.id,
            name: `${product.name} (${sizeName})`,
            price: sizePrice,
            quantity: 1,
            image: product.image,
            size: sizeName,
        });
        setSizePickerProduct(null);
    };

    const subtotal = getSubtotal();
    const total = getTotal();
    const change = parseFloat(amountPaid || '0') - total;

    const handleProcessPayment = async () => {
        if (paymentMethod === 'Cash' && change < 0) return;
        setProcessing(true);

        try {
            const order = await createOrder({
                customer_type: customerType,
                table_no: tableNo || null,
                items: cart.map(item => ({
                    product_id: item.productId,
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

            if (order) {
                setCompletedOrder(order);
                setShowPayment(false);
                clearCart();
            }
        } catch (err) {
            console.error('Payment processing error:', err);
        } finally {
            setProcessing(false);
        }
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
        <div className="flex bg-bg-app min-h-screen">
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
            <div className="flex bg-bg-app min-h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto flex items-center justify-center p-6">
                        <div className="max-w-md w-full animate-fade-in-scale">
                            {/* Success Header */}
                            <div className="text-center mb-8">
                                <div className="size-20 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4 animate-bounce-subtle">
                                    <Check size={40} className="text-success" />
                                </div>
                                <h2 className="text-2xl font-extrabold tracking-tight mb-1 text-text-primary">Order Complete!</h2>
                                <p className="text-text-tertiary text-sm">Order #{completedOrder.order_number} has been placed.</p>
                            </div>

                            {/* Receipt Card */}
                            <div className="bg-white border border-border rounded-2xl shadow-panel overflow-hidden receipt-printable">
                                <div className="bg-primary p-4 text-center">
                                    <p className="font-extrabold text-lg text-text-on-primary">M Coffee Shop</p>
                                    <p className="text-xs text-text-on-primary/70">Thank you for your order!</p>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between text-xs text-text-tertiary mb-4">
                                        <span>Order #{completedOrder.order_number}</span>
                                        <span>{new Date(completedOrder.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-text-tertiary mb-4 pb-4 border-b border-dashed border-border">
                                        <span>{completedOrder.customer_type}{completedOrder.table_no ? ` • Table ${completedOrder.table_no}` : ''}</span>
                                        <span>{completedOrder.payment_method}</span>
                                    </div>

                                    <div className="space-y-2 mb-4 pb-4 border-b border-dashed border-border">
                                        {completedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-text-secondary">
                                                    <span className="font-bold">{item.quantity}x</span> {item.name}
                                                </span>
                                                <span className="font-bold text-text-primary">₱{item.subtotal.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-text-tertiary">
                                            <span>Subtotal</span>
                                            <span>₱{completedOrder.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-text-tertiary">
                                            <span>Tax</span>
                                            <span>₱{completedOrder.tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-base font-extrabold pt-2 border-t border-border-light mt-2">
                                            <span className="text-text-primary">Total</span>
                                            <span className="text-primary">₱{completedOrder.total.toFixed(2)}</span>
                                        </div>
                                        {completedOrder.payment_method === 'Cash' && (
                                            <>
                                                <div className="flex justify-between text-xs text-text-tertiary mt-1">
                                                    <span>Amount Paid</span>
                                                    <span>₱{completedOrder.amount_paid.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm font-bold text-success mt-1">
                                                    <span>Change</span>
                                                    <span>₱{completedOrder.change.toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => printReceipt(completedOrder)} className="flex-1 py-3.5 rounded-full border border-border font-bold text-sm text-text-secondary hover:bg-bg-muted transition-colors flex items-center justify-center gap-2">
                                    <Printer size={16} />
                                    Print Receipt
                                </button>
                                <button onClick={handleNewOrder} className="flex-1 py-3.5 rounded-full bg-primary text-text-on-primary font-bold text-sm shadow-button hover:bg-primary-hover transition-all flex items-center justify-center gap-2">
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
        <div className="flex bg-bg-app min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-hidden p-4 md:p-6">

                    {/* ─── Step 1: Order Type ─── */}
                    {step === 1 && (
                        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto animate-fade-in">
                            <div className="text-center mb-10">
                                <div className="size-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-button">
                                    <Coffee size={28} className="text-text-on-primary" />
                                </div>
                                <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-text-primary">New Order</h2>
                                <p className="text-text-tertiary text-sm">How will this customer be ordering?</p>
                            </div>
                            <div className="grid grid-cols-2 gap-5 w-full stagger-children">
                                {[
                                    { id: 'Walk-in', icon: User, label: 'Walk-in', desc: 'Quick counter order' },
                                    { id: 'Dine-in', icon: Store, label: 'Dine-in', desc: 'Eating in the shop' },
                                    { id: 'Takeout', icon: MapPin, label: 'Takeout', desc: 'Pack to go' },
                                    { id: 'Delivery', icon: Bike, label: 'Delivery', desc: 'Rider pickup' },
                                ].map((type, idx) => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleTypeSelect(type.id)}
                                        className="flex flex-col items-center justify-center gap-3 p-8 bg-white border border-border rounded-xl shadow-card hover:shadow-panel hover:border-primary/50 transition-all group card-hover animate-fade-in"
                                        style={{ animationDelay: `${idx * 80}ms` }}
                                    >
                                        <div className="size-14 rounded-2xl bg-bg-muted flex items-center justify-center text-text-secondary group-hover:bg-primary group-hover:text-text-on-primary transition-all shadow-sm group-hover:shadow-button group-hover:scale-110">
                                            <type.icon size={26} strokeWidth={1.5} />
                                        </div>
                                        <span className="font-extrabold text-lg text-text-primary">{type.label}</span>
                                        <span className="text-xs text-text-tertiary">{type.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ─── Step 2: Table Selection ─── */}
                    {step === 2 && (
                        <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto animate-fade-in">
                            <h2 className="text-2xl font-extrabold mb-2 tracking-tight text-text-primary">Select Table</h2>
                            <p className="text-text-tertiary text-sm mb-8">Choose a table number for this dine-in order.</p>
                            <div className="bg-white border border-border rounded-2xl p-8 w-full shadow-panel">
                                <div className="grid grid-cols-4 gap-3 mb-6 stagger-children">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => { setTableNo(num); setStep(3); }}
                                            className={clsx(
                                                "aspect-square flex items-center justify-center rounded-xl border-2 font-extrabold text-lg transition-all hover:scale-105 animate-fade-in",
                                                tableNo === num
                                                    ? "bg-primary text-text-on-primary border-transparent shadow-button"
                                                    : "border-border hover:border-primary/50 text-text-primary"
                                            )}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-full py-3 text-text-secondary text-sm font-bold hover:text-text-primary transition-colors flex items-center justify-center gap-2"
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
                                    <button onClick={() => { setStep(1); clearCart(); }} className="size-10 flex items-center justify-center rounded-lg border border-border text-text-tertiary hover:text-text-secondary hover:bg-bg-muted transition-colors shrink-0">
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className="relative flex-1 max-w-xs">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-tertiary" />
                                        <input
                                            type="text"
                                            placeholder="Search menu..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-white border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={clsx(
                                                "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                                                activeCategory === cat
                                                    ? "bg-primary text-text-on-primary shadow-button"
                                                    : "bg-white border border-border text-text-secondary hover:border-primary/40"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Product grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4 overflow-y-auto pr-2 flex-1 stagger-children pb-20 xl:pb-0">
                                    {filteredProducts.map((p, idx) => {
                                        // Check if any size of this product is in cart
                                        const inCartCount = cart
                                            .filter(c => c.productId === p.id)
                                            .reduce((sum, c) => sum + c.quantity, 0);
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => handleProductClick(p)}
                                                className={clsx(
                                                    "bg-white border rounded-xl p-4 shadow-card cursor-pointer group card-hover animate-fade-in relative overflow-hidden",
                                                    inCartCount > 0
                                                        ? "border-primary/50 ring-1 ring-primary/20"
                                                        : "border-border hover:border-primary/40"
                                                )}
                                                style={{ animationDelay: `${(idx % 8) * 40}ms` }}
                                            >
                                                {inCartCount > 0 && (
                                                    <div className="absolute top-3 right-3 size-6 rounded-full bg-primary text-text-on-primary flex items-center justify-center text-[10px] font-extrabold shadow-sm">
                                                        {inCartCount}
                                                    </div>
                                                )}
                                                <ProductImage
                                                    image={p.image}
                                                    name={p.name}
                                                    size="md"
                                                    className="aspect-square bg-bg-muted rounded-lg mb-3 group-hover:scale-105 transition-transform"
                                                />
                                                <h3 className="font-bold text-sm mb-1 truncate text-text-primary">{p.name}</h3>
                                                {p.sizes && p.sizes.length > 0 ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-primary font-extrabold text-sm">₱{p.sizes[0].price.toFixed(0)}</p>
                                                        <span className="text-text-tertiary text-[10px] font-bold">- ₱{p.sizes[p.sizes.length - 1].price.toFixed(0)}</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-primary font-extrabold text-lg">₱{p.price.toFixed(0)}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {filteredProducts.length === 0 && (
                                        <div className="col-span-full py-20 text-center text-text-tertiary">
                                            <Coffee size={40} className="mx-auto mb-3 opacity-50" />
                                            <p className="text-sm font-bold">No products found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Floating Cart Button - visible on tablet/mobile only */}
                            <button
                                onClick={() => setShowCart(true)}
                                className="xl:hidden fixed bottom-6 right-6 z-30 bg-primary text-text-on-primary rounded-full px-6 py-4 shadow-button flex items-center gap-3 font-extrabold text-sm animate-slide-up hover:bg-primary-hover transition-all"
                            >
                                <ShoppingCart size={20} />
                                <span>Cart</span>
                                {getItemCount() > 0 && (
                                    <span className="bg-text-on-primary text-primary text-xs font-extrabold px-2 py-0.5 rounded-full">
                                        {getItemCount()}
                                    </span>
                                )}
                                {total > 0 && (
                                    <span className="opacity-70">₱{total.toFixed(0)}</span>
                                )}
                            </button>

                            {/* Cart Overlay Backdrop - tablet/mobile */}
                            {showCart && (
                                <div
                                    className="xl:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
                                    onClick={() => setShowCart(false)}
                                />
                            )}

                            {/* Cart Panel */}
                            <div className={clsx(
                                "flex flex-col bg-white border border-border overflow-hidden shadow-panel",
                                "xl:w-[340px] xl:relative xl:rounded-2xl xl:animate-slide-right xl:self-start xl:sticky xl:top-0",
                                "xl:translate-y-0 xl:opacity-100",
                                "fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[85vh] xl:max-h-[calc(100vh-140px)] xl:static xl:inset-auto",
                                showCart ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 xl:translate-y-0 xl:opacity-100",
                                "transition-all duration-300 ease-in-out"
                            )}>
                                {/* Cart Header */}
                                <div className="p-4 md:p-5 border-b border-border-light">
                                    <div className="xl:hidden w-10 h-1 bg-border rounded-full mx-auto mb-3" />
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-extrabold text-lg text-text-primary">Cart</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-primary/15 text-primary text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                                                {getItemCount()} items
                                            </span>
                                            <button
                                                onClick={() => setShowCart(false)}
                                                className="xl:hidden size-8 flex items-center justify-center rounded-lg hover:bg-bg-muted text-text-tertiary"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="bg-bg-muted text-text-secondary text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                            {customerType}{tableNo ? ` • T${tableNo}` : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Cart Items */}
                                <div className="flex-1 xl:flex-none overflow-y-auto p-4 space-y-3 xl:max-h-[40vh]">
                                    {cart.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-16">
                                            <ShoppingCart size={48} className="mb-3" />
                                            <p className="text-sm font-bold">Cart is empty</p>
                                            <p className="text-[10px] mt-1">Tap items from the menu</p>
                                        </div>
                                    ) : (
                                        cart.map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg-muted animate-fade-in">
                                                <ProductImage
                                                    image={item.image}
                                                    name={item.name}
                                                    size="sm"
                                                    className="size-10 bg-white rounded-lg border border-border shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-xs truncate text-text-primary">{item.name}</p>
                                                    <p className="text-primary font-extrabold text-xs">₱{(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-white rounded-md p-1 border border-border shrink-0">
                                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity - 1); }} className="size-7 md:size-6 flex items-center justify-center hover:text-error transition-colors rounded text-text-secondary">
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-xs font-extrabold min-w-[1.25rem] text-center text-text-primary">{item.quantity}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity + 1); }} className="size-7 md:size-6 flex items-center justify-center bg-primary text-text-on-primary rounded hover:bg-primary-hover transition-colors">
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Cart Footer / Totals */}
                                <div className="p-4 pb-6 md:p-5 md:pb-7 bg-bg-highlight border-t border-border-light">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-text-tertiary text-xs font-bold">Subtotal</span>
                                        <span className="font-bold text-sm text-text-primary">₱{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                                        <span className="text-text-tertiary text-xs font-bold">Tax (0%)</span>
                                        <span className="font-bold text-sm text-text-primary">₱0.00</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-5">
                                        <span className="font-extrabold text-base text-text-primary">Total</span>
                                        <span className="font-extrabold text-2xl text-primary">₱{total.toFixed(2)}</span>
                                    </div>
                                    <button
                                        disabled={cart.length === 0}
                                        onClick={() => { setShowPayment(true); setShowCart(false); }}
                                        className="w-full bg-primary text-text-on-primary font-extrabold py-4 rounded-full shadow-button hover:bg-primary-hover transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
                                    >
                                        Place Order
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ─── Size Picker Modal ─── */}
            <Modal isOpen={!!sizePickerProduct} onClose={() => setSizePickerProduct(null)} title="Select Size" maxWidth="max-w-sm">
                {sizePickerProduct && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-4">
                            <ProductImage
                                image={sizePickerProduct.image}
                                name={sizePickerProduct.name}
                                size="sm"
                                className="size-14 bg-bg-muted rounded-xl border border-border shrink-0"
                            />
                            <div>
                                <h3 className="font-extrabold text-base text-text-primary">{sizePickerProduct.name}</h3>
                                <p className="text-xs text-text-tertiary">{sizePickerProduct.category}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {sizePickerProduct.sizes?.map((size) => {
                                const cartId = `${sizePickerProduct.id}-${size.name}`;
                                const inCart = cart.find(c => c.id === cartId);
                                return (
                                    <button
                                        key={size.name}
                                        onClick={() => handleSizeSelect(sizePickerProduct, size.name, size.price)}
                                        className={clsx(
                                            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:scale-[1.01]",
                                            inCart
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "size-10 rounded-lg flex items-center justify-center font-extrabold text-xs",
                                                inCart ? "bg-primary text-white" : "bg-bg-muted text-text-secondary"
                                            )}>
                                                {size.name}
                                            </div>
                                            <span className="font-bold text-sm text-text-primary">{size.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {inCart && (
                                                <span className="bg-primary/15 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                                    ×{inCart.quantity}
                                                </span>
                                            )}
                                            <span className="font-extrabold text-primary text-lg">₱{size.price.toFixed(0)}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Modal>

            {/* ─── Payment Modal ─── */}
            <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Process Payment" maxWidth="max-w-md">
                <div className="space-y-5">
                    {/* Payment Method */}
                    <div>
                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">Payment Method</p>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'Cash', icon: Banknote },
                                { id: 'Card', icon: CreditCard },
                                { id: 'E-Wallet', icon: QrCode },
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => { setPaymentMethod(method.id); if (method.id !== 'Cash') setAmountPaid(''); }}
                                    className={clsx(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                        paymentMethod === method.id
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/40"
                                    )}
                                >
                                    <method.icon size={22} className={paymentMethod === method.id ? "text-primary" : "text-text-tertiary"} />
                                    <span className="text-xs font-bold text-text-primary">{method.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-bg-muted rounded-xl p-4">
                        <p className="text-xs font-bold text-text-tertiary mb-3 uppercase tracking-wider">Order Summary</p>
                        <div className="space-y-1.5 mb-3 pb-3 border-b border-border">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-text-secondary">{item.quantity}× {item.name}</span>
                                    <span className="font-bold text-text-primary">₱{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-base font-extrabold">
                            <span className="text-text-primary">Total</span>
                            <span className="text-primary">₱{total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Cash Amount Input */}
                    {paymentMethod === 'Cash' && (
                        <div>
                            <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">Amount Received</p>
                            <input
                                type="number"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                placeholder="Enter amount..."
                                className="w-full border border-border rounded-xl py-3 px-4 text-lg font-extrabold text-center outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 bg-white transition-all text-text-primary"
                            />
                            <div className="grid grid-cols-4 gap-2 mt-3">
                                {quickAmounts.map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setAmountPaid(String(amt))}
                                        className="py-2 rounded-lg border border-border text-sm font-bold hover:bg-bg-muted transition-colors text-text-primary"
                                    >
                                        ₱{amt}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setAmountPaid(String(total))}
                                className="w-full mt-2 py-2 rounded-lg border border-border text-sm font-bold hover:bg-bg-muted transition-colors text-primary"
                            >
                                Exact Amount (₱{total.toFixed(2)})
                            </button>
                            {amountPaid && change >= 0 && (
                                <div className="mt-4 bg-success-bg rounded-xl p-4 text-center animate-fade-in">
                                    <p className="text-xs text-success font-bold uppercase tracking-wider mb-1">Change</p>
                                    <p className="text-2xl font-extrabold text-success">₱{change.toFixed(2)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Process Button */}
                    <button
                        onClick={handleProcessPayment}
                        disabled={(paymentMethod === 'Cash' && (change < 0 || !amountPaid)) || processing}
                        className="w-full bg-primary text-text-on-primary font-extrabold py-4 rounded-full shadow-button hover:bg-primary-hover transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {processing ? (
                            <>
                                <Coffee size={18} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                Complete Payment
                            </>
                        )}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
