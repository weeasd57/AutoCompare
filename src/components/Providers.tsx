'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { VehicleProvider } from '@/context/VehicleContext';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider>
            <VehicleProvider>
                {children}
            </VehicleProvider>
        </ThemeProvider>
    );
}
