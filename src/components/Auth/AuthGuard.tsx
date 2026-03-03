"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useOwnerAuthStore } from '@/store/useOwnerAuthStore';
import { Coffee } from 'lucide-react';

// Routes that don't require ANY authentication
const FULLY_PUBLIC_ROUTES = ['/owner-auth'];

// Routes that require owner auth but NOT staff auth
const OWNER_ONLY_ROUTES = ['/login'];

// Role-based route access (requires both owner + staff auth)
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
    const { checkOwnerAuth } = useOwnerAuthStore();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const verify = async () => {
            const isFullyPublic = FULLY_PUBLIC_ROUTES.includes(pathname);
            const isOwnerOnlyRoute = OWNER_ONLY_ROUTES.includes(pathname);

            // Check owner auth (synchronous — from localStorage)
            const isOwnerAuth = checkOwnerAuth();

            // Check staff auth (async — Supabase session)
            const isStaffAuth = await checkAuth();

            if (isFullyPublic) {
                // On owner-auth page: if already owner-authenticated, go to staff login
                if (isOwnerAuth && isStaffAuth) {
                    const role = (useAuthStore.getState().staff?.role || 'cashier') as Role;
                    router.replace(getDefaultRoute(role));
                } else if (isOwnerAuth) {
                    router.replace('/login');
                }
            } else if (isOwnerOnlyRoute) {
                // On /login page: needs owner auth, but NOT staff auth
                if (!isOwnerAuth) {
                    router.replace('/owner-auth');
                } else if (isStaffAuth) {
                    const role = (useAuthStore.getState().staff?.role || 'cashier') as Role;
                    router.replace(getDefaultRoute(role));
                }
            } else {
                // Protected routes: need BOTH owner + staff auth
                if (!isOwnerAuth) {
                    router.replace('/owner-auth');
                } else if (!isStaffAuth) {
                    router.replace('/login');
                } else {
                    // Check role-based access
                    const role = (useAuthStore.getState().staff?.role || 'cashier') as Role;
                    const basePath = '/' + pathname.split('/').filter(Boolean)[0];
                    const allowedRoles = ROUTE_PERMISSIONS[basePath];

                    if (allowedRoles && !allowedRoles.includes(role)) {
                        router.replace(getDefaultRoute(role));
                    }
                }
            }

            setChecking(false);
        };

        verify();
    }, [pathname, checkAuth, checkOwnerAuth, router]);

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

    // On fully public routes, render without any auth check
    if (FULLY_PUBLIC_ROUTES.includes(pathname)) {
        return <>{children}</>;
    }

    // On owner-only routes (login), render if owner is authenticated
    if (OWNER_ONLY_ROUTES.includes(pathname)) {
        return <>{children}</>;
    }

    // On protected routes, only render if both are authenticated
    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
