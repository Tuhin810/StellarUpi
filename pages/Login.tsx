import React, { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { saveUser, getProfile } from '../services/db';
import { createWallet } from '../services/stellar';
import { encryptSecret } from '../services/encryption';
import { useWeb3Modal, useWeb3ModalProvider, useWeb3ModalAccount, generateUPIFromAddress } from '../services/web3';
import { useNavigate, useLocation } from 'react-router-dom';
import { BrowserProvider } from 'ethers';
import { ShieldCheck, Mail, Phone, Lock, ChevronRight, X, Loader2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

import { VerificationService } from '../services/verificationService';

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

  // Verification States
  const [onboardingStep, setOnboardingStep] = useState<'none' | 'input' | 'otp'>('none');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [tempSignature, setTempSignature] = useState('');

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
      setTempSignature(signature);

      if (!auth.currentUser) await signInAnonymously(auth);

      let profile = await getProfile(addressLower);

      if (!profile) {
        setOnboardingStep('input');
        setLoading(false);
        return;
      }

      if (profile && !profile.isVerified) {
        setPhoneInput(profile.phoneNumber || '');
        setOnboardingStep('input');
        setLoading(false);
        return;
      }

      finalizeLogin(profile, signature);
    } catch (err: any) {
      setStatus(err.message || "Connection failed");
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phoneInput) {
      setStatus('Enter phone number');
      return;
    }

    setLoading(true);
    setStatus('Sending SMS OTP...');
    try {
      const success = await VerificationService.sendOTP(phoneInput);
      if (success) {
        setOnboardingStep('otp');
        setStatus('');

        // Auto-fill OTP for easier testing/login if returned by API
        const savedOtp = sessionStorage.getItem('last_otp');
        if (savedOtp) {
          setOtpInput(savedOtp);
          setStatus('OTP auto-filled for your convenience');
        }
      } else {
        setStatus('Failed to send SMS code.');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('Server error. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput) return;
    setLoading(true);
    setStatus('Verifying Code...');
    try {
      const success = await VerificationService.verifyOTP(phoneInput, otpInput);

      if (!success) {
        setStatus("Invalid verification code");
        setLoading(false);
        return;
      }

      setStatus('Initializing Vault...');
      const stellarId = generateUPIFromAddress(addressLower!);
      const { publicKey, secret } = await createWallet();
      const encryptedSecret = encryptSecret(secret, tempSignature);

      const profile = {
        uid: addressLower!,
        email: emailInput || `${addressLower!.substring(2, 8)}@ching.pay`,
        phoneNumber: phoneInput,
        isVerified: true,
        stellarId,
        publicKey,
        encryptedSecret,
        isFamilyOwner: true,
        displayName: addressLower!.substring(0, 6) + '...' + addressLower!.substring(38),
        avatarSeed: addressLower!
      };

      await saveUser(profile);
      finalizeLogin(profile, tempSignature);
    } catch (err: any) {
      setStatus("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const finalizeLogin = (profile: any, signature: string) => {
    localStorage.setItem('web3_address', addressLower!);
    localStorage.setItem('temp_vault_key', signature);
    refreshProfileSync(addressLower!);
    setStatus('Vault Unlocked');
    setTimeout(() => navigate(from), 800);
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
        <div className="absolute top-[8%] right-[0%] w-[70%] h-[45%] rounded-full blur-[120px]" style={{ background: 'rgba(139, 106, 62, 0.15)' }}></div>
        <div className="absolute top-[20%] left-[5%] w-[40%] h-[30%] rounded-full blur-[100px]" style={{ background: 'rgba(139, 106, 62, 0.08)' }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
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
        <div className="mb-6">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 4L38 14V30L22 40L6 30V14L22 4Z" stroke="white" strokeWidth="2.5" fill="none" />
            <path d="M14 18L22 13L30 18V28L22 33L14 28V18Z" fill="white" />
          </svg>
        </div>
        <h1 className="text-[32px] font-extrabold leading-[1.15] tracking-tight mb-10">
          <span className="text-[#E5D5B3]">Ching Pay</span> – Web3 UPI
          {'\u00A0'}for Seamless Digital Payments
        </h1>

        <button
          onClick={isConnectedLocally ? handleSignAndLogin : handleConnectWallet}
          disabled={loading}
          className="w-full h-[60px] rounded-full font-bold text-[16px] text-black relative overflow-hidden active:scale-[0.97] transition-transform mb-4 disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg, #D4874D 0%, #E5C36B 50%, #F0D98A 100%)' }}
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

        <button
          onClick={isConnectedLocally ? handleConnectWallet : handleSignAndLogin}
          disabled={loading || (!isConnectedLocally)}
          className="w-full h-[60px] rounded-full font-bold text-[16px] text-white/80 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.97] transition-all disabled:opacity-40"
        >
          I have an account
        </button>
      </div>

      {/* === VERIFICATION OVERLAY === */}
      {onboardingStep !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-900/90 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-[#E5C36B]/10 rounded-full blur-[80px]" />
            <button onClick={() => { setOnboardingStep('none'); setLoading(false); }} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#E5D5B3]/10 rounded-2xl flex items-center justify-center text-[#E5D5B3] mb-6 border border-[#E5D5B3]/20">
                {onboardingStep === 'input' ? <Phone size={32} /> : <Lock size={32} />}
              </div>
              <h2 className="text-2xl font-black mb-2">{onboardingStep === 'input' ? 'Verify Phone' : 'Verify SMS'}</h2>
              <p className="text-zinc-500 text-sm mb-8">
                {onboardingStep === 'input' ? 'Enter your mobile number to receive a free verification code via SMS.' : `Enter the 6-digit code sent to ${phoneInput}`}
              </p>

              {onboardingStep === 'input' ? (
                <div className="w-full space-y-4 mb-8">
                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#E5D5B3] transition-colors" size={18} />
                    <input
                      type="tel"
                      placeholder="e.g. 98765 43210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-5 pl-14 pr-6 font-bold text-sm outline-none focus:border-[#E5D5B3]/20 transition-all font-mono"
                    />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#E5D5B3] transition-colors" size={18} />
                    <input
                      type="email"
                      placeholder="Email (Optional)"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-5 pl-14 pr-6 font-bold text-sm outline-none focus:border-[#E5D5B3]/20 transition-all opacity-60"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full mb-8 text-center flex flex-col items-center">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="- - - - - -"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full max-w-[200px] bg-zinc-950 border border-white/5 rounded-2xl py-6 px-4 font-black text-2xl tracking-[0.4em] text-center outline-none focus:border-[#E5D5B3]/20 transition-all text-[#E5D5B3]"
                  />
                  {status && <p className="mt-4 text-[10px] text-rose-500 font-bold uppercase tracking-widest">{status}</p>}
                </div>
              )}

              <button
                onClick={onboardingStep === 'input' ? handleSendOTP : handleVerifyOTP}
                disabled={loading}
                className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg text-black"
                style={{ background: 'linear-gradient(90deg, #D4874D 0%, #E5C36B 50%, #F0D98A 100%)' }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>{onboardingStep === 'input' ? 'Send OTP' : 'Unlock Vault'} <ChevronRight size={18} strokeWidth={3} /></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;