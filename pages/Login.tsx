
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

  // Effect to handle post-connection state only
  // This prevents the automatic signing loop in PWAs
  useEffect(() => {
    if (isConnected && address && walletProvider) {
      setIsConnectedLocally(true);
      const addressLower = address.toLowerCase();

      // If we already have the vault key in storage for this address, just enter
      if (localStorage.getItem('web3_address') === addressLower && localStorage.getItem('temp_vault_key')) {
        navigate('/');
      }
    } else {
      setIsConnectedLocally(false);
    }
  }, [isConnected, address, walletProvider, navigate]);

  const handleSignAndLogin = async () => {
    if (!address || !walletProvider) return;

    setLoading(true);
    setStatus('Signing to unlock vault...');

    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      // Use a standard message for consistent encryption key generation
      const message = "Sign this message to access your StellarPay UPI vault. Your signature is used as your local encryption key.";
      const signature = await signer.signMessage(message);

      const addressLower = address.toLowerCase();
      setStatus('Verifying...');

      // Ensure Firebase session is active
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      let profile = await getProfile(addressLower);

      if (!profile) {
        setStatus('Creating your UPI ID...');
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
      setStatus('Connecting...');
      await open();
    } catch (err: any) {
      console.error("Connect Error:", err);
      setStatus(err.message || "Failed to connect");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] flex flex-col justify-end relative overflow-hidden">
      {/* Aesthetic Background */}
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-[#E5D5B3]/10 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-[#E5D5B3]/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Logo/Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 bg-zinc-900 border border-white/5 rounded-[2rem] flex items-center justify-center text-[#E5D5B3] mb-8 shadow-2xl relative">
          <div className="absolute inset-0 bg-[#E5D5B3]/5 rounded-[2rem] blur-xl animate-pulse"></div>
          <Wallet size={48} className="relative z-10" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-3">StellarPay</h1>
        <p className="text-zinc-500 font-medium text-center max-w-[280px] leading-relaxed">
          The professional Web3 UPI. Fast, secure, and mobile-ready.
        </p>
      </div>

      {/* Bottom Actions Container */}
      <div className="relative z-10 p-6 pb-12 space-y-4">
        {isConnectedLocally ? (
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 mb-2">
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
              className="w-full h-16 gold-gradient text-black rounded-2xl font-black text-lg shadow-xl shadow-[#E5D5B3]/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin" size={24} />
                  <span>{status.includes('Verifying') ? 'Verifying...' : 'Signing...'}</span>
                </div>
              ) : (
                <>
                  <span>Unlock Vault</span>
                  <ArrowRight size={22} strokeWidth={3} />
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectWallet}
            disabled={loading}
            className="w-full h-16 bg-white text-black rounded-2xl font-black text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Wallet size={24} />
                <span>Connect Wallet</span>
                <ArrowRight size={22} />
              </>
            )}
          </button>
        )}

        {/* Footer Info */}
        <div className="pt-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">
            {loading ? status : 'Decentralized Payment Protocol'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;