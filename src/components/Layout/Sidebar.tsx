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
    Users,
    Clock,
    LogOut,
    X,
    History,
} from 'lucide-react';

type Role = 'admin' | 'manager' | 'cashier' | 'barista';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager'] as Role[] },
    { name: 'New Order', href: '/pos', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] as Role[] },
    { name: 'Order History', href: '/orders', icon: History, roles: ['admin', 'manager', 'cashier'] as Role[] },
    { name: 'Products', href: '/products', icon: Coffee, roles: ['admin', 'manager'] as Role[] },
    { name: 'Barista KDS', href: '/barista', icon: ChefHat, roles: ['admin', 'manager', 'barista'] as Role[] },
    { name: 'Inventory', href: '/inventory', icon: Boxes, roles: ['admin', 'manager'] as Role[] },
    { name: 'Reports', href: '/reports', icon: FileBarChart, roles: ['admin', 'manager'] as Role[] },
    { name: 'Expenses', href: '/expenses', icon: Receipt, roles: ['admin', 'manager'] as Role[] },
    { name: 'Attendance', href: '/attendance', icon: Clock, roles: ['admin', 'manager', 'cashier', 'barista'] as Role[] },
    { name: 'Staff', href: '/staff', icon: Users, roles: ['admin'] as Role[] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { staff, logout } = useAuthStore();
    const { isOpen, close } = useSidebarStore();

    const userRole = (staff?.role || 'cashier') as Role;
    const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const handleNavClick = () => {
        close();
    };

    // Get staff initials for avatar
    const initials = staff?.name
        ? staff.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : 'MC';

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
                            <span className="font-extrabold text-lg tracking-tight leading-none block text-text-primary">M Café & Thrift Shop</span>
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
                    {filteredNavItems.map((item) => {
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
                            {initials}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold truncate text-text-primary">{staff?.name || 'Staff'}</p>
                            <p className="text-[10px] text-text-tertiary truncate capitalize">{staff?.role || 'Staff'}</p>
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
