
import React, { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { saveUser, getProfile } from '../services/db';
import { createWallet } from '../services/stellar';
import { encryptSecret } from '../services/encryption';
import { connectWallet, signMessage, generateUPIFromAddress } from '../services/web3';
import { useNavigate } from 'react-router-dom';
import { Wallet, ShieldCheck, Loader2, Sparkles, Zap, ChevronRight } from 'lucide-react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleMetaMaskLogin = async () => {
    setLoading(true);
    setStatus('Initializing Vault...');

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not detected. Install extension to continue.");
      }

      setStatus('Linking MetaMask...');
      const { address, signer } = await connectWallet();

      setStatus('Unlocking Encryption...');
      const message = "Sign this message to access your StellarPay UPI vault. Your signature is used as your local encryption key.";
      const signature = await signMessage(signer, message);

      const addressLower = address.toLowerCase();
      setStatus('Verifying Identity...');

      await signInAnonymously(auth);

      let profile = await getProfile(addressLower);

      if (!profile) {
        setStatus('Creating Stellar Vault...');
        const stellarId = generateUPIFromAddress(addressLower);
        const { publicKey, secret } = await createWallet();
        const encryptedSecret = encryptSecret(secret, signature);

        profile = {
          uid: addressLower,
          email: `${addressLower.substring(0, 10)}@metamask`,
          stellarId: stellarId,
          publicKey,
          encryptedSecret,
          isFamilyOwner: true
        };

        await saveUser(profile);
      }

      localStorage.setItem('web3_address', addressLower);
      sessionStorage.setItem('temp_vault_key', signature);

      window.location.href = '/';
    } catch (err: any) {
      console.error("MetaMask Login Error:", err);
      let errorMsg = err.message || "Connection failed";
      if (err.code === 4001) errorMsg = "Request rejected";
      setStatus(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col justify-between px-8 py-20 text-white relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[50%] bg-[#E5D5B3]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[40%] bg-zinc-800/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 text-center mt-12">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-[2.5rem] mb-10 shadow-2xl border border-white/5 relative">
          <Zap size={40} className="text-[#E5D5B3]" />
          <div className="absolute -top-2 -right-2 w-8 h-8 gold-gradient rounded-full flex items-center justify-center shadow-lg">
            <Sparkles size={14} className="text-black" />
          </div>
        </div>

        <h1 className="text-5xl font-black tracking-tighter mb-4 leading-tight">
          StellarPay <span className="gold-text">Vault</span>
        </h1>
        <p className="text-zinc-500 font-bold text-lg tracking-tight max-w-[240px] mx-auto leading-relaxed">
          The elite layer for UPI on Stellar Network.
        </p>
      </div>

      <div className="relative z-10 space-y-8">
        <div className="space-y-4">
          <button
            onClick={handleMetaMaskLogin}
            disabled={loading}
            className="w-full h-20 gold-gradient text-black rounded-3xl font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span className="text-sm uppercase tracking-[0.2em]">{status || 'Working...'}</span>
              </>
            ) : (
              <>
                <Wallet size={24} />
                <span>Link MetaMask</span>
                <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ChevronRight size={20} />
                </div>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">
              <ShieldCheck size={14} className="text-[#E5D5B3]" />
              Protected Vault
            </div>
            <div className="w-[1px] h-3 bg-zinc-800"></div>
            <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">
              <Zap size={14} className="text-[#E5D5B3]" />
              Stellar Layer
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="bg-zinc-800 p-3 rounded-2xl">
              <ShieldCheck className="text-[#E5D5B3]" size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-black text-white mb-1 tracking-tight">Biometric Security</h4>
              <p className="text-xs font-bold text-zinc-500 leading-relaxed uppercase tracking-wider">
                Your signature is the master key. No seeds, no hacks, total control.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
          Stellar Development Protocol
        </p>
      </div>
    </div>
  );
};

export default Login;
