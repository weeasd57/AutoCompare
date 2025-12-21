"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Car, Menu } from 'lucide-react';
import { clsx } from 'clsx';
import { useSettings } from '@/context/SettingsContext';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/compare', label: 'Compare' },
    { href: '/vehicles', label: 'Vehicles' },
];

export function MainNavbar() {
    const pathname = usePathname();
    const { settings } = useSettings();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="sticky top-0 border-b-2 border-black dark:border-white bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-40 md:z-50">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/apple-touch-icon.png"
                        alt="Site logo"
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                        priority
                    />
                    <span className="text-lg font-black uppercase tracking-wider text-black dark:text-white">
                        {settings.siteName}
                    </span>
                </Link>

                {/* Links + Theme toggle */}
                <div className="flex items-center gap-3">
                    {/* Desktop links */}
                    <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm font-black uppercase">
                        {NAV_LINKS.map(link => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={clsx(
                                        'px-3 py-1.5 border-2 border-black bg-white text-black hover:bg-yellow-300 transition-colors shadow-[2px_2px_0px_0px_black]',
                                        'dark:bg-gray-900 dark:text-white dark:border-white dark:hover:bg-gray-800 dark:shadow-[2px_2px_0px_0px_white]',
                                        isActive && 'border-black dark:border-black'
                                    )}
                                    style={isActive ? { backgroundColor: settings.primaryColor, color: '#000' } : undefined}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                    <ThemeToggle />
                    {/* Mobile menu toggle */}
                    <button
                        type="button"
                        className="sm:hidden inline-flex items-center justify-center w-9 h-9 border-2 border-black dark:border-white bg-white dark:bg-gray-900 text-black dark:text-white shadow-[2px_2px_0px_0px_black] dark:shadow-[2px_2px_0px_0px_white]"
                        onClick={() => setMobileOpen(prev => !prev)}
                        aria-label="Toggle navigation menu"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {/* Mobile menu */}
            {mobileOpen && (
                <div className="sm:hidden border-t-2 border-black dark:border-white bg-white dark:bg-gray-900">
                    <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 text-xs font-black uppercase">
                        {NAV_LINKS.map(link => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={clsx(
                                        'w-full px-3 py-2 border-2 border-black bg-white text-black text-left hover:bg-yellow-300 transition-colors shadow-[2px_2px_0px_0px_black]',
                                        'dark:bg-gray-900 dark:text-white dark:border-white dark:hover:bg-gray-800 dark:shadow-[2px_2px_0px_0px_white]',
                                        isActive && 'border-black dark:border-black'
                                    )}
                                    style={isActive ? { backgroundColor: settings.primaryColor, color: '#000' } : undefined}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
}
