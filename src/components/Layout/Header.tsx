"use client";

import { Bell, Search, Clock, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSidebarStore } from '@/store/useSidebarStore';

export default function Header() {
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const { toggle } = useSidebarStore();

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
            setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="h-14 md:h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 flex-1">
                {/* Hamburger menu - visible on tablet/mobile */}
                <button
                    onClick={toggle}
                    className="lg:hidden size-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:bg-primary/5 transition-all"
                >
                    <Menu size={20} />
                </button>

                <div className="relative max-w-md w-full hidden md:block">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search products, orders..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
                {/* Live Clock */}
                <div className="hidden sm:flex items-center gap-2 text-right">
                    <Clock size={16} className="text-slate-400" />
                    <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">{currentTime}</p>
                        <p className="text-[10px] text-slate-400 leading-none mt-0.5">{currentDate}</p>
                    </div>
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                {/* Notification Bell */}
                <button className="size-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all relative">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2 size-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                </button>
            </div>
        </header>
    );
}
