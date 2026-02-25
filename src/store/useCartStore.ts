import { create } from 'zustand';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

interface CartStore {
    cart: CartItem[];
    customerType: string;
    tableNo: string;
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    setCustomerType: (type: string) => void;
    setTableNo: (table: string) => void;
    clearCart: () => void;
    getSubtotal: () => number;
    getTax: () => number;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
    cart: [],
    customerType: 'Walk-in',
    tableNo: '',
    addItem: (item) => set((state) => {
        const existing = state.cart.find((i) => i.id === item.id);
        if (existing) {
            return {
                cart: state.cart.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                )
            };
        }
        return { cart: [...state.cart, { ...item, quantity: 1 }] };
    }),
    removeItem: (id) => set((state) => ({
        cart: state.cart.filter((i) => i.id !== id)
    })),
    updateQuantity: (id, quantity) => set((state) => {
        if (quantity <= 0) {
            return { cart: state.cart.filter((i) => i.id !== id) };
        }
        return {
            cart: state.cart.map((i) =>
                i.id === id ? { ...i, quantity } : i
            )
        };
    }),
    setCustomerType: (customerType) => set({ customerType }),
    setTableNo: (tableNo) => set({ tableNo }),
    clearCart: () => set({ cart: [], customerType: 'Walk-in', tableNo: '' }),
    getSubtotal: () => {
        return get().cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    },
    getTax: () => {
        return 0; // Can be configured later
    },
    getTotal: () => {
        return get().getSubtotal() + get().getTax();
    },
    getItemCount: () => {
        return get().cart.reduce((acc, item) => acc + item.quantity, 0);
    },
}));
