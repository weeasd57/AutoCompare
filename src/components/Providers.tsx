'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { VehicleProvider } from '@/context/VehicleContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { ToastProvider } from '@/context/ToastContext';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider>
            <SettingsProvider>
                <ToastProvider>
                    <VehicleProvider>{children}</VehicleProvider>
                </ToastProvider>
            </SettingsProvider>
        </ThemeProvider>
    );
}
