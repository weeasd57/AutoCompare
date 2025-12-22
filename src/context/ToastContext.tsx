'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '@/components/Toast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (message: string, type: ToastType) => {
            const id = Math.random().toString(36).substring(2, 9);
            setToasts((prev) => [...prev, { id, message, type }]);

            // Auto remove after 5 seconds
            setTimeout(() => {
                removeToast(id);
            }, 5000);
        },
        [removeToast]
    );

    const success = (message: string) => showToast(message, 'success');
    const error = (message: string) => showToast(message, 'error');
    const info = (message: string) => showToast(message, 'info');
    const warning = (message: string) => showToast(message, 'warning');

    return (
        <ToastContext.Provider value={{ success, error, info, warning }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
