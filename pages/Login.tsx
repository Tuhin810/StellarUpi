import React, { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { saveUser, getProfile } from '../services/db';
import { createWallet } from '../services/stellar';
import { encryptSecret } from '../services/encryption';
import { useWeb3Modal, useWeb3ModalProvider, useWeb3ModalAccount, generateUPIFromAddress } from '../services/web3';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Zap } from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';
import { BrowserProvider } from 'ethers';
import { connectFreighter, freighterSignMessage } from '../services/freighter';
import mainImage from '../assets/image copy.png';

import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { refreshProfileSync } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnectedLocally, setIsConnectedLocally] = useState(false);
  const [isFreighter, setIsFreighter] = useState(false);
  const [freighterAddr, setFreighterAddr] = useState<string | null>(null);
  const from = location.state?.from || '/';

  // Web3Modal hooks
  const { open } = useWeb3Modal();
  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected } = useWeb3ModalAccount();

  const addressLower = address?.toLowerCase();

  // Effect to handle session restoration and connection state
  useEffect(() => {
    // If we're already locked in a process, don't do background sync
    if (loading || isConnectedLocally) return;

    if (isConnected && addressLower && walletProvider) {
      console.log("Login: Web3 account detected");
      setIsConnectedLocally(true);

      const storedAddr = localStorage.getItem('web3_address');
      const storedKey = localStorage.getItem('temp_vault_key');
      if (storedAddr === addressLower && storedKey) {
        console.log("Login: Session valid, navigating to:", from);
        navigate(from, { replace: true });
      }
    }
  }, [isConnected, addressLower, walletProvider, navigate, loading, isConnectedLocally, from]);

  const signAndLogin = async (currentAddr: string, stellarWallet: boolean) => {
    if (loading && status.includes('request')) return; // Prevent double trigger

    setLoading(true);
    setStatus('Generating encryption keys...');

    try {
      let signature = '';
      const message = "Sign this message to access your StellarPay UPI vault. Your signature is used as your local encryption key.";

      if (stellarWallet) {
        setStatus('Check Freighter for signature request...');
        signature = await freighterSignMessage(message);
      } else if (walletProvider) {
        setStatus('Check window for signature request...');
        const provider = new BrowserProvider(walletProvider);
        const signer = await provider.getSigner();
        signature = await signer.signMessage(message);
      } else {
        throw new Error("No wallet provider found");
      }

      setStatus('Authenticating with Stellar...');

      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      let profileData = await getProfile(currentAddr);

      if (!profileData) {
        setStatus('Creating your decentralized identity...');
        const stellarId = generateUPIFromAddress(currentAddr);
        const { publicKey, secret } = await createWallet();
        const encryptedSecret = encryptSecret(secret, signature);

        profileData = {
          uid: currentAddr,
          email: `${currentAddr.substring(0, 10)}@${stellarWallet ? 'freighter' : 'metamask'}`,
          stellarId: stellarId,
          publicKey,
          encryptedSecret,
          isFamilyOwner: true,
          displayName: currentAddr.substring(0, 6) + '...' + currentAddr.substring(currentAddr.length - 4),
          avatarSeed: currentAddr
        };

        await saveUser(profileData);
      }

      // SET STORAGE
      localStorage.setItem(stellarWallet ? 'freighter_address' : 'web3_address', currentAddr);
      localStorage.setItem('temp_vault_key', signature);

      setStatus('Vault Unlocked! Syncing profile...');

      // Explicitly trigger a refresh in the context
      refreshProfileSync(currentAddr);

      setStatus('Success! Opening vault...');

      // Navigation with a stable delay
      setTimeout(() => {
        // Determine path safely
        const targetPath = (typeof from === 'string') ? from : '/';
        console.log("Login: Final navigation to", targetPath);
        navigate(targetPath, { replace: true });
      }, 1000);

    } catch (err: any) {
      console.error("Login Error:", err);
      let errorMsg = err.message || "Connection failed";

      // Normalize error messages
      const lowerMsg = errorMsg.toLowerCase();
      if (lowerMsg.includes("user declined") ||
        lowerMsg.includes("cancelled") ||
        lowerMsg.includes("rejected") ||
        lowerMsg.includes("declined")) {
        errorMsg = "Verification cancelled";
      }

      setStatus(errorMsg);
      setLoading(false);
      // Reset local connection state to allow retry
      setIsConnectedLocally(false);
      setFreighterAddr(null);
      setIsFreighter(false);
    }
  };

  const handleSignAndLogin = () => {
    const currentAddr = isFreighter ? freighterAddr : addressLower;
    if (currentAddr) signAndLogin(currentAddr, isFreighter);
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    setStatus('Waiting for wallet choice...');
    try {
      await open();
    } catch (err: any) {
      console.error("Connect Error:", err);
      setStatus(err.message || "Failed to connect");
      setLoading(false);
    }
  };

  const handleConnectFreighter = async () => {
    setLoading(true);
    setStatus('Connecting to Freighter...');
    try {
      const pubkey = await connectFreighter();
      if (pubkey) {
        setFreighterAddr(pubkey);
        setIsFreighter(true);
        setIsConnectedLocally(true);
        // Automatically trigger signature
        await signAndLogin(pubkey, true);
      }
    } catch (err: any) {
      console.error("Freighter Error:", err);
      setStatus(err.message || "Freighter connection failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 animate-pulse">
            <Loader2 className="text-[#E5D5B3] animate-spin" size={32} />
          </div>
          <h3 className="text-xl font-black tracking-tight mb-2">Secure Vault Access</h3>
          <p className="text-[#E5D5B3] text-xs font-black uppercase tracking-widest opacity-60 animate-pulse">
            {status || 'Connecting to Stellar...'}
          </p>
          {status.includes('request') && (
            <div className="mt-8 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 animate-bounce">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Action Required in Wallet</p>
            </div>
          )}
        </div>
      )}

      {/* Rich Background Aesthetics */}
      <div className="absolute top-0 left-0 right-0 h-screen overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E5D5B3]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[40%] bg-[#E5D5B3]/5 rounded-full blur-[140px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Header Area */}
      <div className="relative z-20 pt-12 px-8 flex flex-col items-center text-center">
        <div className="space-y-2">
          <h2 className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.4em]">Stellarpay Protocol</h2>
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">
            The New Web3 UPI
          </h1>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-20 mt-auto p-8 pb-8 space-y-6">
        {isConnectedLocally ? (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
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
                  <span className="text-black text-lg font-black">Sign message to continue</span>
                )}
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleConnectFreighter}
              disabled={loading}
              className="group relative w-full h-[72px] rounded-[1.5rem] overflow-hidden transition-all active:scale-[0.98] border border-white/10"
            >
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10"></div>
              <div className="relative h-full flex items-center justify-center gap-3 px-6">
                <span className="text-white text-lg font-black tracking-tight">Login with Freighter</span>
              </div>
            </button>

            <button
              onClick={handleConnectWallet}
              disabled={loading}
              className="group relative w-full h-[72px] rounded-[1.5rem] overflow-hidden transition-all active:scale-[0.98]"
            >
              <div className="absolute inset-0 gold-gradient group-hover:brightness-110"></div>
              <div className="relative h-full flex items-center justify-center gap-3 px-6">
                <span className="text-black text-lg font-black tracking-tight">MetaMask & Others</span>
              </div>
            </button>
          </div>
        )}

        {status && !loading && (
          <div className="text-center animate-in fade-in duration-500">
            <p className="text-[#E5D5B3] text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
              {status}
            </p>
          </div>
        )}
      </div>

      <div className="relative z-20 px-4 pb-12">
        <img src={mainImage} alt="StellarPay UI" className="w-full rounded-[2rem] shadow-2xl relative z-10" />
      </div>
    </div>
  );
};

export default Login;