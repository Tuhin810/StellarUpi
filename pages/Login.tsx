
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
  useEffect(() => {
    if (isConnected && address && walletProvider) {
      setIsConnectedLocally(true);
      const addressLower = address.toLowerCase();

      // If we already have the vault key in storage, just go home
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

      const message = "Sign this message to access your StellarPay UPI vault. Your signature is used as your local encryption key.";
      const signature = await signer.signMessage(message);

      const addressLower = address.toLowerCase();
      setStatus('Verifying...');

      await signInAnonymously(auth);

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
          isFamilyOwner: true
        };

        await saveUser(profile);
      }

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
      {/* Warm gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-[#3d2f1f]/80 via-[#2a1f14]/40 to-transparent pointer-events-none"></div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 bg-[#E5D5B3]/10 rounded-3xl flex items-center justify-center text-[#E5D5B3] mb-8 border border-[#E5D5B3]/20 animate-pulse">
          <Wallet size={48} />
        </div>
        <h1 className="text-4xl font-black text-white text-center mb-2 tracking-tight">StellarPay</h1>
        <p className="text-zinc-500 text-center font-medium max-w-[280px]">The professional way to send money on the blockchain.</p>
      </div>

      {/* Content container */}
      <div className="relative z-10 p-6 pb-12 space-y-4">

        {isConnectedLocally ? (
          <button
            onClick={handleSignAndLogin}
            disabled={loading}
            className="w-full py-5 bg-white text-black rounded-2xl font-black text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={22} />
                <span>{status}</span>
              </>
            ) : (
              <>
                <ShieldCheck size={22} />
                <span>Unlock Vault</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleConnectWallet}
            disabled={loading}
            className="w-full py-5 bg-[#E5D5B3] text-black rounded-2xl font-black text-lg shadow-xl shadow-[#E5D5B3]/20 hover:bg-[#d4c4a2] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-3"
          >
            <Wallet size={22} />
            <span>Connect Wallet</span>
            <ArrowRight size={20} />
          </button>
        )}

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
            <span className="bg-[#0a0f0a] px-4">Secure & Decentralized</span>
          </div>
        </div>

        {/* Placeholder for future Google Login */}
        <p className="text-center text-zinc-600 text-xs mt-4">
          By connecting, you agree to the Terms of Service.
        </p>
      </div>
    </div>
  );
};

export default Login;