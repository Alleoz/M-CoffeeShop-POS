"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Coffee } from 'lucide-react';

const PUBLIC_ROUTES = ['/login'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, checkAuth } = useAuthStore();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const isAuth = checkAuth();
        const isPublic = PUBLIC_ROUTES.includes(pathname);

        if (!isAuth && !isPublic) {
            router.replace('/login');
        } else if (isAuth && isPublic) {
            router.replace('/dashboard');
        }

        setChecking(false);
    }, [pathname, checkAuth, router]);

    // Show loading screen while checking auth
    if (checking) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="inline-flex items-center justify-center size-16 bg-primary rounded-2xl shadow-2xl shadow-primary/30 mb-4">
                        <Coffee size={28} className="text-white" />
                    </div>
                    <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mt-4" />
                </div>
            </div>
        );
    }

    // On public routes, render without auth check
    if (PUBLIC_ROUTES.includes(pathname)) {
        return <>{children}</>;
    }

    // On protected routes, only render if authenticated
    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
