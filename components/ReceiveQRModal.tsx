
import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ReceiveQRModalProps {
    stellarId: string;
    publicKey?: string;
    onClose: () => void;
}

const ReceiveQRModal: React.FC<ReceiveQRModalProps> = ({ stellarId, publicKey, onClose }) => {
    // Priority: Universal Link for Guest/Camera compatibility
    const universalLink = `${window.location.origin}/#/pay/${stellarId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(universalLink)}&color=1A1A1A&bgcolor=E5D5B3`;

    const handleShare = () => {
        const universalLink = `${window.location.origin}/#/pay/${stellarId}`;
        if (navigator.share) {
            navigator.share({
                title: 'Pay me on Ching Pay',
                text: `Send money to my Stellar ID: ${stellarId}`,
                url: universalLink,
            });
        } else {
            navigator.clipboard.writeText(universalLink);
            alert('Payment link copied to clipboard!');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1a2520] to-[#0d1510] border border-white/10 rounded-3xl p-8 flex flex-col items-center">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/60"
                >
                    <X size={18} />
                </button>

                <p className="text-white/40 text-xs mb-2">Scan to Pay</p>
                <p className="font-semibold mb-6">{stellarId}</p>

                <div className="bg-white p-4 rounded-2xl mb-6">
                    <img
                        src={qrUrl}
                        alt="Receive QR"
                        className="w-56 h-56"
                    />
                </div>

                <p className="text-center text-white/40 text-xs mb-6 px-4">
                    Show this QR to receive payments directly into your wallet
                </p>

                <button
                    onClick={handleShare}
                    className="w-full py-4 bg-[#E5D5B3] text-black rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <ExternalLink size={16} /> Share Payment Link
                </button>
            </div>
        </div>
    );
};

export default ReceiveQRModal;
