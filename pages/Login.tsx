
import React, { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { saveUser, getProfile } from '../services/db';
import { createWallet } from '../services/stellar';
import { encryptSecret } from '../services/encryption';
import { generateStellarId } from '../services/web3';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Phone, Lock, ChevronRight, Loader2, CreditCard, User, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { VerificationService } from '../services/verificationService';
import { KYCService } from '../services/kycService';

type Step = 'welcome' | 'phone' | 'otp' | 'kyc';

const Login: React.FC = () => {
  const { refreshProfileSync } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // Phone + OTP
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');

  // KYC
  const [panInput, setPanInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // ─── STEP HANDLERS ───

  const handleSendOTP = async () => {
    const cleaned = phoneInput.replace(/[\s\-\+]/g, '');
    if (cleaned.length < 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Sending OTP...');

    try {
      const success = await VerificationService.sendOTP(cleaned);
      if (success) {
        setStep('otp');
        setStatus('');
        // Auto-fill OTP if returned by server
        const savedOtp = sessionStorage.getItem('last_otp');
        if (savedOtp) {
          setOtpInput(savedOtp);
        }
      } else {
        setError('Failed to send OTP. Try again.');
      }
    } catch (err: any) {
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length < 4) {
      setError('Enter the complete OTP');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Verifying...');

    try {
      const phone = phoneInput.replace(/[\s\-\+]/g, '');
      const success = await VerificationService.verifyOTP(phone, otpInput);

      if (!success) {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
        setStatus('');
        return;
      }

      // Check if user already exists
      if (!auth.currentUser) await signInAnonymously(auth);

      const existingProfile = await getProfile(phone);

      if (existingProfile && existingProfile.isVerified) {
        // Existing user — login directly
        finalizeLogin(phone);
      } else {
        // New user — go to KYC
        setStep('kyc');
        setStatus('');
        setLoading(false);
      }
    } catch (err: any) {
      setError('Verification failed. Try again.');
      setLoading(false);
      setStatus('');
    }
  };

  const handleKYC = async () => {
    setError('');

    // Validate PAN
    const kycResult = KYCService.verifyPAN(panInput, nameInput);
    if (!kycResult.valid) {
      setError(kycResult.error || 'Invalid PAN card');
      return;
    }

    setLoading(true);
    setStatus('Creating your wallet...');

    try {
      const phone = phoneInput.replace(/[\s\-\+]/g, '');

      if (!auth.currentUser) await signInAnonymously(auth);

      // Generate Stellar wallet
      const { publicKey, secret } = await createWallet();

      // Derive encryption key from phone + default PIN
      const encryptionKey = KYCService.deriveEncryptionKey(phone, '0000');
      const encryptedSecret = encryptSecret(secret, encryptionKey);

      // Generate Stellar ID from phone
      const stellarId = generateStellarId(phone);

      setStatus('Setting up your account...');

      // Build profile
      const profile: UserProfile = {
        uid: phone,
        email: `${phone}@ching.pay`,
        phoneNumber: phone,
        isVerified: true,
        stellarId,
        publicKey,
        encryptedSecret,
        isFamilyOwner: true,
        displayName: nameInput.split(' ')[0], // First name
        fullName: nameInput,
        avatarSeed: phone,
        createdAt: new Date().toISOString(),
        currentStreak: 0,
        streakLevel: 'orange',
        panHash: kycResult.panHash,
        kycVerified: true,
        kycVerifiedAt: kycResult.verifiedAt,
      };

      await saveUser(profile);

      setStatus('Almost there...');
      finalizeLogin(phone);
    } catch (err: any) {
      console.error('KYC/Wallet creation failed:', err);
      setError(err.message || 'Account creation failed. Please try again.');
      setLoading(false);
      setStatus('');
    }
  };

  const finalizeLogin = (phone: string) => {
    localStorage.setItem('ching_phone', phone);
    refreshProfileSync(phone);
    setStatus('Welcome to Ching Pay!');
    setTimeout(() => navigate(from), 600);
  };

  // ─── RENDER ───

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[8%] right-[0%] w-[70%] h-[45%] rounded-full blur-[120px]" style={{ background: 'rgba(139, 106, 62, 0.15)' }} />
        <div className="absolute top-[20%] left-[5%] w-[40%] h-[30%] rounded-full blur-[100px]" style={{ background: 'rgba(139, 106, 62, 0.08)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice">
          <line x1="20" y1="0" x2="380" y2="650" stroke="rgba(229,213,179,0.15)" strokeWidth="0.8" />
          <line x1="160" y1="0" x2="400" y2="480" stroke="rgba(229,213,179,0.12)" strokeWidth="0.7" />
          <line x1="0" y1="120" x2="400" y2="300" stroke="rgba(229,213,179,0.10)" strokeWidth="0.7" />
          <line x1="370" y1="0" x2="40" y2="580" stroke="rgba(229,213,179,0.13)" strokeWidth="0.7" />
          <line x1="0" y1="30" x2="280" y2="900" stroke="rgba(229,213,179,0.08)" strokeWidth="0.6" />
          <line x1="280" y1="0" x2="0" y2="450" stroke="rgba(229,213,179,0.09)" strokeWidth="0.6" />
        </svg>
      </div>

      {/* ═══ WELCOME STEP ═══ */}
      {step === 'welcome' && (
        <div className="relative z-10 flex-1 flex flex-col justify-end px-8 pb-14">
          <div className="mb-6">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 4L38 14V30L22 40L6 30V14L22 4Z" stroke="white" strokeWidth="2.5" fill="none" />
              <path d="M14 18L22 13L30 18V28L22 33L14 28V18Z" fill="white" />
            </svg>
          </div>
          <h1 className="text-[32px] font-extrabold leading-[1.15] tracking-tight mb-10">
            <span className="text-[#E5D5B3]">Ching Pay</span> – UPI
            {'\u00A0'}for Seamless Digital Payments
          </h1>

          <button
            onClick={() => setStep('phone')}
            className="w-full h-[60px] rounded-full font-bold text-[16px] text-black relative overflow-hidden active:scale-[0.97] transition-transform mb-4"
            style={{ background: 'linear-gradient(90deg, #D4874D 0%, #E5C36B 50%, #F0D98A 100%)' }}
          >
            Let's Start
          </button>

          <p className="text-center text-zinc-700 text-[10px] mt-4 uppercase tracking-widest font-bold">
            Built on Stellar Protocol
          </p>
        </div>
      )}

      {/* ═══ PHONE STEP ═══ */}
      {step === 'phone' && (
        <div className="relative z-10 flex-1 flex flex-col px-8 pt-14">
          <button onClick={() => setStep('welcome')} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-zinc-400 mb-10">
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 flex flex-col">
            <div className="w-16 h-16 bg-[#E5D5B3]/10 rounded-2xl flex items-center justify-center text-[#E5D5B3] mb-6 border border-[#E5D5B3]/20">
              <Phone size={28} />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Enter your phone</h2>
            <p className="text-zinc-500 text-sm mb-10">We'll send a verification code via SMS</p>

            <div className="relative group mb-6">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#E5D5B3] transition-colors" size={18} />
              <input
                type="tel"
                placeholder="e.g. 98765 43210"
                value={phoneInput}
                onChange={(e) => { setPhoneInput(e.target.value); setError(''); }}
                className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-5 pl-14 pr-6 font-bold text-sm outline-none focus:border-[#E5D5B3]/20 transition-all font-mono"
                autoFocus
              />
            </div>

            {error && <p className="text-rose-400 text-xs font-bold mb-4 uppercase tracking-wider">{error}</p>}
          </div>

          <div className="pb-14">
            <button
              onClick={handleSendOTP}
              disabled={loading || phoneInput.replace(/\D/g, '').length < 10}
              className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg text-black disabled:opacity-40"
              style={{ background: 'linear-gradient(90deg, #D4874D 0%, #E5C36B 50%, #F0D98A 100%)' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Send OTP <ChevronRight size={18} strokeWidth={3} /></>}
            </button>
          </div>
        </div>
      )}

      {/* ═══ OTP STEP ═══ */}
      {step === 'otp' && (
        <div className="relative z-10 flex-1 flex flex-col px-8 pt-14">
          <button onClick={() => { setStep('phone'); setOtpInput(''); setError(''); }} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-zinc-400 mb-10">
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 flex flex-col">
            <div className="w-16 h-16 bg-[#E5D5B3]/10 rounded-2xl flex items-center justify-center text-[#E5D5B3] mb-6 border border-[#E5D5B3]/20">
              <Lock size={28} />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Verify SMS Code</h2>
            <p className="text-zinc-500 text-sm mb-10">Enter the 6-digit code sent to <span className="text-[#E5D5B3]">{phoneInput}</span></p>

            <div className="flex justify-center mb-6">
              <input
                type="text"
                maxLength={6}
                placeholder="- - - - - -"
                value={otpInput}
                onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, '')); setError(''); }}
                className="w-full max-w-[240px] bg-zinc-950 border border-white/5 rounded-2xl py-6 px-4 font-black text-2xl tracking-[0.4em] text-center outline-none focus:border-[#E5D5B3]/20 transition-all text-[#E5D5B3]"
                autoFocus
              />
            </div>

            {error && <p className="text-rose-400 text-xs font-bold mb-4 uppercase tracking-wider text-center">{error}</p>}
            {status && <p className="text-[#E5D5B3] text-xs font-bold mb-4 uppercase tracking-wider text-center">{status}</p>}
          </div>

          <div className="pb-14">
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otpInput.length < 4}
              className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg text-black disabled:opacity-40"
              style={{ background: 'linear-gradient(90deg, #D4874D 0%, #E5C36B 50%, #F0D98A 100%)' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Verify <ChevronRight size={18} strokeWidth={3} /></>}
            </button>

            <button onClick={handleSendOTP} disabled={loading} className="w-full mt-4 py-3 text-zinc-600 text-xs font-bold uppercase tracking-widest">
              Resend Code
            </button>
          </div>
        </div>
      )}

      {/* ═══ KYC STEP ═══ */}
      {step === 'kyc' && (
        <div className="relative z-10 flex-1 flex flex-col px-8 pt-14">
          <button onClick={() => { setStep('otp'); setError(''); }} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-zinc-400 mb-10">
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 flex flex-col">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Verify Identity</h2>
            <p className="text-zinc-500 text-sm mb-8">Complete KYC with your PAN card to activate your wallet</p>

            <div className="space-y-4 mb-6">
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#E5D5B3] transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Full Name (as on PAN)"
                  value={nameInput}
                  onChange={(e) => { setNameInput(e.target.value); setError(''); }}
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-5 pl-14 pr-6 font-bold text-sm outline-none focus:border-[#E5D5B3]/20 transition-all capitalize"
                  autoFocus
                />
              </div>

              <div className="relative group">
                <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#E5D5B3] transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="PAN Number (e.g. ABCPD1234E)"
                  value={panInput}
                  maxLength={10}
                  onChange={(e) => { setPanInput(e.target.value.toUpperCase()); setError(''); }}
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-5 pl-14 pr-6 font-bold text-sm outline-none focus:border-[#E5D5B3]/20 transition-all font-mono uppercase tracking-wider"
                />
              </div>
            </div>

            {error && <p className="text-rose-400 text-xs font-bold mb-4 uppercase tracking-wider">{error}</p>}
            {status && <p className="text-[#E5D5B3] text-xs font-bold mb-4 uppercase tracking-wider">{status}</p>}

            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <ShieldCheck size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Your PAN is verified locally and only a cryptographic hash is stored. We never save your raw PAN number.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pb-14">
            <button
              onClick={handleKYC}
              disabled={loading || !panInput || !nameInput}
              className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg text-black disabled:opacity-40"
              style={{ background: 'linear-gradient(90deg, #D4874D 0%, #E5C36B 50%, #F0D98A 100%)' }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm normal-case font-bold tracking-normal">{status || 'Processing...'}</span>
                </div>
              ) : (
                <>Create Wallet <ChevronRight size={18} strokeWidth={3} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;