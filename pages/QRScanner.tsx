
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Camera, QrCode } from 'lucide-react';

const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText: string) {
      scanner.clear();
      // Expecting format: stellarpay://pay?to=alex@stellar&amt=100
      try {
        const url = new URL(decodedText);
        const to = url.searchParams.get('to');
        const amt = url.searchParams.get('amt') || '';
        if (to) {
          navigate(`/send?to=${to}&amt=${amt}`);
        } else {
          setError("Invalid QR Code Format");
        }
      } catch (e) {
        setError("Invalid QR Code");
      }
    }

    function onScanFailure(error: any) {
      // Quiet fail to keep scanning
    }

    return () => {
      scanner.clear().catch(e => console.error("Scanner clear failed", e));
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="pt-12 px-6 flex items-center justify-between z-10">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/10 backdrop-blur-lg rounded-2xl">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-black tracking-tight">Scan to Pay</h2>
        <div className="w-12" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative px-10">
        <div className="w-full max-w-sm aspect-square bg-gray-900 rounded-[3rem] border-4 border-indigo-500 overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.5)]">
           <div id="reader"></div>
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-600 px-6 py-3 rounded-2xl font-bold mb-4">
            <QrCode size={20} />
            <span>Align QR in frame</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Any StellarPay or compatible QR</p>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 text-red-500 rounded-2xl font-bold border border-red-500/50">
            {error}
          </div>
        )}
      </div>

      <div className="p-10 flex justify-center gap-10 bg-gradient-to-t from-black to-transparent">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
             <Camera size={28} />
          </div>
          <span className="text-xs font-bold text-gray-400">Flash</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
             <QrCode size={28} />
          </div>
          <span className="text-xs font-bold text-gray-400">Gallery</span>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
