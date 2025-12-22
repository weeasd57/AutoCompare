// ============================================
// Share Button Component
// Generate and share comparison links
// ============================================

'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { NormalizedSpec } from '@/types/vehicle';

interface ShareButtonProps {
    vehicles: NormalizedSpec[];
    className?: string;
}

/**
 * ShareButton Component
 * Generates shareable links and provides social sharing options
 */
export function ShareButton({ vehicles, className }: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Generate shareable URL with vehicle IDs
    const generateShareUrl = () => {
        if (typeof window === 'undefined') return '';

        const baseUrl = window.location.origin;
        const vehicleIds = vehicles.map((v) => v.id).join(',');
        return `${baseUrl}/compare?vehicles=${encodeURIComponent(vehicleIds)}`;
    };

    const shareUrl = generateShareUrl();

    // Generate share text
    const shareText =
        vehicles.length > 0
            ? `Check out this vehicle comparison: ${vehicles.map((v) => v.make + ' ' + v.model).join(' vs ')}`
            : 'Check out this vehicle comparison';

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Vehicle Comparison - AutoCompare',
                    text: shareText,
                    url: shareUrl,
                });
            } catch {
                // User cancelled or error
            }
        }
    };

    const socialLinks = [
        {
            name: 'Twitter',
            icon: Twitter,
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            color: 'bg-sky-500 hover:bg-sky-600',
        },
        {
            name: 'Facebook',
            icon: Facebook,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            color: 'bg-blue-600 hover:bg-blue-700',
        },
        {
            name: 'WhatsApp',
            icon: MessageCircle,
            url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
            color: 'bg-green-500 hover:bg-green-600',
        },
    ];

    if (vehicles.length < 2) {
        return null;
    }

    return (
        <div className={clsx('relative', className)}>
            {/* Share Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    'flex items-center gap-2 px-4 py-2 font-bold uppercase text-sm',
                    'border-2 border-black transition-all',
                    'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                    'hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]',
                    isOpen ? 'bg-blue-500 text-white' : 'bg-white text-black'
                )}
            >
                <Share2 className="w-4 h-4" />
                Share
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        role="button"
                        tabIndex={0}
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setIsOpen(false);
                        }}
                        aria-label="Close panel"
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
                        {/* Header */}
                        <div className="p-3 border-b-2 border-black bg-blue-500 text-white">
                            <div className="flex items-center gap-2">
                                <Share2 className="w-5 h-5" />
                                <span className="font-black uppercase">Share Comparison</span>
                            </div>
                        </div>

                        {/* Copy Link */}
                        <div className="p-3 border-b border-gray-200">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-2">
                                Copy Link
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="flex-1 px-2 py-1.5 text-xs border-2 border-black font-mono truncate"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className={clsx(
                                        'px-3 py-1.5 border-2 border-black font-bold text-xs',
                                        copied
                                            ? 'bg-green-500 text-white'
                                            : 'bg-yellow-400 hover:bg-yellow-500'
                                    )}
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Social Share */}
                        <div className="p-3">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-2">
                                Share on
                            </p>
                            <div className="flex gap-2">
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.name}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={clsx(
                                            'flex-1 flex items-center justify-center gap-1 py-2',
                                            'border-2 border-black text-white font-bold text-xs',
                                            social.color
                                        )}
                                        title={`Share on ${social.name}`}
                                    >
                                        <social.icon className="w-4 h-4" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Native Share (Mobile) */}
                        {typeof navigator !== 'undefined' && 'share' in navigator && (
                            <div className="p-3 border-t border-gray-200">
                                <button
                                    onClick={handleNativeShare}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-black text-white font-bold uppercase text-sm border-2 border-black"
                                >
                                    <Share2 className="w-4 h-4" />
                                    More Options
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
