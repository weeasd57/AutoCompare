// ============================================
// Root Layout - AutoCompare
// ============================================

import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/Providers';
import { MainNavbar } from '@/components/MainNavbar';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

export async function generateMetadata(): Promise<Metadata> {
    const fallbackTitle = 'AutoCompare - Smart Vehicle Comparison';
    const fallbackDescription = 'Compare vehicles side-by-side with smart insights. Find the perfect car by comparing specs, fuel economy, pricing, and more.';
    const fallbackKeywords = ['car comparison', 'vehicle specs', 'auto compare', 'car buying', 'vehicle comparison tool'];

    try {
        const rows = await query<{ setting_key: string; setting_value: string }>(
            'SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?, ?, ?)',
            ['seoTitle', 'seoDescription', 'seoKeywords']
        );

        const map = new Map<string, string>();
        for (const r of rows || []) {
            map.set(r.setting_key, r.setting_value);
        }

        const rawTitle = map.get('seoTitle');
        const rawDescription = map.get('seoDescription');
        const rawKeywords = map.get('seoKeywords');

        const title = rawTitle ? safeParseSetting(rawTitle, fallbackTitle) : fallbackTitle;
        const description = rawDescription ? safeParseSetting(rawDescription, fallbackDescription) : fallbackDescription;
        const keywordsString = rawKeywords ? safeParseSetting(rawKeywords, fallbackKeywords.join(', ')) : fallbackKeywords.join(', ');
        const keywords = keywordsString
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        return {
            title,
            description,
            keywords: keywords.length ? keywords : fallbackKeywords,
            authors: [{ name: 'AutoCompare' }],
            openGraph: {
                title,
                description,
                type: 'website',
                locale: 'en_US',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
            },
            robots: {
                index: true,
                follow: true,
            },
        };
    } catch {
        return {
            title: fallbackTitle,
            description: fallbackDescription,
            keywords: fallbackKeywords,
            authors: [{ name: 'AutoCompare' }],
            openGraph: {
                title: fallbackTitle,
                description: fallbackDescription,
                type: 'website',
                locale: 'en_US',
            },
            twitter: {
                card: 'summary_large_image',
                title: fallbackTitle,
                description: fallbackDescription,
            },
            robots: {
                index: true,
                follow: true,
            },
        };
    }
}

function safeParseSetting<T>(value: string, fallback: T): T {
    try {
        return JSON.parse(value) as T;
    } catch {
        return value as unknown as T;
    }
}

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
                {/* Google AdSense script - requires NEXT_PUBLIC_ADSENSE_CLIENT env variable */}
                {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
                    <Script
                        id="adsense-script"
                        async
                        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
                        crossOrigin="anonymous"
                        strategy="afterInteractive"
                    />
                )}
                {/* All providers wrapped in client component */}
                <Providers>
                    <MainNavbar />
                    {/* Main content */}
                    <main className="relative">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}
