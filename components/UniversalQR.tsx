
import React from 'react';
import { QrCode } from 'lucide-react';

interface UniversalQRProps {
    stellarId: string;
    publicKey?: string;
    amount?: string;
    note?: string;
    size?: number;
    className?: string;
}

const UniversalQR: React.FC<UniversalQRProps> = ({ stellarId, publicKey, amount, note, size = 300, className = "" }) => {
    // Universal Web Link — works with any phone camera, browser, or wallet that scans URLs
    // Freighter users should use the "Pay with Freighter" button on the payment page instead
    const getUniversalLink = () => {
        const baseUrl = `${window.location.origin}/#/pay`;
        const url = new URL(`${baseUrl}/${stellarId}`);
        if (amount) url.searchParams.append('amt', amount);
        if (note) url.searchParams.append('note', note);
        return url.toString();
    };

    const qrData = getUniversalLink();
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrData)}&color=1A1A1A&bgcolor=E5D5B3&ecc=H`;

    return (
        <div className={`relative flex flex-col items-center ${className}`}>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-inner border-4 border-black/5">
                <img
                    src={qrUrl}
                    alt="Payment QR"
                    className="w-full h-full"
                    style={{ width: size - 48, height: size - 48 }}
                />
            </div>

            <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full border border-black/5">
                <QrCode size={10} className="text-black/40" />
                <span className="text-[9px] font-black uppercase tracking-widest text-black/40">
                    Scan to Pay · Any Wallet
                </span>
            </div>
        </div>
    );
};

export default UniversalQR;
