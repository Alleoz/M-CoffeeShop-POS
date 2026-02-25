import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthGuard from "@/components/Auth/AuthGuard";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
    title: "M Coffee Shop POS",
    description: "Modern POS for M Coffee Shop",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "M Coffee POS",
    },
};

export const viewport: Viewport = {
    themeColor: "#4276fa",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
                <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/icons/icon.svg" />
            </head>
            <body className="antialiased" suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthGuard>
                        {children}
                    </AuthGuard>
                    <ServiceWorkerRegistration />
                </ThemeProvider>
            </body>
        </html>
    );
}

function ServiceWorkerRegistration() {
    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `
                    if ('serviceWorker' in navigator) {
                        window.addEventListener('load', function() {
                            navigator.serviceWorker.register('/sw.js');
                        });
                    }
                `,
            }}
        />
    );
}
