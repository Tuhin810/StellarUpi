import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Camera, QrCode, Sparkles, X, Info, Zap, Radio, Waves, AlertCircle, Smartphone, CheckCircle2 } from 'lucide-react';

const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scanResult, setScanResult] = useState<{ pa: string, pn: string, am?: string, platform?: string, type: 'upi' | 'stellar' } | null>(null);
  const [scannerInstance, setScannerInstance] = useState<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.max(50, Math.floor(minEdge * 0.7));
          return { width: qrboxSize, height: qrboxSize };
        },
        aspectRatio: 1.0,
        videoConstraints: {
          facingMode: { ideal: "environment" }
        },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true
      },
      false
    );

    const getPlatform = (pa: string) => {
      const handle = pa.split('@')[1]?.toLowerCase();
      if (!handle) return 'Unknown';

      if (handle.startsWith('ok')) return 'Google Pay';
      if (['ybl', 'ibl', 'axl'].includes(handle)) return 'PhonePe';
      if (handle === 'paytm') return 'Paytm';
      if (handle === 'apl') return 'Amazon Pay';
      if (handle === 'supermoney') return 'super.money';
      if (handle === 'pop') return 'Pop';
      if (handle === 'upi') return 'BHIM';
      if (handle.startsWith('wa')) return 'WhatsApp Pay';
      if (handle === 'slice' || handle === 'sliceit') return 'Slice';
      if (handle.includes('jupiter')) return 'Jupiter';

      return 'UPI Node';
    };

    setScannerInstance(scanner);
    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText: string) {
      if (decodedText.startsWith('upi://pay')) {
        try {
          const url = new URL(decodedText);
          const pa = url.searchParams.get('pa') || '';
          const pn = url.searchParams.get('pn') || '';
          const am = url.searchParams.get('am') || '';
          const platform = getPlatform(pa);
          setScanResult({ pa, pn, am, platform, type: 'upi' });
          return;
        } catch (e) {
          console.error("UPI Parse Error", e);
        }
      }

      try {
        const url = new URL(decodedText);
        const to = url.searchParams.get('to');
        const amt = url.searchParams.get('amt') || '';
        if (to) {
          setScanResult({ pa: to, pn: '', am: amt, platform: 'Stellar Protocol', type: 'stellar' });
          return;
        } else {
          setError("Invalid QR Code Format");
          setTimeout(() => setError(''), 3000);
        }
      } catch (e) {
        if (decodedText.includes('@')) {
          setScanResult({ pa: decodedText, pn: '', am: '', platform: 'Stellar Protocol', type: 'stellar' });
        } else {
          setError("Unknown QR type");
          setTimeout(() => setError(''), 3000);
        }
      }
    }

    function onScanFailure(error: any) { }

    return () => {
      scanner.clear().catch(e => console.error("Scanner clear failed", e));
    };
  }, [navigate]);

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

        {/* Scan Result Bottom Drawer */}
        {scanResult && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setScanResult(null)}></div>

            <div className="relative w-full max-w-md bg-zinc-950 rounded-t-[3rem] overflow-hidden shadow-[0_-20px_100px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-500 border-t border-white/10">
              {/* Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 bg-white/10 rounded-full"></div>
              </div>

              {/* Header Area */}
              <div className={`relative h-24 flex flex-col items-center justify-center overflow-hidden ${scanResult.type === 'upi' ? 'bg-indigo-600' : 'gold-gradient'}`}>
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,white_0%,transparent_70%)] animate-pulse"></div>
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xl mb-1 ${scanResult.type === 'upi' ? 'bg-white text-indigo-600' : 'bg-black text-[#E5D5B3]'}`}>
                    {scanResult.type === 'upi' ? <Smartphone size={20} /> : <Sparkles size={20} />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${scanResult.type === 'upi' ? 'text-white/60' : 'text-black/60'}`}>
                    {scanResult.type === 'upi' ? 'UPI Node Found' : 'Stellar Node Found'}
                  </span>
                </div>
              </div>

              <div className="px-8 pt-8 pb-12">
                {/* Identity Card */}
                <div className="relative mb-6 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-3">
                    <CheckCircle2 size={12} className={scanResult.type === 'upi' ? 'text-indigo-400' : 'text-[#E5D5B3]'} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${scanResult.type === 'upi' ? 'text-indigo-400' : 'text-[#E5D5B3]'}`}>
                      Verified {scanResult.type === 'upi' ? 'VPA Node' : 'Stellar Vault'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter text-white mb-1">
                    {scanResult.pn || (scanResult.type === 'stellar' ? scanResult.pa.split('@')[0] : "Unknown Merchant")}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {scanResult.platform}
                    </span>
                    <p className="text-zinc-500 font-mono text-xs tracking-tight">{scanResult.pa}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Network</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                      {scanResult.type === 'upi' ? 'Unified Payments' : 'Stellar Horizon'}
                    </span>
                  </div>
                  {scanResult.am && (
                    <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/10">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Requested</span>
                      <span className="text-xl font-black text-white">{scanResult.type === 'upi' ? '₹' : ''}{scanResult.am} {scanResult.type === 'stellar' ? 'XLM' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Testnet Warning for UPI */}
                {scanResult.type === 'upi' && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-8 flex gap-3">
                    <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Development Mode</p>
                      <p className="text-[10px] font-medium text-amber-500/70 leading-relaxed">
                        External UPI payments are disabled in <span className="font-bold text-amber-500">v1.4</span>. Bridge assets to Mainnet for real-world settlement.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setScanResult(null)}
                    className="flex-1 py-5 bg-zinc-900 text-zinc-400 font-black rounded-[1.5rem] text-xs uppercase tracking-[0.2em] active:scale-[0.98] transition-all border border-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (scanResult.type === 'stellar') {
                        scannerInstance?.clear();
                        navigate(`/send?to=${scanResult.pa}&amt=${scanResult.am || ''}`);
                      } else {
                        setScanResult(null);
                      }
                    }}
                    className={`flex-[2] py-5 font-black rounded-[1.5rem] text-xs uppercase tracking-[0.2em] active:scale-[0.98] transition-all shadow-xl ${scanResult.type === 'stellar' ? 'gold-gradient text-black' : 'bg-white text-black'}`}
                  >
                    {scanResult.type === 'stellar' ? 'Settle Now' : 'Acknowledged'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

        <button className="flex flex-col items-center gap-3 group" onClick={() => navigate("/sonic?mode=receive")}>
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-all backdrop-blur-lg">
            <Radio size={24} className="animate-pulse" />
          </div>
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Sonic Pulse</span>
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

export default QRScanner;
