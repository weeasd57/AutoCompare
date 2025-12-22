// ============================================
// PDF Generator - Export Comparison to PDF
// Uses jsPDF for client-side PDF generation
// ============================================

'use client';

import { jsPDF } from 'jspdf';
import type { ComparisonResult, ComparisonHighlight } from '@/types/vehicle';
import { AppSettings } from '@/context/SettingsContext';

/**
 * Helper to convert Hex to RGB array
 */
function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

/**
 * PDF styling constants
 */
const PDF_STYLES = {
    // Colors
    primaryColor: [14, 165, 233] as [number, number, number], // Sky blue
    textColor: [15, 23, 42] as [number, number, number], // Dark slate
    lightGray: [241, 245, 249] as [number, number, number],
    winnerGreen: [16, 185, 129] as [number, number, number],
    loserRed: [239, 68, 68] as [number, number, number],
    tieGray: [100, 116, 139] as [number, number, number],

    // Fonts
    titleSize: 24,
    headingSize: 16,
    normalSize: 10,
    smallSize: 8,

    // Spacing
    margin: 15, // Detailed report needs more space
    lineHeight: 6,
};

/**
 * Generate PDF from comparison results
 */
export async function generateComparisonPDF(
    comparison: ComparisonResult,
    highlights: ComparisonHighlight[],
    settings: AppSettings
): Promise<Blob> {
    const primaryRgb = hexToRgb(settings.primaryColor);
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const { margin } = PDF_STYLES;
    const contentWidth = pageWidth - margin * 2;
    const vehicles = comparison.vehicles;

    let yPosition = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
            return true;
        }
        return false;
    };

    // ===== HEADER =====
    // Logo/Brand
    doc.setFillColor(...primaryRgb);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(PDF_STYLES.titleSize);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.siteName, margin, 25);

    doc.setFontSize(PDF_STYLES.smallSize);
    doc.setFont('helvetica', 'normal');
    doc.text('Vehicle Comparison Report', margin, 33);

    // Date
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    doc.text(date, pageWidth - margin - 40, 33);

    yPosition = 55;

    // ===== VEHICLE NAMES SUMMARY =====
    doc.setTextColor(...PDF_STYLES.textColor);
    doc.setFontSize(PDF_STYLES.headingSize);
    doc.setFont('helvetica', 'bold');

    const titleText = vehicles.map((v) => v.model).join(' vs ');
    const splitTitle = doc.splitTextToSize(titleText, contentWidth);
    doc.text(splitTitle, margin, yPosition);
    yPosition += splitTitle.length * 8 + 10;

    // ===== KEY INSIGHTS SECTION =====
    if (highlights.length > 0) {
        checkPageBreak(50);

        doc.setFillColor(...PDF_STYLES.lightGray);
        doc.roundedRect(margin, yPosition, contentWidth, 10 + highlights.length * 8, 3, 3, 'F');

        const boxTop = yPosition;
        yPosition += 8;

        doc.setFontSize(PDF_STYLES.headingSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Insights', margin + 5, yPosition);

        yPosition += 8;
        doc.setFontSize(PDF_STYLES.normalSize);
        doc.setFont('helvetica', 'normal');

        for (const highlight of highlights) {
            // sanitize text
            doc.text(`• ${highlight.message}`, margin + 5, yPosition);
            yPosition += PDF_STYLES.lineHeight;
        }

        yPosition = boxTop + 10 + highlights.length * 8 + 10;
    }

    // ===== SPECIFICATIONS TABLE =====
    checkPageBreak(30);

    doc.setFontSize(PDF_STYLES.headingSize);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Specifications', margin, yPosition);
    yPosition += 10;

    // Dynamic Column Calculation
    // First col is label (e.g. 50mm), rest spread evenly
    const labelColWidth = 50;
    const valueColWidth = (contentWidth - labelColWidth) / vehicles.length;

    // Draw Header Background
    doc.setFillColor(...primaryRgb);
    doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(PDF_STYLES.smallSize);
    doc.setFont('helvetica', 'bold');

    doc.text('Specification', margin + 2, yPosition);

    vehicles.forEach((v, index) => {
        const xPos = margin + labelColWidth + index * valueColWidth;
        const name = `${v.make} ${v.model}`;
        // Truncate if too long
        const safeName = name.length > 20 ? name.substring(0, 18) + '...' : name;
        doc.text(safeName, xPos + 2, yPosition);
    });

    yPosition += 10;
    doc.setTextColor(...PDF_STYLES.textColor);

    // Table rows
    let rowIndex = 0;
    for (const category of comparison.categories) {
        checkPageBreak(10);

        // Alternate row colors
        if (rowIndex % 2 === 0) {
            doc.setFillColor(...PDF_STYLES.lightGray);
            doc.rect(margin, yPosition - 4, contentWidth, 7, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(PDF_STYLES.normalSize);

        // Category name
        doc.setTextColor(...PDF_STYLES.textColor);
        doc.text(category.name, margin + 2, yPosition);

        // Values
        vehicles.forEach((v, index) => {
            const xPos = margin + labelColWidth + index * valueColWidth;
            const val = category.values[v.id];

            // Format value
            let displayVal = 'N/A';
            if (val !== null && val !== undefined) {
                if (typeof val === 'number') {
                    displayVal = val.toLocaleString();
                    if (category.unit) displayVal += ` ${category.unit}`;
                } else {
                    displayVal = String(val);
                }
            }

            // Winner highlight color
            const isWinner = category.winner === v.id;
            const isTie = category.winner === 'tie';

            if (isWinner) {
                doc.setTextColor(...PDF_STYLES.winnerGreen);
                doc.setFont('helvetica', 'bold');
            } else if (isTie) {
                doc.setTextColor(...PDF_STYLES.tieGray);
                doc.setFont('helvetica', 'normal');
            } else {
                doc.setTextColor(...PDF_STYLES.textColor);
                doc.setFont('helvetica', 'normal');
            }

            // Wrap text if needed
            const lines = doc.splitTextToSize(displayVal, valueColWidth - 4);
            doc.text(lines, xPos + 2, yPosition);
        });

        yPosition += PDF_STYLES.lineHeight;
        rowIndex++;
    }

    // ===== FOOTER =====
    yPosition = pageHeight - 15;
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(PDF_STYLES.smallSize);
    doc.setFont('helvetica', 'normal');
    doc.text(
        `Generated by ${settings.siteName} | Data sourced from NHTSA VPIC API`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
    );

    // Return as blob
    return doc.output('blob');
}

/**
 * Download PDF with given filename
 */
export function downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate and download comparison PDF
 */
export async function exportComparisonToPDF(
    comparison: ComparisonResult,
    highlights: ComparisonHighlight[],
    settings: AppSettings
): Promise<void> {
    const blob = await generateComparisonPDF(comparison, highlights, settings);

    // Create filename from models
    const modelNames = comparison.vehicles.map((v) => v.model.replace(/\s+/g, '-')).join('-vs-');
    const filename = `comparison-${modelNames}-${Date.now()}.pdf`;

    downloadPDF(blob, filename);
}

/**
 * Generate summary text for sharing
 */
export function generateShareText(
    comparison: ComparisonResult,
    highlights: ComparisonHighlight[],
    settings: AppSettings
): string {
    const title = comparison.vehicles.map((v) => `${v.make} ${v.model} ${v.year}`).join(' vs ');

    let text = `🚗 ${settings.siteName} Comparison: ${title}\n\n`;
    text += `Key Insights:\n`;

    for (const highlight of highlights.slice(0, 3)) {
        // Simple text sanitization
        text += `• ${highlight.message}\n`;
    }

    text += `\nGenerated by ${settings.siteName}`;

    return text;
}
