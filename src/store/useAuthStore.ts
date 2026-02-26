import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface StaffInfo {
    id: string;
    name: string;
    role: 'admin' | 'manager' | 'cashier' | 'barista';
}

interface AuthStore {
    isAuthenticated: boolean;
    staff: StaffInfo | null;
    isLoading: boolean;
    error: string | null;
    locked: boolean;
    lockRemainingSeconds: number;
    attemptsRemaining: number | null;
    login: (pin: string) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<boolean>;
    clearError: () => void;
}

const STAFF_KEY = 'mcoffee_staff';
const SESSION_TS_KEY = 'mcoffee_session_ts';
const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours

export const useAuthStore = create<AuthStore>((set, get) => ({
    isAuthenticated: false,
    staff: null,
    isLoading: false,
    error: null,
    locked: false,
    lockRemainingSeconds: 0,
    attemptsRemaining: null,

    login: async (pin: string) => {
        set({ isLoading: true, error: null, locked: false });

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin }),
            });

            const data = await res.json();

            if (!res.ok) {
                set({
                    isLoading: false,
                    error: data.error || 'Login failed.',
                    locked: data.locked || false,
                    lockRemainingSeconds: data.remainingSeconds || 0,
                    attemptsRemaining: data.attemptsRemaining ?? null,
                });
                return false;
            }

            // Establish Supabase Auth session on the client
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
            });

            if (sessionError) {
                console.error('setSession error:', sessionError);
                set({ isLoading: false, error: 'Failed to establish session.' });
                return false;
            }

            // Persist staff identity
            const staffInfo: StaffInfo = data.staff;
            if (typeof window !== 'undefined') {
                localStorage.setItem(STAFF_KEY, JSON.stringify(staffInfo));
                localStorage.setItem(SESSION_TS_KEY, String(Date.now()));
            }

            set({
                isAuthenticated: true,
                staff: staffInfo,
                isLoading: false,
                error: null,
                locked: false,
                attemptsRemaining: null,
            });

            return true;
        } catch (err) {
            console.error('Login error:', err);
            set({ isLoading: false, error: 'Network error. Please try again.' });
            return false;
        }
    },

    logout: async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error('Sign out error:', e);
        }

        if (typeof window !== 'undefined') {
            localStorage.removeItem(STAFF_KEY);
            localStorage.removeItem(SESSION_TS_KEY);
        }

        set({
            isAuthenticated: false,
            staff: null,
            error: null,
            locked: false,
            attemptsRemaining: null,
        });
    },

    checkAuth: async () => {
        if (typeof window === 'undefined') return false;

        try {
            // Check 12-hour session expiry
            const ts = localStorage.getItem(SESSION_TS_KEY);
            if (!ts || Date.now() - Number(ts) > SESSION_DURATION) {
                await get().logout();
                return false;
            }

            // Verify Supabase Auth session is still valid
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                await get().logout();
                return false;
            }

            // Restore staff info
            const raw = localStorage.getItem(STAFF_KEY);
            if (!raw) {
                await get().logout();
                return false;
            }

            const staffInfo = JSON.parse(raw) as StaffInfo;
            set({ isAuthenticated: true, staff: staffInfo });
            return true;
        } catch {
            await get().logout();
            return false;
        }
    },

    clearError: () => set({ error: null }),
}));
