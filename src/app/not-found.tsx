import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-neo-grid flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-8 text-center">
                <div className="w-20 h-20 bg-yellow-400 border-4 border-black mx-auto mb-6 flex items-center justify-center shadow-[4px_4px_0px_0px_black] transform rotate-3">
                    <AlertTriangle className="w-10 h-10 text-black" />
                </div>

                <h1 className="text-4xl font-black mb-4 uppercase">404 - Page Not Found</h1>
                <p className="text-xl font-bold text-gray-600 mb-8 border-l-4 border-black pl-4 text-left">
                    Oops! The page you are looking for seems to have driven off the map.
                </p>

                <Link
                    href="/"
                    className={clsx(
                        'block w-full py-4 bg-black text-white font-black text-xl uppercase tracking-wider',
                        'border-2 border-black transition-all duration-200',
                        'hover:bg-gray-800 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]',
                        'active:translate-x-[0px] active:translate-y-[0px] active:shadow-none',
                        'flex items-center justify-center gap-3'
                    )}
                >
                    <Home className="w-6 h-6" />
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
