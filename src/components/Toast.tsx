'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { ToastType } from '@/context/ToastContext';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
}

const Toast = ({ id, message, type, onClose }: ToastProps) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-black" />,
        error: <AlertCircle className="w-5 h-5 text-black" />,
        info: <Info className="w-5 h-5 text-black" />,
        warning: <AlertTriangle className="w-5 h-5 text-black" />,
    };

    const colors = {
        success: 'bg-green-400',
        error: 'bg-red-400',
        info: 'bg-blue-400',
        warning: 'bg-yellow-400',
    };

    return (
        <div
            className={clsx(
                "flex items-center gap-3 p-4 border-3 border-black min-w-[300px] max-w-md",
                "shadow-[6px_6px_0px_0px_black] transform transition-all duration-300",
                "animate-in slide-in-from-right-full fade-in",
                colors[type]
            )}
        >
            <div className="flex-shrink-0 bg-white border-2 border-black p-1">
                {icons[type]}
            </div>

            <p className="text-black font-black uppercase text-sm flex-grow">
                {message}
            </p>

            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 hover:rotate-90 transition-transform"
            >
                <X className="w-5 h-5 text-black hover:text-white" />
            </button>
        </div>
    );
};

export const ToastContainer = ({
    toasts,
    onRemove
}: {
    toasts: Array<{ id: string; message: string; type: ToastType }>;
    onRemove: (id: string) => void;
}) => {
    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast {...toast} onClose={onRemove} />
                </div>
            ))}
        </div>
    );
};
