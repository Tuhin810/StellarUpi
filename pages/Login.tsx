
import React, { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { saveUser, getProfile } from '../services/db';
import { createWallet } from '../services/stellar';
import { encryptSecret } from '../services/encryption';
import { connectWallet, signMessage, generateUPIFromAddress } from '../services/web3';
import { useNavigate } from 'react-router-dom';
import { Wallet, Loader2, Zap, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleMetaMaskLogin = async () => {
    setLoading(true);
    setStatus('Initializing...');

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not detected. Install extension to continue.");
      }

      setStatus('Connecting wallet...');
      const { address, signer } = await connectWallet();

      setStatus('Signing message...');
      const message = "Sign this message to access your StellarPay UPI vault. Your signature is used as your local encryption key.";
      const signature = await signMessage(signer, message);

      const addressLower = address.toLowerCase();
      setStatus('Verifying...');

      await signInAnonymously(auth);

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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] flex flex-col justify-end relative overflow-hidden">
      {/* Large watermark text in background */}

      {/* Warm gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-[#3d2f1f]/80 via-[#2a1f14]/40 to-transparent pointer-events-none"></div>
      <div className="flex items-center gap-2 mb-8 pt-44">
        <img src="https://cdn.flyonui.com/fy-assets/blocks/marketing-ui/about/about-17.png" alt="" />
      </div>
      <div className="pl-5 ">
        <span className="text-2xl font-semibold text-zinc-600 tracking-tight">stellarpay</span>
        <div className="text-white text-5xl w-[70%] font-bold">The New Web3 Upi</div>
      </div>
      {/* Content container */}
      <div className="relative z-10 flex-1 flex flex-col justify-end p-6 pb-10">
        {/* Floating decorative element - bottom right */}



        {/* CTA Button */}
        <button
          onClick={handleMetaMaskLogin}
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
              <span>Connect MetaMask</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Login;
