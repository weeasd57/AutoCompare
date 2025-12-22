// ============================================
// Print Button Component
// Generates print-friendly comparison view
// ============================================

'use client';

import { Printer } from 'lucide-react';
import { clsx } from 'clsx';
import type { ComparisonResult, ComparisonHighlight } from '@/types/vehicle';

interface PrintButtonProps {
    comparison: ComparisonResult;
    highlights: ComparisonHighlight[];
    className?: string;
}

/**
 * PrintButton Component
 * Opens print dialog with optimized comparison layout
 */
export function PrintButton({ comparison, highlights, className }: PrintButtonProps) {
    const handlePrint = () => {
        // Create print-friendly content
        const printContent = generatePrintContent(comparison, highlights);

        // Open new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
        };
    };

    return (
        <button
            onClick={handlePrint}
            className={clsx(
                'flex items-center gap-2 px-4 py-2 font-bold uppercase text-sm',
                'bg-white border-2 border-black',
                'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                'hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]',
                'hover:bg-gray-100 transition-all',
                className
            )}
        >
            <Printer className="w-4 h-4" />
            Print
        </button>
    );
}

/**
 * Generate print-friendly HTML content
 */
function generatePrintContent(
    comparison: ComparisonResult,
    highlights: ComparisonHighlight[]
): string {
    const vehicles = comparison.vehicles;
    const today = new Date().toLocaleDateString();

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Vehicle Comparison - AutoCompare</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            color: #000;
            background: #fff;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #000;
        }
        .logo {
            font-size: 24px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -1px;
        }
        .date {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        .vehicles-grid {
            display: grid;
            grid-template-columns: repeat(${Math.min(vehicles.length, 3)}, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .vehicle-card {
            border: 2px solid #000;
            padding: 15px;
        }
        .vehicle-card.winner {
            background: #fef3c7;
        }
        .vehicle-name {
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .vehicle-meta {
            font-size: 12px;
            color: #666;
            margin-bottom: 15px;
        }
        .spec-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
            font-size: 13px;
        }
        .spec-label {
            font-weight: 600;
        }
        .comparison-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .comparison-table th,
        .comparison-table td {
            border: 1px solid #000;
            padding: 10px;
            text-align: left;
        }
        .comparison-table th {
            background: #000;
            color: #fff;
            font-weight: 900;
            text-transform: uppercase;
        }
        .comparison-table tr:nth-child(even) {
            background: #f5f5f5;
        }
        .winner-cell {
            background: #dcfce7 !important;
            font-weight: bold;
        }
        .highlights {
            margin-top: 30px;
        }
        .highlights h3 {
            font-size: 16px;
            font-weight: 900;
            text-transform: uppercase;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
        }
        .highlight-item {
            padding: 10px;
            margin-bottom: 10px;
            border-left: 4px solid #000;
            background: #f5f5f5;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #000;
            text-align: center;
            font-size: 11px;
            color: #666;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🚗 AutoCompare</div>
        <div class="date">Generated on ${today}</div>
    </div>

    <div class="vehicles-grid">
        ${vehicles
            .map(
                (v) => `
            <div class="vehicle-card ${comparison.overallWinner === v.id ? 'winner' : ''}">
                ${comparison.overallWinner === v.id ? '<div style="font-size:12px;font-weight:bold;color:#059669;margin-bottom:10px;">★ WINNER</div>' : ''}
                <div class="vehicle-name">${v.make} ${v.model}</div>
                <div class="vehicle-meta">${v.year} • ${v.trim || 'Base'}</div>
                <div class="spec-row">
                    <span class="spec-label">Horsepower</span>
                    <span>${v.horsepower || 'N/A'} hp</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">MPG</span>
                    <span>${v.fuelCombinedMpg || 'N/A'}</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">Drivetrain</span>
                    <span>${v.drivetrain || 'N/A'}</span>
                </div>
                <div class="spec-row">
                    <span class="spec-label">Price</span>
                    <span>${v.basePrice ? '$' + v.basePrice.toLocaleString() : 'N/A'}</span>
                </div>
            </div>
        `
            )
            .join('')}
    </div>

    ${
        highlights.length > 0
            ? `
        <div class="highlights">
            <h3>Key Insights</h3>
            ${highlights
                .slice(0, 5)
                .map(
                    (h) => `
                <div class="highlight-item">
                    <strong>${h.category}</strong>
                    <p>${h.message}</p>
                </div>
            `
                )
                .join('')}
        </div>
    `
            : ''
    }

    <div class="footer">
        <p>Comparison generated by AutoCompare | ${window.location.origin}</p>
    </div>
</body>
</html>
    `;
}
