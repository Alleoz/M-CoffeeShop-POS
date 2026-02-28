import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthGuard from "@/components/Auth/AuthGuard";

export const metadata: Metadata = {
    title: "M Café & Thrift Shop",
    description: "Modern POS for M Café & Thrift Shop",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "M Café POS",
    },
};

export const viewport: Viewport = {
    themeColor: "#BAFA42",
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
        <html lang="en" className="light">
            <head>
                {/* Force light theme: remove any cached dark preference */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            document.documentElement.classList.remove('dark');
                            document.documentElement.classList.add('light');
                            try { localStorage.removeItem('theme'); localStorage.removeItem('next-theme'); } catch(e) {}
                        `,
                    }}
                />
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
                <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/icons/icon.svg" />
            </head>
            <body className="antialiased bg-bg-app text-text-primary" suppressHydrationWarning>
                <AuthGuard>
                    {children}
                </AuthGuard>
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
            </body>
        </html>
    );
}
