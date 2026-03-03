import { create } from 'zustand';

interface OwnerInfo {
    id: string;
    email: string;
    business_name: string;
    is_approved: boolean;
}

interface OwnerAuthStore {
    isOwnerAuthenticated: boolean;
    owner: OwnerInfo | null;
    isLoading: boolean;
    error: string | null;
    isPending: boolean;

    loginOwner: (email: string, password: string) => Promise<boolean>;
    registerOwner: (email: string, password: string, business_name?: string) => Promise<{ success: boolean; pending?: boolean }>;
    logoutOwner: () => void;
    checkOwnerAuth: () => boolean;
    checkOwnerExists: () => Promise<{ exists: boolean; is_approved?: boolean }>;
    clearError: () => void;
}

const OWNER_KEY = 'mcoffee_owner';
const OWNER_SESSION_KEY = 'mcoffee_owner_session_ts';
const OWNER_SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export const useOwnerAuthStore = create<OwnerAuthStore>((set, get) => ({
    isOwnerAuthenticated: false,
    owner: null,
    isLoading: false,
    error: null,
    isPending: false,

    loginOwner: async (email: string, password: string) => {
        set({ isLoading: true, error: null, isPending: false });

        try {
            const res = await fetch('/api/owner/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                set({
                    isLoading: false,
                    error: data.error || 'Login failed.',
                    isPending: data.pending || false,
                });
                return false;
            }

            // Store owner info
            const ownerInfo: OwnerInfo = data.owner;
            if (typeof window !== 'undefined') {
                localStorage.setItem(OWNER_KEY, JSON.stringify(ownerInfo));
                localStorage.setItem(OWNER_SESSION_KEY, String(Date.now()));
            }

            set({
                isOwnerAuthenticated: true,
                owner: ownerInfo,
                isLoading: false,
                error: null,
                isPending: false,
            });

            return true;
        } catch (err) {
            console.error('Owner login error:', err);
            set({ isLoading: false, error: 'Network error. Please try again.' });
            return false;
        }
    },

    registerOwner: async (email: string, password: string, business_name?: string) => {
        set({ isLoading: true, error: null, isPending: false });

        try {
            const res = await fetch('/api/owner/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, business_name }),
            });

            const data = await res.json();

            if (!res.ok) {
                set({
                    isLoading: false,
                    error: data.error || 'Registration failed.',
                });
                return { success: false };
            }

            set({
                isLoading: false,
                error: null,
                isPending: true,
            });

            return { success: true, pending: true };
        } catch (err) {
            console.error('Owner register error:', err);
            set({ isLoading: false, error: 'Network error. Please try again.' });
            return { success: false };
        }
    },

    logoutOwner: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(OWNER_KEY);
            localStorage.removeItem(OWNER_SESSION_KEY);
        }
        set({
            isOwnerAuthenticated: false,
            owner: null,
            error: null,
            isPending: false,
        });
    },

    checkOwnerAuth: () => {
        if (typeof window === 'undefined') return false;

        try {
            const ts = localStorage.getItem(OWNER_SESSION_KEY);
            if (!ts || Date.now() - Number(ts) > OWNER_SESSION_DURATION) {
                get().logoutOwner();
                return false;
            }

            const raw = localStorage.getItem(OWNER_KEY);
            if (!raw) {
                get().logoutOwner();
                return false;
            }

            const ownerInfo = JSON.parse(raw) as OwnerInfo;
            if (!ownerInfo.is_approved) {
                get().logoutOwner();
                return false;
            }

            set({ isOwnerAuthenticated: true, owner: ownerInfo });
            return true;
        } catch {
            get().logoutOwner();
            return false;
        }
    },

    checkOwnerExists: async () => {
        try {
            const res = await fetch('/api/owner/status');
            const data = await res.json();
            return {
                exists: data.exists || false,
                is_approved: data.owner?.is_approved,
            };
        } catch {
            return { exists: false };
        }
    },

    clearError: () => set({ error: null, isPending: false }),
}));
