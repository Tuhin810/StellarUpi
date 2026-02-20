import React, { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { saveUser, getProfile } from '../services/db';
import { createWallet } from '../services/stellar';
import { encryptSecret } from '../services/encryption';
import { useWeb3Modal, useWeb3ModalProvider, useWeb3ModalAccount, generateUPIFromAddress } from '../services/web3';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { BrowserProvider } from 'ethers';

import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { refreshProfileSync } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnectedLocally, setIsConnectedLocally] = useState(false);
  const from = location.state?.from || '/';

  const { open } = useWeb3Modal();
  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected } = useWeb3ModalAccount();
  const addressLower = address?.toLowerCase();

  useEffect(() => {
    if (isConnected && addressLower && walletProvider) {
      setIsConnectedLocally(true);
      const storedAddr = localStorage.getItem('web3_address');
      const storedKey = localStorage.getItem('temp_vault_key');
      if (storedAddr === addressLower && storedKey) {
        navigate(from);
      }
    } else {
      setIsConnectedLocally(false);
    }
  }, [isConnected, addressLower, walletProvider, navigate, from]);

  const handleSignAndLogin = async () => {
    if (!addressLower || !walletProvider) return;
    setLoading(true);
    setStatus('Verifying Identity...');

    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const message = "Sign this message to access your Ching Pay UPI vault. Your signature is used as your local encryption key.";
      const signature = await signer.signMessage(message);

      if (!auth.currentUser) await signInAnonymously(auth);

      let profile = await getProfile(addressLower);
      if (!profile) {
        setStatus('Initializing Vault...');
        const stellarId = generateUPIFromAddress(addressLower);
        const { publicKey, secret } = await createWallet();
        const encryptedSecret = encryptSecret(secret, signature);

        profile = {
          uid: addressLower,
          email: `${addressLower.substring(0, 10)}@metamask`,
          stellarId,
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
      refreshProfileSync(addressLower);
      setStatus('Vault Unlocked');
      setTimeout(() => navigate(from), 800);
    } catch (err: any) {
      setStatus(err.message || "Connection failed");
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      await open();
    } catch (err: any) {
      setStatus(err.message || "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">

      {/* === FULL SCREEN BACKGROUND === */}
      <div className="absolute inset-0 z-0">
        {/* Warm ambient glow */}
        <div className="absolute top-[8%] right-[0%] w-[70%] h-[45%] rounded-full blur-[120px]" style={{ background: 'rgba(139, 106, 62, 0.15)' }}></div>
        <div className="absolute top-[20%] left-[5%] w-[40%] h-[30%] rounded-full blur-[100px]" style={{ background: 'rgba(139, 106, 62, 0.08)' }}></div>

        {/* Dark gradient from bottom — rendered BEFORE lines so lines sit on top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>

        {/* Geometric Lines — on top of everything */}
        <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice">
          <line x1="20" y1="0" x2="380" y2="650" stroke="rgba(229,213,179,0.15)" strokeWidth="0.8" />
          <line x1="160" y1="0" x2="400" y2="480" stroke="rgba(229,213,179,0.12)" strokeWidth="0.7" />
          <line x1="0" y1="120" x2="400" y2="300" stroke="rgba(229,213,179,0.10)" strokeWidth="0.7" />
          <line x1="370" y1="0" x2="40" y2="580" stroke="rgba(229,213,179,0.13)" strokeWidth="0.7" />
          <line x1="0" y1="30" x2="280" y2="900" stroke="rgba(229,213,179,0.08)" strokeWidth="0.6" />
          <line x1="280" y1="0" x2="0" y2="450" stroke="rgba(229,213,179,0.09)" strokeWidth="0.6" />
        </svg>
      </div>

      {/* === BOTTOM CONTENT === */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-8 pb-14">

        {/* Logo Icon */}
        <div className="mb-6">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 4L38 14V30L22 40L6 30V14L22 4Z" stroke="white" strokeWidth="2.5" fill="none" />
            <path d="M14 18L22 13L30 18V28L22 33L14 28V18Z" fill="white" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-[32px] font-extrabold leading-[1.15] tracking-tight mb-10">
          <span className="text-[#E5D5B3]">Ching Pay</span> – Web3 UPI
          {'\u00A0'}for Seamless Digital Payments
        </h1>

        {/* Primary Button */}
        <button
          onClick={isConnectedLocally ? handleSignAndLogin : handleConnectWallet}
          disabled={loading}
          className="w-full h-[60px] rounded-full font-bold text-[16px] text-black relative overflow-hidden active:scale-[0.97] transition-transform mb-4 disabled:opacity-60"
          style={{
            background: 'linear-gradient(90deg, #D4874D 0%, #E5C36B 50%, #F0D98A 100%)',
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">{status || 'Loading...'}</span>
            </div>
          ) : (
            <span>{isConnectedLocally ? 'Sign in' : 'Sign up'}</span>
          )}
        </button>

        {/* Secondary Button */}
        <button
          onClick={isConnectedLocally ? handleConnectWallet : handleSignAndLogin}
          disabled={loading || (!isConnectedLocally)}
          className="w-full h-[60px] rounded-full font-bold text-[16px] text-white/80 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.97] transition-all disabled:opacity-40"
        >
          I have an account
        </button>
      </div>
    </div>
  );
};

export default Login;