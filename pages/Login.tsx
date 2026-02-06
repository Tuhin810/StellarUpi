import React, { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { saveUser, getProfile } from '../services/db';
import { createWallet } from '../services/stellar';
import { encryptSecret } from '../services/encryption';
import { useWeb3Modal, useWeb3ModalProvider, useWeb3ModalAccount, generateUPIFromAddress } from '../services/web3';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Loader2, ArrowRight, ShieldCheck, Zap, Lock, Compass } from 'lucide-react';
import { BrowserProvider } from 'ethers';
import mainImage from '../assets/image copy.png';

import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { refreshProfileSync } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnectedLocally, setIsConnectedLocally] = useState(false);
  const from = location.state?.from || '/';

  // Web3Modal hooks
  const { open } = useWeb3Modal();
  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected } = useWeb3ModalAccount();

  const addressLower = address?.toLowerCase();

  // Effect to handle session restoration and connection state
  useEffect(() => {
    if (isConnected && addressLower && walletProvider) {
      setIsConnectedLocally(true);

      // Auto-navigation if already unlocked
      const storedAddr = localStorage.getItem('web3_address');
      const storedKey = localStorage.getItem('temp_vault_key');

      if (storedAddr === addressLower && storedKey) {
        navigate(from);
      }
    } else {
      setIsConnectedLocally(false);
    }
  }, [isConnected, addressLower, walletProvider, navigate]);

  const handleSignAndLogin = async () => {
    if (!addressLower || !walletProvider) return;

    setLoading(true);
    setStatus('Generating encryption keys...');

    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      const message = "Sign this message to access your StellarPay UPI vault. Your signature is used as your local encryption key.";
      const signature = await signer.signMessage(message);

      setStatus('Authenticating with Stellar...');

      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      let profile = await getProfile(addressLower);

      if (!profile) {
        setStatus('Creating your decentralized identity...');
        const stellarId = generateUPIFromAddress(addressLower);
        const { publicKey, secret } = await createWallet();
        const encryptedSecret = encryptSecret(secret, signature);

        profile = {
          uid: addressLower,
          email: `${addressLower.substring(0, 10)}@metamask`,
          stellarId: stellarId,
          publicKey,
          encryptedSecret,
          isFamilyOwner: true,
          displayName: addressLower.substring(0, 6) + '...' + addressLower.substring(38),
          avatarSeed: addressLower
        };

        await saveUser(profile);
      }

      localStorage.setItem('web3_address', addressLower);
      localStorage.setItem('temp_vault_key', signature);

      // Refresh AuthContext so it acknowledges the new session immediately
      refreshProfileSync(addressLower);

      setStatus('Success! Opening vault...');
      setTimeout(() => navigate(from), 800);
    } catch (err: any) {
      console.error("Login Error:", err);
      let errorMsg = err.message || "Connection failed";
      if (err.code === 4001) errorMsg = "Verification cancelled";
      setStatus(errorMsg);
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    setStatus('Waiting for wallet choice...');
    try {
      await open();
    } catch (err: any) {
      console.error("Connect Error:", err);
      setStatus(err.message || "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      {/* Rich Background Aesthetics */}
      <div className="absolute top-0 left-0 right-0 h-screen overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E5D5B3]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[40%] bg-[#E5D5B3]/5 rounded-full blur-[140px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Header / Brand Area */}
      <div className="relative z-20 pt-48 px-8 flex flex-col items-center text-center">
        <div className="space-y-2">
          <h2 className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.4em] ml-1">Stellarpay Protocol</h2>
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">
            The New Web3 UPI
          </h1>
        </div>
      </div>


      {/* Content / Interaction Area */}
      <div className="relative z-20 mt-auto p-8 pb-8 space-y-6">

        {isConnectedLocally ? (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">


            {/* Action Button */}
            <button
              onClick={handleSignAndLogin}
              disabled={loading}
              className="group relative w-full h-[72px] rounded-[1.5rem] overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white group-hover:bg-zinc-100 transition-colors"></div>
              <div className="relative h-full flex items-center justify-center gap-3">
                {loading ? (
                  <Loader2 className="text-black animate-spin" size={24} />
                ) : (
                  <>
                    <span className="text-black text-lg font-black ">Sign message to continue</span>
                    {/* <ArrowRight className="text-black group-hover:translate-x-1 transition-transform" size={20} strokeWidth={3} /> */}
                  </>
                )}
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleConnectWallet}
              disabled={loading}
              className="group relative w-full h-[72px] rounded-[1.5rem] overflow-hidden transition-all active:scale-[0.98]"
            >
              <div className="absolute inset-0 gold-gradient group-hover:brightness-110"></div>
              <div className="relative h-full flex items-center justify-center gap-3 px-6">
                {loading ? (
                  <Loader2 className="text-black animate-spin" size={24} />
                ) : (
                  <>
                    {/* <Wallet className="text-black" size={24} strokeWidth={3} /> */}
                    <span className="text-black text-lg font-black ">Continue with wallet Login</span>
                    {/* <ArrowRight className="text-black group-hover:translate-x-1 transition-transform" size={20} strokeWidth={3} /> */}
                  </>
                )}
              </div>
            </button>

          </div>
        )}

        {/* Status Message Display */}
        {status && (
          <div className="text-center animate-in fade-in duration-500">
            <p className="text-[#E5D5B3] text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
              {status}
            </p>
          </div>
        )}

      </div>

      {/* New Bottom Image */}
      <div className="relative z-20 px-4 pb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="relative group">
          <div className="absolute inset-0 bg-[#E5D5B3]/5 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <img
            src={mainImage}
            alt="StellarPay UI"
            className="w-full rounded-[2rem] shadow-2xl relative z-10"
          />
        </div>
      </div>

      {/* Aesthetic Grain Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none"></div>
    </div>
  );
};

export default Login;