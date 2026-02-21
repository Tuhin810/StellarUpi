
import React from 'react';
import { QrCode } from 'lucide-react';

interface UniversalQRProps {
    stellarId: string;
    publicKey?: string; // Added for Freighter compatibility
    amount?: string;
    note?: string;
    size?: number;
    className?: string;
}

const UniversalQR: React.FC<UniversalQRProps> = ({ stellarId, publicKey, amount, note, size = 300, className = "" }) => {
    // 1. Universal Smart-Link (Web compatibility)
    const getUniversalLink = () => {
        const baseUrl = `${window.location.origin}/pay`;
        const url = new URL(`${baseUrl}/${stellarId}`);
        if (amount) url.searchParams.append('amt', amount);
        if (note) url.searchParams.append('note', note);
        return url.toString();
    };

    // 2. Stellar SEP-7 Link (Freighter & Wallet compatibility)
    const getSEP7Link = () => {
        // Use publicKey if available, otherwise stellarId
        const destination = publicKey || stellarId;
        const params = new URLSearchParams();
        if (amount) params.append('amount', amount);
        if (note) params.append('memo', note);

        // SEP-7 format: web+stellar:pay?destination=...
        return `web+stellar:pay?destination=${destination}${params.toString() ? '&' + params.toString() : ''}`;
    };

    // Prioritize Universal Link for the widest compatibility (Camera/Guest)
    const qrData = getUniversalLink();

    // Using Level 'H' (High) Error Correction
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrData)}&color=1A1A1A&bgcolor=E5D5B3&ecc=H`;

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
