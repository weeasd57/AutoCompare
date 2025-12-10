'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <html lang="en">
            <body className="min-h-screen bg-red-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white border-4 border-red-600 shadow-[8px_8px_0px_0px_#dc2626] p-8 text-center">
                    <div className="w-20 h-20 bg-red-100 border-4 border-red-600 mx-auto mb-6 flex items-center justify-center rounded-full animate-pulse">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>

                    <h2 className="text-3xl font-black mb-4 uppercase text-black">Something went wrong!</h2>
                    <p className="text-lg text-gray-700 mb-8 font-medium">
                        A critical error occurred. Please try refreshing the page.
                    </p>

                    <button
                        onClick={() => reset()}
                        className="w-full py-3 bg-red-600 text-white font-black text-lg uppercase tracking-wider border-2 border-black hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
