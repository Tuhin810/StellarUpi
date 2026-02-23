
import React from 'react';
import { QrCode } from 'lucide-react';

interface UniversalQRProps {
    stellarId: string;
    publicKey?: string;
    avatarUrl?: string; // Add avatarUrl prop
    amount?: string;
    note?: string;
    size?: number;
    className?: string;
}

const UniversalQR: React.FC<UniversalQRProps> = ({ stellarId, publicKey, avatarUrl, amount, note, size = 300, className = "" }) => {
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
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrData)}&color=000&bgcolor=fff&ecc=H`;

    const qrInnerSize = size - 48;
    const avatarSize = qrInnerSize * 0.22; // About 22% of QR size

    return (
        <div className={`relative flex flex-col items-center ${className}`}>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-black/5 relative">
                <div className="relative" style={{ width: qrInnerSize, height: qrInnerSize }}>
                    <img
                        src={qrUrl}
                        alt="Payment QR"
                        className="w-full h-full"
                    />

                    {avatarUrl && (
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-2xl shadow-lg border border-black/10 flex items-center justify-center overflow-hidden"
                            style={{
                                width: avatarSize,
                                height: avatarSize,
                            }}
                        >
                            <img
                                src={avatarUrl}
                                alt="User Avatar"
                                className="w-full h-full object-cover rounded-xl"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="my-4 flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full border border-black/5">
                <QrCode size={10} className="text-black/40" />
                <span className="text-[9px] font-black uppercase tracking-widest text-black/40">
                    Scan to Pay · Any Wallet
                </span>
            </div>
        </div>
    );
};

export default UniversalQR;
