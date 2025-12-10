'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return (
            <button
                className="p-3 bg-white border-3 border-black shadow-[4px_4px_0px_0px_black] transition-all duration-200"
                aria-label="Toggle theme"
            >
                <Sun className="w-5 h-5 text-black" />
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-3 bg-white dark:bg-gray-800 border-3 border-black dark:border-white shadow-[4px_4px_0px_0px_black] dark:shadow-[4px_4px_0px_0px_white] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black] dark:hover:shadow-[6px_6px_0px_0px_white] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <Moon className="w-5 h-5 text-black" />
            ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
            )}
        </button>
    );
}
