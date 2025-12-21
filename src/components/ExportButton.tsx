// ============================================
// Export Button Component
// PDF export with loading state
// ============================================

'use client';

import { useState } from 'react';
import { Download, Share2, Check, Loader2, FileText } from 'lucide-react';
import { exportComparisonToPDF, generateShareText } from '@/lib/pdf-generator';
import { ComparisonResult, ComparisonHighlight } from '@/types/vehicle';
import { clsx } from 'clsx';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/context/ToastContext';

interface ExportButtonProps {
    comparison: ComparisonResult;
    highlights: ComparisonHighlight[];
    className?: string;
}

/**
 * ExportButton Component
 * Handles PDF generation and sharing
 */
export function ExportButton({
    comparison,
    highlights,
    className,
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const { settings } = useSettings();
    const toast = useToast();

    /**
     * Handle PDF export
     */
    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportComparisonToPDF(comparison, highlights, settings);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    /**
     * Handle share
     */
    const handleShare = async () => {
        const shareText = generateShareText(comparison, highlights, settings);

        // Try native share API first
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Vehicle Comparison',
                    text: shareText,
                });
                return;
            } catch (err) {
                // User cancelled or share failed
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareText);
            setShowShareMenu(false);
            toast.success('Comparison copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className={clsx('flex items-center gap-3', className)}>
            {/* Export PDF Button */}
            <button
                onClick={handleExport}
                disabled={isExporting}
                className={clsx(
                    'flex items-center gap-2 px-6 py-3 border-2 border-black',
                    'text-black font-black uppercase text-sm',
                    'shadow-[4px_4px_0px_0px_black]',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black]',
                    'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                )}
                style={{ backgroundColor: settings.primaryColor }}
            >
                {isExporting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating PDF...</span>
                    </>
                ) : showSuccess ? (
                    <>
                        <Check className="w-5 h-5" />
                        <span>Downloaded!</span>
                    </>
                ) : (
                    <>
                        <Download className="w-5 h-5" />
                        <span>Export PDF</span>
                    </>
                )}
            </button>

            {settings.enableExportShareButton && (
                <div className="relative">
                    <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-3 border-2 border-black',
                            'bg-white hover:bg-gray-100',
                            'text-black font-bold uppercase',
                            'shadow-[4px_4px_0px_0px_black]',
                            'transition-all duration-200',
                            'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black]',
                            'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                        )}
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="hidden sm:inline">Share</span>
                    </button>

                    {showShareMenu && (
                        <div className={clsx(
                            'absolute right-0 top-full mt-2',
                            'w-48 p-0 border-2 border-black bg-white',
                            'shadow-[4px_4px_0px_0px_black]',
                            'z-50'
                        )}>
                            <button
                                onClick={handleShare}
                                className={clsx(
                                    'w-full flex items-center gap-3 px-4 py-3',
                                    'text-black font-bold uppercase hover:bg-yellow-300',
                                    'transition-colors border-none'
                                )}
                            >
                                <FileText className="w-4 h-4" />
                                <span>Copy as Text</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Compact export button for mobile
 */
export function ExportButtonCompact({
    comparison,
    highlights,
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const { settings } = useSettings();

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportComparisonToPDF(comparison, highlights, settings);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className={clsx(
                'p-3 border-2 border-black bg-white shadow-[2px_2px_0px_0px_black]',
                'hover:bg-blue-300 hover:shadow-[4px_4px_0px_0px_black] hover:translate-x-[-1px] hover:translate-y-[-1px]',
                'text-black',
                'transition-all duration-200',
                'disabled:opacity-50',
                'active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
            )}
            aria-label="Export PDF"
        >
            {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <Download className="w-5 h-5" />
            )}
        </button>
    );
}
