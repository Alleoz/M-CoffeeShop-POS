"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Coffee } from 'lucide-react';

const PUBLIC_ROUTES = ['/login'];

// Role-based route access
type Role = 'admin' | 'manager' | 'cashier' | 'barista';

const ROUTE_PERMISSIONS: Record<string, Role[]> = {
    '/dashboard': ['admin', 'manager'],
    '/pos': ['admin', 'manager', 'cashier'],
    '/products': ['admin', 'manager'],
    '/barista': ['admin', 'manager', 'barista'],
    '/inventory': ['admin', 'manager'],
    '/reports': ['admin', 'manager'],
    '/expenses': ['admin', 'manager'],
    '/attendance': ['admin', 'manager', 'cashier', 'barista'],
    '/staff': ['admin'],
};

function getDefaultRoute(role: Role): string {
    switch (role) {
        case 'admin':
        case 'manager':
            return '/dashboard';
        case 'cashier':
            return '/pos';
        case 'barista':
            return '/barista';
        default:
            return '/dashboard';
    }
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, staff, checkAuth } = useAuthStore();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const verify = async () => {
            const isAuth = await checkAuth();
            const isPublic = PUBLIC_ROUTES.includes(pathname);

            if (!isAuth && !isPublic) {
                router.replace('/login');
            } else if (isAuth && isPublic) {
                // Redirect to the appropriate default page based on role
                const role = (useAuthStore.getState().staff?.role || 'cashier') as Role;
                router.replace(getDefaultRoute(role));
            } else if (isAuth && !isPublic) {
                // Check role-based access
                const role = (useAuthStore.getState().staff?.role || 'cashier') as Role;
                const basePath = '/' + pathname.split('/').filter(Boolean)[0];
                const allowedRoles = ROUTE_PERMISSIONS[basePath];

                if (allowedRoles && !allowedRoles.includes(role)) {
                    // Redirect to their default route if unauthorized
                    router.replace(getDefaultRoute(role));
                }
            }

            setChecking(false);
        };

        verify();
    }, [pathname, checkAuth, router]);

    // Show loading screen while checking auth
    if (checking) {
        return (
            <div className="min-h-screen bg-bg-app flex items-center justify-center">
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
