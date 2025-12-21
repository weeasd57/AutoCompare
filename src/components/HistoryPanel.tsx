// ============================================
// History Panel Component
// Displays recent comparison history
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { History, X, Trash2, Play, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { useHistoryStore } from '@/store/history-store';
import { useCompareStore } from '@/store/compare-store';
import { useRouter } from 'next/navigation';

interface HistoryPanelProps {
    className?: string;
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
}

/**
 * HistoryPanel Component
 * Shows recent comparisons with ability to reload them
 */
export function HistoryPanel({ className }: HistoryPanelProps) {
    const { history, removeFromHistory, clearHistory } = useHistoryStore();
    const { clearVehicles, addVehicle } = useCompareStore();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLoadComparison = (vehicles: typeof history[0]['vehicles']) => {
        clearVehicles();
        vehicles.forEach(v => addVehicle(v));
        router.push('/compare');
        setIsOpen(false);
    };

    if (!mounted) {
        return (
            <button
                className={clsx(
                    'relative p-2 bg-white border-2 border-black',
                    'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                    className
                )}
                disabled
            >
                <History className="w-5 h-5 text-gray-400" />
            </button>
        );
    }

    return (
        <div className={clsx('relative', className)}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    'relative p-2 border-2 border-black transition-all',
                    'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                    'hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]',
                    isOpen ? 'bg-purple-500 text-white' : 'bg-white text-black hover:bg-purple-50'
                )}
                aria-label="History"
                title="Comparison History"
            >
                <History className="w-5 h-5" />
                {history.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 text-white text-xs font-black rounded-full flex items-center justify-center border border-black">
                        {history.length}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        role="button"
                        tabIndex={0}
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                        onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false); }}
                        aria-label="Close panel"
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b-2 border-black bg-purple-500 text-white">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5" />
                                <span className="font-black uppercase">History</span>
                                <span className="text-sm font-mono">({history.length})</span>
                            </div>
                            {history.length > 0 && (
                                <button
                                    onClick={() => clearHistory()}
                                    className="p-1 hover:bg-purple-600 rounded"
                                    title="Clear all history"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="max-h-72 overflow-y-auto">
                            {history.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-bold">No history yet</p>
                                    <p className="text-sm mt-1">Your recent comparisons will appear here</p>
                                </div>
                            ) : (
                                <ul>
                                    {history.map((entry) => (
                                        <li
                                            key={entry.id}
                                            className="flex items-center gap-3 p-3 border-b border-gray-200 hover:bg-gray-50"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">
                                                    {entry.vehicles.map(v => `${v.make} ${v.model}`).join(' vs ')}
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatRelativeTime(entry.timestamp)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleLoadComparison(entry.vehicles)}
                                                    className="p-1.5 bg-green-500 border border-black text-white hover:bg-green-600"
                                                    title="Load this comparison"
                                                >
                                                    <Play className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => removeFromHistory(entry.id)}
                                                    className="p-1.5 bg-white border border-black text-red-500 hover:bg-red-50"
                                                    title="Remove from history"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
