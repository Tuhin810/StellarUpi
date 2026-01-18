
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Camera, QrCode, Sparkles, X, Info, Zap } from 'lucide-react';

const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isFlashOn, setIsFlashOn] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.max(50, Math.floor(minEdge * 0.7)); // Minimum 50px required
          return { width: qrboxSize, height: qrboxSize };
        },
        aspectRatio: 1.0
      },
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
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-sans">
      {/* Immersive Backdrop */}
      <div className="absolute inset-0 bg-black z-0"></div>

      {/* Top Header - Native Style */}
      <div className="relative z-20 pt-14 px-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/10 active:scale-95 transition-all"
        >
          <ArrowLeft size={22} className="text-white" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-1">Scanner</span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#E5D5B3]/10 border border-[#E5D5B3]/20 rounded-full">
            <div className="w-1 h-1 bg-[#E5D5B3] rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-[#E5D5B3]">Active</span>
          </div>
        </div>
        <button
          onClick={() => navigate("/")}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/10 active:scale-95 transition-all"
        >
          <X size={22} className="text-white" />
        </button>
      </div>

      {/* Main Scanner Section */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center ">
        <div className="relative w-full aspect-square max-w-[320px]">
          {/* Scanning Corners - Sleeker */}
          <div className="absolute -top-1 -left-1 w-12 h-12 border-t-[3px] border-l-[3px] border-[#E5D5B3] rounded-tl-3xl z-30"></div>
          <div className="absolute -top-1 -right-1 w-12 h-12 border-t-[3px] border-r-[3px] border-[#E5D5B3] rounded-tr-3xl z-30"></div>
          <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-[3px] border-l-[3px] border-[#E5D5B3] rounded-bl-3xl z-30"></div>
          <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-[3px] border-r-[3px] border-[#E5D5B3] rounded-br-3xl z-30"></div>

          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#E5D5B3] to-transparent shadow-[0_0_20px_rgba(229,213,179,0.8)] z-40 animate-scan-slow opacity-60"></div>
          {/* Scanner Window */}
          <div className="relative w-full h-full bg-zinc-950 rounded-[.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 group">
            <div id="reader" className="w-full h-full"></div>

            {/* Scan Line Animation */}

            {/* Inner Glow */}
            {/* <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none z-20"></div> */}
          </div>

          {/* Error Message Tooltip */}
          {error && (
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-max max-w-[280px] px-6 py-4 bg-rose-500 text-white rounded-2xl font-bold text-xs shadow-2xl z-50 flex items-center gap-3 animate-bounce">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-12 text-center max-w-[200px]">
          <p className="text-zinc-400 text-sm font-medium leading-relaxed">
            Point your camera at a <span className="text-white font-bold">Stellar</span> or <span className="text-white font-bold">UPI</span> QR code
          </p>
        </div>
      </div>

      {/* Bottom Controls - Native Cam Look */}
      <div className="relative z-20 pb-20 px-10 flex justify-center items-center gap-10">
        <button className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-white/10 group-hover:text-white transition-all backdrop-blur-lg">
            <Zap size={24} fill={isFlashOn ? "currentColor" : "none"} />
          </div>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Flash</span>
        </button>

        <button className="flex flex-col items-center gap-3 group">
          <div className="w-20 h-20 bg-[#E5D5B3] rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(229,213,179,0.3)] active:scale-95 transition-all">
            <QrCode size={30} />
          </div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Gallery</span>
        </button>

        <button className="flex flex-col items-center gap-3 group" onClick={() => navigate("/help")}>
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-white/10 group-hover:text-white transition-all backdrop-blur-lg">
            <Info size={24} />
          </div>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Help</span>
        </button>
      </div>

      <style>{`
        @keyframes scan-line-slow {
            0% { transform: translateY(0); opacity: 0 }
            10% { opacity: 0.6 }
            90% { opacity: 0.6 }
            100% { transform: translateY(320px); opacity: 0 }
        }
        .animate-scan-slow {
            animation: scan-line-slow 2.5s ease-in-out infinite;
        }
        #reader { border: none !important; background: transparent !important; }
        #reader > div { border: none !important; } /* Hides the library's default white box */
        #reader video { 
            border-radius: 1.5rem; 
            object-fit: cover !important; 
            width: 100% !important;
            height: 100% !important;
        }
        #reader__dashboard_section_csr button { 
            background: #E5D5B3 !important; 
            color: black !important; 
            border-radius: 1rem !important;
            font-weight: 900 !important;
            padding: 12px 24px !important;
            border: none !important;
            text-transform: uppercase;
            font-size: 0.7rem;
            letter-spacing: 0.1em;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            margin-top: 10px;
        }
        #reader__status_span {
            display: none !important;
        }
        #reader__header_message {
            display: none !important;
        }
      `}</style>
    </div>
  );
};

const AlertCircle = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);

export default QRScanner;
