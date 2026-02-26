"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/useAuthStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import {
    LayoutDashboard,
    ShoppingCart,
    Coffee,
    ChefHat,
    Boxes,
    FileBarChart,
    Receipt,
    LogOut,
    X,
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'New Order', href: '/pos', icon: ShoppingCart },
    { name: 'Products', href: '/products', icon: Coffee },
    { name: 'Barista KDS', href: '/barista', icon: ChefHat },
    { name: 'Inventory', href: '/inventory', icon: Boxes },
    { name: 'Reports', href: '/reports', icon: FileBarChart },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
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
        close();
    };

    return (
        <>
            {/* Mobile/Tablet overlay backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
                    onClick={close}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "w-[260px] min-w-[260px] border-r border-border bg-white flex flex-col h-screen z-50 transition-transform duration-300 ease-in-out",
                    "lg:relative lg:translate-x-0",
                    "fixed top-0 left-0",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo + Close button */}
                <div className="px-6 pt-7 pb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary rounded-[14px] size-10 flex items-center justify-center shadow-button">
                            <Coffee size={20} className="text-text-on-primary" />
                        </div>
                        <div>
                            <span className="font-extrabold text-lg tracking-tight leading-none block text-text-primary">M Café</span>
                            <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-[0.15em]">POS System</span>
                        </div>
                    </div>
                    <button
                        onClick={close}
                        className="lg:hidden size-8 flex items-center justify-center rounded-lg hover:bg-bg-muted text-text-tertiary"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                    <p className="px-3 py-2.5 text-[10px] font-extrabold text-text-tertiary uppercase tracking-[0.15em]">Menu</p>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={handleNavClick}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-200 font-semibold text-sm",
                                    isActive
                                        ? "bg-primary text-text-on-primary shadow-button"
                                        : "text-text-secondary hover:bg-bg-muted hover:text-text-primary"
                                )}
                            >
                                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User card */}
                <div className="p-4 border-t border-border-light">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-muted">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            JD
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold truncate text-text-primary">{user?.name || 'M Coffee Admin'}</p>
                            <p className="text-[10px] text-text-tertiary truncate">{user?.role || 'Staff'}</p>
                        </div>
                        <button onClick={handleLogout} title="Log out" className="text-text-tertiary hover:text-error transition-colors">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
