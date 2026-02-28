"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Coffee, Lock, Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const {
        login,
        checkAuth,
        isLoading,
        error,
        locked,
        lockRemainingSeconds,
        attemptsRemaining,
        clearError,
    } = useAuthStore();

    // Countdown timer for lockout
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        setMounted(true);
        const check = async () => {
            const isAuth = await checkAuth();
            if (isAuth) router.replace('/dashboard');
        };
        check();
    }, [checkAuth, router]);

    // Lockout countdown
    useEffect(() => {
        if (locked && lockRemainingSeconds > 0) {
            setCountdown(lockRemainingSeconds);
            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [locked, lockRemainingSeconds]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (locked && countdown > 0) return;

        const success = await login(pin);
        if (success) {
            router.push('/dashboard');
        } else {
            setPin('');
        }
    };

    const handlePinPad = (digit: string) => {
        if (pin.length < 6) {
            setPin((prev) => prev + digit);
            clearError();
        }
    };

    const handleBackspace = () => {
        setPin((prev) => prev.slice(0, -1));
        clearError();
    };

    if (!mounted) return null;

    const isLocked = locked && countdown > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-sm relative z-10 animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center size-20 bg-primary rounded-3xl shadow-2xl shadow-primary/30 mb-5">
                        <Coffee size={36} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight font-display">M Café & Thrift Shop</h1>
                    <p className="text-slate-400 text-sm mt-1 font-medium">Point of Sale</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-2 mb-6">
                        <Lock size={16} className="text-primary" />
                        <h2 className="text-white font-bold text-sm">Enter Staff PIN</h2>
                    </div>

                    {/* Lockout banner */}
                    {isLocked && (
                        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 mb-6 animate-fade-in">
                            <ShieldAlert size={18} className="text-rose-400 shrink-0" />
                            <div>
                                <p className="text-rose-400 text-xs font-bold">Account Locked</p>
                                <p className="text-rose-400/70 text-[10px] mt-0.5">
                                    Try again in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* PIN Display */}
                        <div className="relative mb-6">
                            <div className="flex items-center justify-center gap-3 py-4">
                                {[0, 1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className={`size-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-200 ${pin.length > i
                                            ? 'border-primary bg-primary/10 text-primary scale-105'
                                            : 'border-white/10 bg-white/5 text-transparent'
                                            }`}
                                    >
                                        {pin.length > i ? (showPin ? pin[i] : '●') : ''}
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-2"
                            >
                                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {/* Error message */}
                        {error && !isLocked && (
                            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-4 animate-fade-in bg-rose-500/10 rounded-xl px-4 py-3">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{error}</span>
                                {attemptsRemaining !== null && attemptsRemaining > 0 && (
                                    <span className="ml-auto text-rose-400/60 text-[10px] whitespace-nowrap">
                                        {attemptsRemaining} left
                                    </span>
                                )}
                            </div>
                        )}

                        {/* PIN Pad */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key) => {
                                if (key === '') return <div key="empty" />;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        disabled={isLocked}
                                        onClick={() => key === '⌫' ? handleBackspace() : handlePinPad(key)}
                                        className="h-14 rounded-2xl text-xl font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        {key}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={pin.length < 4 || isLoading || isLocked}
                            className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Lock size={16} />
                                    Unlock POS
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-[10px] mt-8 font-medium">
                    M Café & Thrift Shop POS System &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
