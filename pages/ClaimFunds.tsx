
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Gift, Wallet, CheckCircle2, Loader2, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { claimViralPayment } from '../services/claimableBalanceService';
import { recordTransaction } from '../services/db';
import { Keypair } from '@stellar/stellar-sdk';
import { decryptSecret } from '../services/encryption';
import { KYCService } from '../services/kycService';

const ClaimFunds: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, profile } = useAuth();

    const cbId = searchParams.get('id');
    const tempSk = searchParams.get('sk');
    const amount = searchParams.get('amount') || '0';

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClaim = async () => {
        if (!isAuthenticated || !profile || !cbId || !tempSk) return;

        setLoading(true);
        setError(null);

        try {
            const password = KYCService.deriveEncryptionKey(localStorage.getItem('ching_phone') || '', profile.pin || '0000');
            if (!password) throw new Error("Vault locked. Please login again.");

            const userSecret = decryptSecret(profile.encryptedSecret, password);
            const userKeypair = Keypair.fromSecret(userSecret);

            const transaction = await claimViralPayment(cbId, tempSk, profile.publicKey);

            // Sign with user keypair because they are the fee payer (source account)
            transaction.sign(userKeypair);

            // Submit
            const serverUrl = 'https://horizon.stellar.org'; // Default
            // In a real app we'd use the getServer() helper, but here we'll just use fetch/sdk
            const networkPassphrase = 'Public Global Stellar Network ; September 2015'; // Hardcoded for simplicity or get from context

            const response = await fetch(`${serverUrl}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `tx=${encodeURIComponent(transaction.toXDR())}`
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || "Claim failed. It might have already been claimed.");
            }

            // Record transaction
            await recordTransaction({
                fromId: 'EXTERNAL',
                toId: profile.stellarId,
                fromName: 'Viral Link',
                toName: profile.displayName || profile.stellarId,
                amount: parseFloat(amount),
                currency: 'XLM',
                status: 'SUCCESS',
                memo: 'Claimed via Link',
                txHash: result.hash,
                isFamilySpend: false
            });

            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to claim funds");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white flex flex-col items-center justify-center px-6 text-center">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle2 size={48} className="text-emerald-400" />
                </div>
                <h1 className="text-3xl font-black mb-2 tracking-tight">Funds Claimed!</h1>
                <p className="text-zinc-400 mb-10 max-w-xs">₹{(parseFloat(amount) * 15).toLocaleString()} has been added to your Main Vault successfully.</p>
                <button
                    onClick={() => navigate('/')}
                    className="w-full max-w-xs py-5 gold-gradient text-black font-black rounded-2xl shadow-2xl active:scale-95 transition-all"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white flex flex-col items-center pt-20 px-6">
            <div className="w-20 h-20 bg-[#E5D5B3]/10 rounded-3xl flex items-center justify-center text-[#E5D5B3] mb-8 border border-[#E5D5B3]/20 shadow-[0_0_30px_rgba(229,213,179,0.1)]">
                <Gift size={40} />
            </div>

            <h1 className="text-3xl font-black mb-2 tracking-tight">You've Got Funds!</h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-12">Viral Onboarding via Stellar</p>

            <div className="w-full max-w-sm bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 mb-10 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E5D5B3]/5 to-transparent opacity-50" />

                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Amount Waiting</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                    <h2 className="text-5xl font-black text-[#E5D5B3]">{amount}</h2>
                    <span className="text-zinc-600 font-bold self-end mb-2">XLM</span>
                </div>
                <p className="text-emerald-400/60 font-black text-xs uppercase tracking-widest relative z-10">
                    ≈ ₹{(parseFloat(amount) * 15).toLocaleString()} INR
                </p>
            </div>

            {error && (
                <div className="w-full max-w-sm p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 mb-8">
                    <AlertCircle size={18} />
                    <p className="text-xs font-bold leading-tight">{error}</p>
                </div>
            )}

            {!isAuthenticated ? (
                <div className="w-full max-w-sm space-y-4">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center mb-6">
                        <Shield className="mx-auto mb-3 text-zinc-500" size={24} />
                        <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                            To claim these funds, you need to create a secure Stellar wallet on Ching Pay.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/login', { state: { from: window.location.hash.replace('#', '') } })}
                        className="w-full py-5 gold-gradient text-black font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <span>Create Wallet to Claim</span>
                        <ArrowRight size={20} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleClaim}
                    disabled={loading || !cbId || !tempSk}
                    className="w-full max-w-sm py-5 gold-gradient text-black font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all"
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            <span className="text-sm uppercase tracking-widest font-black">Claiming Funds...</span>
                        </>
                    ) : (
                        <>
                            <span>Add to Main Vault</span>
                            <Wallet size={20} />
                        </>
                    )}
                </button>
            )}

            <p className="mt-12 text-zinc-700 text-[10px] font-black uppercase tracking-[0.2em] max-w-[240px] text-center leading-loose">
                Funds are secured by <span className="text-zinc-500">Stellar Claimable Balances</span> until they are moved into your vault.
            </p>
        </div>
    );
};

export default ClaimFunds;
