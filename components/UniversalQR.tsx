
import React from 'react';
import { QrCode } from 'lucide-react';

interface UniversalQRProps {
    stellarId: string;
    amount?: string;
    note?: string;
    size?: number;
    className?: string;
}

const UniversalQR: React.FC<UniversalQRProps> = ({ stellarId, amount, note, size = 300, className = "" }) => {
    const getUniversalLink = () => {
        // Construct the Universal Smart-Link URL
        const baseUrl = "https://chingpay.app/pay";
        const url = new URL(`${baseUrl}/${stellarId}`);

        if (amount) url.searchParams.append('amt', amount);
        if (note) url.searchParams.append('note', note);

        return url.toString();
    };

    // Using Level 'H' (High) Error Correction as requested
    // qrserver.com uses 'ecc' parameter for error correction level
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(getUniversalLink())}&color=1A1A1A&bgcolor=E5D5B3&ecc=H`;

    return (
        <div className={`relative flex flex-col items-center ${className}`}>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-inner border-4 border-black/5">
                <img
                    src={qrUrl}
                    alt="Universal Payment QR"
                    className="w-full h-full"
                    style={{ width: size - 48, height: size - 48 }}
                />
            </div>

            <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full border border-black/5">
                <QrCode size={12} className="text-black/40" />
                <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Universal Smart-Link</span>
            </div>
        </div>
    );
};

export default UniversalQR;
