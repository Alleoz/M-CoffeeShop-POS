"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOwnerAuthStore } from '@/store/useOwnerAuthStore';
import {
    Coffee,
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    UserPlus,
    LogIn,
    Shield,
    Clock,
    CheckCircle2,
    Store,
    ArrowRight,
} from 'lucide-react';

export default function OwnerAuthPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [ownerExists, setOwnerExists] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const router = useRouter();
    const {
        loginOwner,
        registerOwner,
        checkOwnerAuth,
        checkOwnerExists,
        isLoading,
        error,
        isPending,
        clearError,
    } = useOwnerAuthStore();

    useEffect(() => {
        setMounted(true);
        const init = async () => {
            // Check if already authenticated as owner
            const isAuth = checkOwnerAuth();
            if (isAuth) {
                router.replace('/login');
                return;
            }

            // Check if an owner already exists
            const status = await checkOwnerExists();
            setOwnerExists(status.exists);
            if (status.exists) {
                setMode('login');
            }
            setCheckingStatus(false);
        };
        init();
    }, [checkOwnerAuth, checkOwnerExists, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (mode === 'login') {
            const success = await loginOwner(email, password);
            if (success) {
                router.push('/login');
            }
        } else {
            const result = await registerOwner(email, password, businessName);
            if (result.success && result.pending) {
                setRegistrationSuccess(true);
            }
        }
    };

    if (!mounted || checkingStatus) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="inline-flex items-center justify-center size-16 bg-primary rounded-2xl shadow-2xl shadow-primary/30 mb-4">
                        <Coffee size={28} className="text-white" />
                    </div>
                    <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mt-4" />
                </div>
            </div>
        );
    }

    // Registration success screen
    if (registrationSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                </div>

                <div className="w-full max-w-md relative z-10 animate-fade-in">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
                        <div className="inline-flex items-center justify-center size-20 bg-amber-500/20 rounded-3xl mb-6">
                            <Clock size={36} className="text-amber-400" />
                        </div>

                        <h2 className="text-2xl font-black text-white mb-3">Registration Submitted!</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Your owner account has been created and is <span className="text-amber-400 font-bold">pending approval</span> by the system administrator.
                        </p>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
                            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-2">
                                <Shield size={14} />
                                <span>What happens next?</span>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">
                                The system creator will review and approve your account. Once approved, you&apos;ll be able to log in and access the POS system.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setRegistrationSuccess(false);
                                setMode('login');
                                setEmail('');
                                setPassword('');
                                setOwnerExists(true);
                                clearError();
                            }}
                            className="w-full py-3.5 rounded-2xl bg-white/10 text-white font-bold text-sm hover:bg-white/15 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <ArrowRight size={16} />
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center size-20 bg-primary rounded-3xl shadow-2xl shadow-primary/30 mb-5">
                        <Coffee size={36} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight font-display">M Café & Thrift Shop</h1>
                    <p className="text-slate-400 text-sm mt-1 font-medium">Owner Authentication</p>
                </div>

                {/* Auth Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Tab switcher — only show if no owner exists yet */}
                    {!ownerExists && (
                        <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
                            <button
                                onClick={() => { setMode('login'); clearError(); }}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${mode === 'login'
                                        ? 'bg-primary text-slate-900 shadow-lg'
                                        : 'text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                <LogIn size={13} />
                                Sign In
                            </button>
                            <button
                                onClick={() => { setMode('register'); clearError(); }}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${mode === 'register'
                                        ? 'bg-primary text-slate-900 shadow-lg'
                                        : 'text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                <UserPlus size={13} />
                                Register
                            </button>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center gap-2 mb-6">
                        <Shield size={16} className="text-primary" />
                        <h2 className="text-white font-bold text-sm">
                            {mode === 'login' ? 'Owner Sign In' : 'Register as Owner'}
                        </h2>
                    </div>

                    {/* Pending notice */}
                    {isPending && (
                        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 mb-6 animate-fade-in">
                            <Clock size={18} className="text-amber-400 shrink-0" />
                            <div>
                                <p className="text-amber-400 text-xs font-bold">Pending Approval</p>
                                <p className="text-amber-400/70 text-[10px] mt-0.5">
                                    Your account is awaiting administrator approval.
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Business Name (register only) */}
                        {mode === 'register' && (
                            <div>
                                <label className="block text-slate-400 text-[11px] font-bold mb-1.5 uppercase tracking-wider">
                                    Business Name
                                </label>
                                <div className="relative">
                                    <Store size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        placeholder="M Café & Thrift Shop"
                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all duration-200"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-slate-400 text-[11px] font-bold mb-1.5 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                                    placeholder="owner@mcafe.com"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-slate-400 text-[11px] font-bold mb-1.5 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && !isPending && (
                            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold animate-fade-in bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!email || !password || isLoading}
                            className="w-full py-4 rounded-2xl bg-primary text-slate-900 font-black text-sm shadow-lg shadow-primary/25 hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? (
                                <div className="size-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                            ) : mode === 'login' ? (
                                <>
                                    <LogIn size={16} />
                                    Sign In
                                </>
                            ) : (
                                <>
                                    <UserPlus size={16} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Info note */}
                    {mode === 'register' && (
                        <div className="mt-5 flex items-start gap-2 text-slate-500 text-[10px] leading-relaxed">
                            <Shield size={12} className="shrink-0 mt-0.5 text-primary/60" />
                            <span>
                                Only <strong className="text-slate-400">one owner</strong> can be registered per POS system.
                                Your account will require approval from the system administrator before you can log in.
                            </span>
                        </div>
                    )}
                </div>

                {/* Approved indicator */}
                {ownerExists && mode === 'login' && (
                    <div className="flex items-center justify-center gap-2 mt-5 text-slate-500 text-[10px]">
                        <CheckCircle2 size={12} className="text-primary/60" />
                        <span>Registered POS System</span>
                    </div>
                )}

                {/* Footer */}
                <p className="text-center text-slate-600 text-[10px] mt-8 font-medium">
                    M Café & Thrift Shop POS System &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
