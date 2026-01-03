
import React, { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { saveUser, getProfile } from '../services/db';
import { createWallet } from '../services/stellar';
import { encryptSecret } from '../services/encryption';
import { connectWallet, signMessage, generateUPIFromAddress } from '../services/web3';
import { useNavigate } from 'react-router-dom';
import { Wallet, ShieldCheck, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleMetaMaskLogin = async () => {
    setLoading(true);
    setStatus('Ready to connect...');

    try {
      // 0. Preliminary Check
      if (!window.ethereum) {
        throw new Error("MetaMask (window.ethereum) not detected. Please install the MetaMask extension and refresh.");
      }

      // 1. Connect Wallet
      setStatus('Connecting to MetaMask...');
      console.log("Attempting to connect wallet...");
      const { address, signer } = await connectWallet();
      console.log("Connected address:", address);

      // 2. Sign message to create/access vault
      setStatus('Sign the message to unlock your vault...');
      const message = "Sign this message to access your StellarPay UPI vault. Your signature is used as your local encryption key.";
      const signature = await signMessage(signer, message);
      console.log("Signature obtained");

      // 3. Connect/Login
      const addressLower = address.toLowerCase();
      setStatus('Verifying account...');

      // We still sign in anonymously for Firebase Rules context
      await signInAnonymously(auth);

      // 4. Check if profile exists for this address
      let profile = await getProfile(addressLower);

      if (!profile) {
        setStatus('Creating your unique UPI ID...');
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

      // Store address and signature for the session
      localStorage.setItem('web3_address', addressLower);
      sessionStorage.setItem('temp_vault_key', signature);

      // Force reload to let App.tsx pick up the new profile
      window.location.href = '/';
    } catch (err: any) {
      console.error("MetaMask Login Error:", err);
      let errorMsg = err.message || "Failed to connect MetaMask";

      if (err.code === 4001) {
        errorMsg = "Connection request was rejected. Please sign in to MetaMask.";
      } else if (err.message?.includes('CSP') || err.message?.includes('eval')) {
        errorMsg = "Security policy (CSP) blocked the connection. Try disabling strict browser protections for this site.";
      }

      setStatus(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 py-12 bg-white">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-50 text-orange-500 rounded-3xl mb-8 shadow-sm">
          <Wallet size={48} />
        </div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-3">StellarPay <span className="text-indigo-600">UPI</span></h2>
        <p className="text-gray-500 font-medium text-lg">Border-less payments via MetaMask</p>
      </div>

      <div className="space-y-6">
        <button
          onClick={handleMetaMaskLogin}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              <span>{status || 'Processing...'}</span>
            </>
          ) : (
            <>
              <Wallet size={24} />
              <span>Login with MetaMask</span>
            </>
          )}
        </button>

        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-100 p-2 rounded-xl mt-1">
              <ShieldCheck className="text-indigo-600" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Secure & Non-Custodial</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your MetaMask signature encrypts your Stellar keys. We never have access to your funds.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-400 text-sm font-medium">
          Supported by Stellar & Ethereum Networks
        </p>
      </div>
    </div>
  );
};

export default Login;
