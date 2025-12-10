// ============================================
// Root Layout - AutoCompare
// ============================================

import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

// Font configuration
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

const outfit = Outfit({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-outfit',
});

// SEO Metadata
export const metadata: Metadata = {
    title: 'AutoCompare - Smart Vehicle Comparison',
    description: 'Compare vehicles side-by-side with smart insights. Find the perfect car by comparing specs, fuel economy, pricing, and more.',
    keywords: ['car comparison', 'vehicle specs', 'auto compare', 'car buying', 'vehicle comparison tool'],
    authors: [{ name: 'AutoCompare' }],
    openGraph: {
        title: 'AutoCompare - Smart Vehicle Comparison',
        description: 'Compare vehicles side-by-side with smart insights.',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AutoCompare - Smart Vehicle Comparison',
        description: 'Compare vehicles side-by-side with smart insights.',
    },
    robots: {
        index: true,
        follow: true,
    },
};

/**
 * Root Layout Component
 * Wraps all pages with common layout elements and providers
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
            <head>
                {/* Favicon */}
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/site.webmanifest" />

                {/* Theme color for mobile browsers */}
                <meta name="theme-color" content="#facc15" />

                {/* Viewport for mobile */}
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
                
                {/* Prevent flash of wrong theme */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var theme = localStorage.getItem('autocompare-theme');
                                    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                                        document.documentElement.classList.add('dark');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body className="min-h-screen antialiased transition-colors duration-300">
                {/* All providers wrapped in client component */}
                <Providers>
                    {/* Main content */}
                    <main className="relative">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}
