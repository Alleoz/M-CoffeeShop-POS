"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/useAuthStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import {
    BarChart3,
    ShoppingCart,
    Package,
    Receipt,
    Wallet,
    Coffee,
    ChefHat,
    LogOut,
    X,
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'New Order', href: '/pos', icon: ShoppingCart },
    { name: 'Products', href: '/products', icon: Coffee },
    { name: 'Barista KDS', href: '/barista', icon: ChefHat },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Reports', href: '/reports', icon: Receipt },
    { name: 'Expenses', href: '/expenses', icon: Wallet },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const { isOpen, close } = useSidebarStore();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const handleNavClick = () => {
        // Close sidebar on tablet/mobile after navigation
        close();
    };

    return (
        <>
            {/* Mobile/Tablet overlay backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
                    onClick={close}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "w-[260px] min-w-[260px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen z-50 transition-transform duration-300 ease-in-out",
                    // On desktop (lg+): always visible, static position
                    "lg:relative lg:translate-x-0",
                    // On tablet/mobile: fixed overlay, slide in/out
                    "fixed top-0 left-0",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo + Close button */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary rounded-full size-10 flex items-center justify-center text-white shadow-lg shadow-primary/25">
                            <Coffee size={20} />
                        </div>
                        <div>
                            <span className="font-black text-lg tracking-tight leading-none block font-display">M Coffee</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">POS System</span>
                        </div>
                    </div>
                    {/* Close button - only on tablet/mobile */}
                    <button
                        onClick={close}
                        className="lg:hidden size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Menu</p>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={handleNavClick}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm group relative",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                                )}
                                <item.icon size={20} className={clsx(
                                    "transition-colors",
                                    isActive ? "text-primary" : "group-hover:text-slate-700 dark:group-hover:text-slate-200"
                                )} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User card */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            JD
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold truncate">{user?.name || 'M Coffee Admin'}</p>
                            <p className="text-[10px] text-slate-400 truncate">{user?.role || 'Staff'}</p>
                        </div>
                        <button onClick={handleLogout} title="Log out" className="text-slate-400 hover:text-rose-500 transition-colors">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
