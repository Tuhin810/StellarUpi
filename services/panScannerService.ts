
import Tesseract from 'tesseract.js';

export interface PANScanResult {
    panNumber: string | null;
    fullName: string | null;
    fatherName: string | null;
    dob: string | null;
    confidence: number;
    rawText: string;
}

/**
 * PAN Card OCR Scanner
 * Uses Tesseract.js (runs entirely in browser — PAN image never leaves the device)
 * 
 * PAN Card Layout (typical):
 * ─────────────────────────────
 * INCOME TAX DEPARTMENT
 * GOVT. OF INDIA
 * 
 * Permanent Account Number
 * ABCPD1234E
 * 
 * /Name
 * RAJESH KUMAR
 * 
 * /Father's Name
 * SURESH KUMAR
 * 
 * Date of Birth
 * 15/06/1990
 * ─────────────────────────────
 */
export class PANScannerService {

    /**
     * Scan a PAN card image and extract fields.
     * Everything runs client-side via WebAssembly.
     */
    static async scanPANCard(imageSource: File | Blob | string): Promise<PANScanResult> {
        console.log('[OCR] Starting PAN card scan...');

        const result = await Tesseract.recognize(imageSource, 'eng', {
            logger: (m: any) => {
                if (m.status === 'recognizing text') {
                    console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
                }
            },
        });

        const rawText = result.data.text;
        const confidence = result.data.confidence;

        console.log('[OCR] Raw text:', rawText);
        console.log('[OCR] Confidence:', confidence);

        return {
            panNumber: this.extractPAN(rawText),
            fullName: this.extractName(rawText),
            fatherName: this.extractFatherName(rawText),
            dob: this.extractDOB(rawText),
            confidence,
            rawText,
        };
    }

    /**
     * Extract PAN number using regex.
     * PAN format: ABCPD1234E (5 alpha, 4 digit, 1 alpha)
     */
    private static extractPAN(text: string): string | null {
        const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/;
        const match = text.match(panRegex);
        return match ? match[0] : null;
    }

    /**
     * Extract holder's name from PAN card text.
     * Looks for the name after "Name" or "/Name" label.
     */
    private static extractName(text: string): string | null {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toUpperCase();

            // Look for name label patterns
            if (
                line.includes('/NAME') ||
                line.includes('NAME') && !line.includes('FATHER') && !line.includes('ACCOUNT') && !line.includes('PERMANENT')
            ) {
                // The actual name is usually on the next line
                if (i + 1 < lines.length) {
                    const nameLine = lines[i + 1].trim();
                    // Validate it looks like a name (mostly alpha + spaces)
                    if (/^[A-Za-z\s]{3,}$/.test(nameLine) && !this.isLabel(nameLine)) {
                        return this.formatName(nameLine);
                    }
                }
            }
        }

        // Fallback: Look for the first all-caps name-like string after the PAN number
        const panIndex = lines.findIndex(l => /[A-Z]{5}[0-9]{4}[A-Z]/.test(l));
        if (panIndex >= 0) {
            for (let i = panIndex + 1; i < Math.min(panIndex + 4, lines.length); i++) {
                const candidate = lines[i].trim();
                if (/^[A-Za-z\s]{3,}$/.test(candidate) && !this.isLabel(candidate)) {
                    return this.formatName(candidate);
                }
            }
        }

        return null;
    }

    /**
     * Extract father's name from PAN card text.
     */
    private static extractFatherName(text: string): string | null {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toUpperCase();
            if (line.includes("FATHER") || line.includes("/FATHER")) {
                if (i + 1 < lines.length) {
                    const nameLine = lines[i + 1].trim();
                    if (/^[A-Za-z\s]{3,}$/.test(nameLine) && !this.isLabel(nameLine)) {
                        return this.formatName(nameLine);
                    }
                }
            }
        }

        return null;
    }

    /**
     * Extract date of birth from PAN card text.
     */
    private static extractDOB(text: string): string | null {
        // Match DD/MM/YYYY or DD-MM-YYYY
        const dobRegex = /\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/;
        const match = text.match(dobRegex);
        return match ? match[1] : null;
    }

    /**
     * Check if a line is a known label (not a name)
     */
    private static isLabel(text: string): boolean {
        const labels = [
            'INCOME', 'TAX', 'DEPARTMENT', 'GOVT', 'INDIA', 'PERMANENT',
            'ACCOUNT', 'NUMBER', 'NAME', 'FATHER', 'DATE', 'BIRTH',
            'SIGNATURE', 'PHOTO', 'CARD', 'PAN',
        ];
        const upper = text.toUpperCase();
        return labels.some(l => upper.includes(l));
    }

    /**
     * Format name: "RAJESH KUMAR" → "Rajesh Kumar"
     */
    private static formatName(name: string): string {
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Pre-process image for better OCR accuracy.
     * Converts to grayscale and increases contrast.
     */
    static async preprocessImage(file: File): Promise<string> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const img = new Image();

            img.onload = () => {
                // Scale to reasonable size for OCR
                const maxWidth = 1200;
                const scale = Math.min(1, maxWidth / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Convert to grayscale and increase contrast
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    // Grayscale using luminance formula
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

                    // Increase contrast
                    const contrast = 1.5;
                    const adjusted = ((gray / 255 - 0.5) * contrast + 0.5) * 255;
                    const final = Math.max(0, Math.min(255, adjusted));

                    data[i] = final;     // R
                    data[i + 1] = final; // G
                    data[i + 2] = final; // B
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };

            img.src = URL.createObjectURL(file);
        });
    }
}
