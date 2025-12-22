'use client';

import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface GoogleAdSlotProps {
    className?: string;
    style?: React.CSSProperties;
    slot: string;
    format?: string;
    fullWidthResponsive?: boolean;
}

/**
 * Reusable Google AdSense ad slot component.
 * Requires global AdSense script and NEXT_PUBLIC_ADSENSE_CLIENT env variable.
 */
export function GoogleAdSlot({
    className,
    style,
    slot,
    format = 'auto',
    fullWidthResponsive = true,
}: GoogleAdSlotProps) {
    const adRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
            // Ignore errors to avoid breaking the page if AdSense is not configured
        }
    }, []);

    // Reserve space to avoid layout shift
    const mergedStyle: React.CSSProperties = {
        display: 'block',
        minHeight: 90,
        ...style,
    };

    if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT) {
        // When client id is not configured, render empty placeholder
        return null;
    }

    return (
        <div className={clsx('w-full flex justify-center', className)}>
            <ins
                ref={adRef as any}
                className="adsbygoogle"
                style={mergedStyle}
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
            />
        </div>
    );
}
