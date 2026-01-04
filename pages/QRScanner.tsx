
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Camera, QrCode, Sparkles, X } from 'lucide-react';

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
        if (decodedText.includes('@')) {
          navigate(`/send?to=${decodedText}`);
        } else {
          setError("Unknown QR type");
        }
      }
    }

    function onScanFailure(error: any) { }

    return () => {
      scanner.clear().catch(e => console.error("Scanner clear failed", e));
    };
  }, []);

  return (
    <div className="min-h-screen  bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[40%] bg-[#E5D5B3]/5 rounded-full blur-[100px]"></div>

      <div className="relative z-10 pt-5 px-3 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="p-4 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/5">
          <ArrowLeft size={20} className="text-zinc-400" />
        </button>
        <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Universal Scanner</span>
        <button onClick={() => navigate("/")} className="p-4 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/5 text-zinc-400">
          <X size={20} />
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-10">
        <div className="relative w-full max-w-sm aspect-square">
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#E5D5B3] rounded-tl-2xl z-20"></div>
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#E5D5B3] rounded-tr-2xl z-20"></div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#E5D5B3] rounded-bl-2xl z-20"></div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#E5D5B3] rounded-br-2xl z-20"></div>

          <div className="relative w-full h-full bg-zinc-950 rounded-3xl overflow-hidden border border-white/5 shadow-2xl z-10">
            <div id="reader" className="w-full h-full"></div>
          </div>

          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#E5D5B3]/50 to-transparent shadow-[0_0_15px_rgba(229,213,179,0.3)] z-30 animate-scan"></div>
        </div>



        {error && (
          <div className="mt-8 px-6 py-4 bg-rose-500/10 text-rose-500 rounded-2xl font-black text-xs border border-rose-500/20 uppercase tracking-widest backdrop-blur-xl">
            {error}
          </div>
        )}
      </div>

      <div className="relative z-10 p-12 flex justify-center gap-12">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
            <Camera size={24} />
          </div>
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none">Flash</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
            <QrCode size={24} />
          </div>
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none">Gallery</span>
        </div>
      </div>

      <style>{`
        @keyframes scan-line {
            0% { top: 0% }
            100% { top: 100% }
        }
        .animate-scan {
            animation: scan-line 2s linear infinite;
        }
        #reader { border: none !important; }
        #reader video { border-radius: 1.5rem; object-fit: cover !important; }
        #reader__dashboard_section_csr button { 
            background: #E5D5B3 !important; 
            color: black !important; 
            border-radius: 0.75rem !important;
            font-weight: 800 !important;
            padding: 0.5rem 1rem !important;
            border: none !important;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
