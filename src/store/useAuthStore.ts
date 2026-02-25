import { create } from 'zustand';

interface AuthStore {
    isAuthenticated: boolean;
    user: { name: string; role: string } | null;
    login: (pin: string) => boolean;
    logout: () => void;
    checkAuth: () => boolean;
}

// Admin credentials - in production, use a secure backend
const ADMIN_PIN = '1234';
const ADMIN_USER = { name: 'M Coffee Admin', role: 'Administrator' };

const AUTH_KEY = 'mcoffee_auth';

export const useAuthStore = create<AuthStore>((set, get) => ({
    isAuthenticated: false,
    user: null,

    login: (pin: string) => {
        if (pin === ADMIN_PIN) {
            const session = { isAuthenticated: true, user: ADMIN_USER, timestamp: Date.now() };
            if (typeof window !== 'undefined') {
                localStorage.setItem(AUTH_KEY, JSON.stringify(session));
            }
            set({ isAuthenticated: true, user: ADMIN_USER });
            return true;
        }
        return false;
    },

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_KEY);
        }
        set({ isAuthenticated: false, user: null });
    },

    checkAuth: () => {
        if (typeof window === 'undefined') return false;
        try {
            const raw = localStorage.getItem(AUTH_KEY);
            if (!raw) return false;
            const session = JSON.parse(raw);
            // Session expires after 12 hours
            if (Date.now() - session.timestamp > 12 * 60 * 60 * 1000) {
                localStorage.removeItem(AUTH_KEY);
                set({ isAuthenticated: false, user: null });
                return false;
            }
            set({ isAuthenticated: true, user: session.user });
            return true;
        } catch {
            return false;
        }
    },
}));
