
import React, { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { saveUser, getProfile } from '../services/db';
import { createWallet } from '../services/stellar';
import { encryptSecret } from '../services/encryption';
import { useWeb3Modal, useWeb3ModalProvider, useWeb3ModalAccount, generateUPIFromAddress } from '../services/web3';
import { useNavigate } from 'react-router-dom';
import { Wallet, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { BrowserProvider } from 'ethers';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const [isConnectedLocally, setIsConnectedLocally] = useState(false);

  // Web3Modal hooks
  const { open } = useWeb3Modal();
  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected } = useWeb3ModalAccount();

  const addressLower = address?.toLowerCase();

  // Effect to handle post-connection state only
  // This prevents the automatic signing loop in PWAs
  useEffect(() => {
    if (isConnected && addressLower && walletProvider) {
      setIsConnectedLocally(true);

      // If we already have the vault key in storage for this address, just enter
      if (localStorage.getItem('web3_address') === addressLower && localStorage.getItem('temp_vault_key')) {
        navigate('/');
      }
    } else {
      setIsConnectedLocally(false);
    }
  }, [isConnected, addressLower, walletProvider, navigate]);

  const handleSignAndLogin = async () => {
    if (!addressLower || !walletProvider) return;

    setLoading(true);
    setStatus('Signing message...');

    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      const message = "Sign this message to access your StellarPay UPI vault. Your signature is used as your local encryption key.";
      const signature = await signer.signMessage(message);

      setStatus('Verifying...');

      // Ensure Firebase session is active
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      let profile = await getProfile(addressLower);

      if (!profile) {
        setStatus('Creating vault...');
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

      // Persist session
      localStorage.setItem('web3_address', addressLower);
      localStorage.setItem('temp_vault_key', signature);

      navigate('/');
    } catch (err: any) {
      console.error("Login Error:", err);
      let errorMsg = err.message || "Connection failed";
      if (err.code === 4001) errorMsg = "Request rejected";
      setStatus(errorMsg);
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setStatus('Waiting for wallet...');
      await open();
    } catch (err: any) {
      console.error("Connect Error:", err);
      setStatus(err.message || "Failed to connect");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] flex flex-col justify-end relative overflow-hidden">
      {/* Warm gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-[#3d2f1f]/80 via-[#2a1f14]/40 to-transparent pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-8 pt-44 pl-6 relative z-10">
        <img src="https://cdn.flyonui.com/fy-assets/blocks/marketing-ui/about/about-17.png" alt="Logo" className="w-12 h-12 object-contain" />
      </div>

      <div className="pl-6 mb-12 relative z-10">
        <span className="text-2xl font-semibold text-zinc-600 tracking-tight">stellarpay</span>
        <div className="text-white text-5xl w-[70%] font-bold leading-tight">The New Web3 UPI</div>
      </div>

      {/* Content container */}
      <div className="relative z-10 p-6 pb-12 space-y-4">
        {isConnectedLocally ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Connected Address Indicator */}
            <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldCheck size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Wallet Connected</p>
                <p className="text-white text-xs font-mono truncate">{address}</p>
              </div>
            </div>

            <button
              onClick={handleSignAndLogin}
              disabled={loading}
              className="w-full py-5 bg-white text-black rounded-2xl font-black text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>{status}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  <span>Unlock Vault</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectWallet}
            disabled={loading}
            className="w-full py-5 bg-[#E5D5B3] text-black rounded-2xl font-semibold text-base shadow-xl shadow-[#E5D5B3]/20 hover:bg-[#d4c4a2] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>{status}</span>
              </>
            ) : (
              <>
                <Wallet size={20} />
                <span>Connect Wallet</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        )}

        <p className="text-center text-zinc-600 text-xs mt-4">
          Secure & Decentralized Payments
        </p>
      </div>
    </div>
  );
};

export default Login;