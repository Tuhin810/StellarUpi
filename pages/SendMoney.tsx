
import React, { useState, useEffect } from 'react';
import { UserProfile, FamilyMember, TransactionRecord } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Search, Wallet, Shield, Sparkles, ChevronRight, Users, Smartphone, Share2, BadgeIndianRupee } from 'lucide-react';
import { getUsersByPhones, getUserById, recordTransaction, getTransactions, updateFamilySpend, getProfile, getProfileByStellarId, updatePersonalSpend, updateSplitPayment, updateRequestStatus } from '../services/db';
import { sendPayment, getBalance } from '../services/stellar';
import { getLivePrice, calculateCryptoToSend } from '../services/priceService';
import { decryptSecret } from '../services/encryption';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import SuccessScreen from '../components/SuccessScreen';
import UpiDrawer from '../components/UpiDrawer';
import { NotificationService } from '../services/notification';
import { getAvatarUrl } from '../services/avatars';
import { ZKProofService, PaymentProof } from '../services/zkProofService';

interface Props {
  profile: UserProfile | null;
}

interface Contact {
  id: string;
  name: string;
  avatarSeed?: string;
}

interface FamilyWalletInfo {
  permission: FamilyMember;
  ownerProfile: UserProfile;
  ownerBalance: string;
}

const SendMoney: React.FC<Props> = ({ profile }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const splitId = searchParams.get('splitId');
  const requestId = searchParams.get('requestId');

  const [searchQuery, setSearchQuery] = useState('');
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const [walletBalance, setWalletBalance] = useState<string>('0.00');
  // Changed from single FamilyWalletInfo to array to support multiple families
  const [familyWallets, setFamilyWallets] = useState<FamilyWalletInfo[]>([]);
  const [selectedFamilyIndex, setSelectedFamilyIndex] = useState<number>(0);
  const [loadingBalances, setLoadingBalances] = useState(true);

  const [amount, setAmount] = useState(searchParams.get('amt') || '');
  const [memo, setMemo] = useState(searchParams.get('note') || '');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'family'>('wallet');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isUpiDrawerOpen, setIsUpiDrawerOpen] = useState(false);
  const [upiInput, setUpiInput] = useState('');
  const [category, setCategory] = useState<TransactionRecord['category']>('Other');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [zkProof, setZkProof] = useState<PaymentProof | null>(null);
  const [generatingProof, setGeneratingProof] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<'XLM'>('XLM');
  const [xlmRate, setXlmRate] = useState<number>(15.02);

  const [onStellarContacts, setOnStellarContacts] = useState<Contact[]>([]);
  const [inviteContacts, setInviteContacts] = useState<{ name: string, phone: string }[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const loadBalances = async () => {
      if (!profile) return;
      try {
        const balance = await getBalance(profile.publicKey);
        setWalletBalance(balance);

        // Fetch rates
        const xRate = await getLivePrice('stellar');
        setXlmRate(xRate);

        // Fetch ALL family memberships for this user
        const q = query(collection(db, 'family'), where('uid', '==', profile.uid), where('active', '==', true));
        const snap = await getDocs(q);

        if (!snap.empty) {
          // Process ALL family memberships, not just the first one
          const familyPromises = snap.docs.map(async (docSnap) => {
            const permission = { id: docSnap.id, ...docSnap.data() } as FamilyMember;
            const ownerUid = (permission as any).ownerUid;
            const ownerProfile = await getProfile(ownerUid);

            if (ownerProfile) {
              const ownerBalance = await getBalance(ownerProfile.publicKey);
              return { permission, ownerProfile, ownerBalance };
            }
            return null;
          });

          const results = await Promise.all(familyPromises);
          const validFamilies = results.filter((f): f is FamilyWalletInfo => f !== null);
          setFamilyWallets(validFamilies);
        }
      } catch (err) {
        console.error('Error loading balances:', err);
      } finally {
        setLoadingBalances(false);
      }
    };
    loadBalances();
  }, [profile]);

  useEffect(() => {
    const loadContacts = async () => {
      if (!profile) return;
      try {
        const txs = await getTransactions(profile.stellarId);
        const uniqueIds = Array.from(new Set(txs.map(tx =>
          tx.fromId === profile.stellarId ? tx.toId : tx.fromId
        ))).filter(id => id !== profile.stellarId).slice(0, 10);

        const contactProfiles = await Promise.all(uniqueIds.map(async (id) => {
          const p = await getProfileByStellarId(id);
          return {
            id,
            name: p?.displayName || id.split('@')[0],
            avatarSeed: p?.avatarSeed || id
          };
        }));

        setRecentContacts(contactProfiles);
      } catch (err) {
        console.error('Error loading contacts:', err);
      } finally {
        setLoadingContacts(false);
      }
    };
    loadContacts();

    const loadTarget = async () => {
      const toParam = searchParams.get('to');
      const pnParam = searchParams.get('pn');
      const modeParam = searchParams.get('mode');

      if (toParam) {
        if (modeParam === 'upi') {
          // It's an external UPI QR code
          setSelectedContact({
            id: toParam,
            name: pnParam || toParam.split('@')[0],
            avatarSeed: toParam
          });
          return;
        }

        const p = await getProfileByStellarId(toParam);
        setSelectedContact({
          id: toParam,
          name: p?.displayName || toParam.split('@')[0],
          avatarSeed: p?.avatarSeed || toParam
        });
      }
    };
    loadTarget();

    // Load cached contacts for "Full Access" feel
    const cachedStellar = localStorage.getItem('synced_stellar');
    const cachedInvite = localStorage.getItem('invite_list');
    if (cachedStellar) setOnStellarContacts(JSON.parse(cachedStellar));
    if (cachedInvite) setInviteContacts(JSON.parse(cachedInvite));
  }, [profile, searchParams]);

  const syncContacts = async () => {
    if (!('contacts' in navigator && 'select' in (navigator as any).contacts)) {
      setError("Contact Picker API not supported on this browser");
      return;
    }

    try {
      setSyncing(true);
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const contacts = await (navigator as any).contacts.select(props, opts);

      if (contacts.length > 0) {
        // Prepare phone numbers for lookup (clean formats)
        const phoneMap: { [key: string]: string } = {};
        const cleanedPhones = contacts.map((c: any) => {
          const rawPhone = c.tel[0].replace(/\s/g, '').replace(/-/g, '');
          phoneMap[rawPhone] = c.name[0];
          return rawPhone;
        });

        const matchedUsers = await getUsersByPhones(cleanedPhones);

        const stellarContacts = matchedUsers.map(u => ({
          id: u.stellarId,
          name: u.displayName || u.stellarId.split('@')[0],
          avatarSeed: u.avatarSeed || u.stellarId
        }));

        const inviteList = contacts
          .filter((c: any) => {
            const raw = c.tel[0].replace(/\s/g, '').replace(/-/g, '');
            return !matchedUsers.find(u => u.phoneNumber === raw);
          })
          .map((c: any) => ({
            name: c.name[0],
            phone: c.tel[0]
          }));

        setOnStellarContacts(stellarContacts);
        setInviteContacts(inviteList);

        // Persist to LocalStorage for "Full Access" experience
        localStorage.setItem('synced_stellar', JSON.stringify(stellarContacts));
        localStorage.setItem('invite_list', JSON.stringify(inviteList));
      }
    } catch (err) {
      console.error("Contact sync failed", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleInvite = (name: string) => {
    const message = `Hey ${name}! Join me on Ching Pay to send and receive money instantly: https://stellar.netlify.app`;
    if (navigator.share) {
      navigator.share({
        title: 'Join Ching Pay',
        text: message,
        url: 'https://stellar.netlify.app'
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
    }
  };

  const filteredContacts = recentContacts.filter(contact =>
    contact.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentRate = xlmRate;

  const cryptoToInrRaw = (amount: string) => parseFloat(amount) * currentRate;
  const cryptoToInr = (amount: string) => cryptoToInrRaw(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const xlmToInrRaw = (xlm: string) => parseFloat(xlm) * xlmRate;
  const xlmToInr = (xlm: string) => xlmToInrRaw(xlm).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  // Get the currently selected family wallet
  const selectedFamilyWallet = familyWallets[selectedFamilyIndex] || null;

  const getFamilyRemainingLimit = (wallet: FamilyWalletInfo | null) => {
    if (!wallet) return 0;
    return wallet.permission.dailyLimit - wallet.permission.spentToday;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedContact) return;

    // If PIN is set, show PIN modal first
    if (profile.pin && !showPinModal) {
      setShowPinModal(true);
      return;
    }

    setLoading(true);
    setError('');

    const amtNum = parseFloat(amount);
    try {
      let recipientPubKey = '';
      const isInternalStellar = selectedContact.id.endsWith('@stellar');

      if (isInternalStellar) {
        const recipient = await getUserById(selectedContact.id);
        if (!recipient) throw new Error("Recipient ID not found");
        recipientPubKey = recipient.publicKey;
      } else {
        // External UPI Merchant - Send funds to the Bridge Address
        // This is where the XLM -> INR swap happens
        recipientPubKey = 'GBRIDGE2DP6K2Y7O5V4P4X5P4Q4X5P4Q4X5P4Q4X5P4Q4X5P4Q4BRIDGE'; // Placeholder Bridge
      }

      if (paymentMethod === 'family' && selectedFamilyWallet) {
        if (amtNum > getFamilyRemainingLimit(selectedFamilyWallet)) throw new Error("Exceeds daily spending limit");

        let ownerSecret: string;

        // Try using the seamless shared secret first
        if ((selectedFamilyWallet.permission as any).sharedSecret) {
          ownerSecret = decryptSecret((selectedFamilyWallet.permission as any).sharedSecret, profile.uid.toLowerCase());
        } else {
          const vaultKey = localStorage.getItem('temp_vault_key');
          if (!vaultKey) throw new Error("Family authorization missing. Please ask the parent account to remove and re-add you in the Family Manager.");
          ownerSecret = decryptSecret(selectedFamilyWallet.ownerProfile.encryptedSecret, vaultKey);
        }

        if (!ownerSecret || !ownerSecret.startsWith('S')) {
          throw new Error("Invalid Authorization Key. The family owner may need to re-authorize your access.");
        }

        // Apply 5% buffer for merchant/family stability
        const conversionBuffer = 1.02;
        const xlmAmount = ((amtNum / xlmRate) * conversionBuffer).toFixed(7);
        const hash = await sendPayment(ownerSecret, recipientPubKey, xlmAmount, `FamilyPay: ${selectedContact.id}`);

        // Generate ZK Proof for Family Payment
        setGeneratingProof(true);
        const proof = await ZKProofService.generateProofOfPayment(
          ownerSecret,
          hash,
          amtNum.toString(),
          selectedContact.id
        );
        await ZKProofService.triggerUPIPayout(proof);
        setZkProof(proof);
        setGeneratingProof(false);

        await updateFamilySpend(selectedFamilyWallet.permission.id, amtNum);
        await recordTransaction({
          fromId: selectedFamilyWallet.ownerProfile.stellarId,
          toId: selectedContact.id,
          fromName: selectedFamilyWallet.ownerProfile.displayName || selectedFamilyWallet.ownerProfile.stellarId,
          toName: selectedContact.name,
          amount: amtNum,
          currency: 'INR',
          status: 'SUCCESS',
          txHash: hash,
          isFamilySpend: true,
          spenderId: profile.stellarId,
          category: category
        });

        // Trigger remote notification
        NotificationService.triggerRemoteNotification(
          selectedContact.id,
          amtNum.toString(),
          selectedFamilyWallet.ownerProfile.displayName || selectedFamilyWallet.ownerProfile.stellarId.split('@')[0]
        );
      } else {
        if (profile.dailyLimit && profile.dailyLimit > 0) {
          const remaining = Math.max(0, profile.dailyLimit - (profile.spentToday || 0));
          if (amtNum > remaining) {
            throw new Error(`Exceeds daily spending limit. Remaining: ₹${remaining}`);
          }
        }

        const password = localStorage.getItem('temp_vault_key');
        if (!password) throw new Error("Vault locked. Please login again.");

        let hash = '';
        const conversionBuffer = 1.02;

        const secret = decryptSecret(profile.encryptedSecret, password);
        const xlmAmount = ((amtNum / xlmRate) * conversionBuffer).toFixed(7);
        hash = await sendPayment(secret, recipientPubKey, xlmAmount, memo || `UPI Pay: ${selectedContact.id}`);

        // Generate ZK Proof of Payment
        setGeneratingProof(true);
        const proof = await ZKProofService.generateProofOfPayment(
          secret,
          hash,
          amtNum.toString(),
          selectedContact.id
        );

        // Trigger SDK Payout Verification
        await ZKProofService.triggerUPIPayout(proof);
        setZkProof(proof);
        setGeneratingProof(false);

        await updatePersonalSpend(profile.uid, amtNum);
        await recordTransaction({
          fromId: profile.stellarId,
          toId: selectedContact.id,
          fromName: profile.displayName || profile.stellarId,
          toName: selectedContact.name,
          amount: amtNum,
          currency: 'INR',
          status: 'SUCCESS',
          txHash: hash,
          isFamilySpend: false,
          asset: selectedAsset,
          category: category
        });

        // Trigger remote notification
        NotificationService.triggerRemoteNotification(
          selectedContact.id,
          amtNum.toString(),
          profile.displayName || profile.stellarId.split('@')[0]
        );
      }

      // Handle Split/Request updates
      if (splitId) {
        await updateSplitPayment(splitId, profile.stellarId);
      }
      if (requestId) {
        await updateRequestStatus(requestId, 'PAID');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Payment failed");
      setPin(''); // Reset PIN on error
      setShowPinModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === profile?.pin) {
      setShowPinModal(false);
      handlePay(e);
    } else {
      setError("Incorrect Transaction PIN");
      setPin('');
    }
  };

  if (success) {
    return (
      <SuccessScreen
        recipientName={selectedContact?.name || ''}
        amount={amount}
        zkProof={zkProof}
      />
    );
  }

  if (selectedContact) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] flex flex-col relative overflow-hidden text-white">
        {/* PIN Modal Overlay */}
        {showPinModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowPinModal(false)}></div>
            <div className="relative w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-[#E5D5B3]/10 rounded-2xl flex items-center justify-center text-[#E5D5B3] mb-8 border border-[#E5D5B3]/20">
                <Shield size={32} />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">Security Check</h3>
              <p className="text-zinc-500 text-sm font-medium mb-12 uppercase tracking-widest">Enter Transaction PIN</p>

              <div className="flex gap-4 mb-12">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-[#E5D5B3] border-[#E5D5B3] scale-125 shadow-[0_0_15px_rgba(229,213,179,0.5)]' : 'border-zinc-800'}`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (num === 'del') setPin(pin.slice(0, -1));
                      else if (num !== '' && pin.length < 4) {
                        const newPin = pin + num;
                        setPin(newPin);
                        if (newPin.length === 4 && newPin === profile?.pin) {
                          setTimeout(() => handlePay({ preventDefault: () => { } } as any), 300);
                          setShowPinModal(false);
                        } else if (newPin.length === 4) {
                          setError("Incorrect Transaction PIN");
                          setTimeout(() => setPin(''), 500);
                        }
                      }
                    }}
                    className={`h-16 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${num === '' ? 'pointer-events-none' : 'hover:bg-white/5 active:scale-90 border border-transparent active:border-white/10'}`}
                  >
                    {num === 'del' ? '←' : num}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowPinModal(false)}
                className="mt-12 text-zinc-600 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
              >
                Cancel Payment
              </button>
            </div>
          </div>
        )}
        <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-[#E5D5B3]/5 rounded-full blur-[100px]"></div>

        <div className="relative z-20 pt-5 px-6 flex items-center justify-between">
          <button
            onClick={() => setSelectedContact(null)}
            className="p-3 bg-zinc-900/80 backdrop-blur-md rounded-2xl text-zinc-400 hover:text-white transition-all border border-white/5"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-10"></div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center pt-8 px-6 text-white">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-zinc-900 border-2 border-white/5 overflow-hidden shadow-2xl mb-4">
              <img
                src={getAvatarUrl(selectedContact.avatarSeed || selectedContact.id)}
                alt={selectedContact.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-black tracking-tight capitalize">{selectedContact.name}</h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">{selectedContact.id}</p>
          </div>

          <div className="w-full flex flex-col items-center">
            {/* Amount Input Card */}
            <div className="relative w-full max-w-[280px] mb-6">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-[#E5D5B3]/5 rounded-[2rem] blur-xl scale-110 opacity-50" />

              {/* Card */}
              <div className="relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-[1rem] p-4 shadow-xl">
                {/* Label */}
                {/* <p className="text-[10px] font-black text-zinc-500 uppercase  text-center mb-2">Enter Amount</p> */}

                {/* Amount Input */}
                <div className="flex items-center justify-start gap-">
                  <span className={`font-black transition-all duration-300 ${amount ? 'text-[#E5D5B3] text-4xl' : 'text-zinc-600 text-3xl'}`}>₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={amount ? parseInt(amount).toLocaleString('en-IN') : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length <= 8) setAmount(val);
                    }}
                    placeholder="0"
                    className="bg-transparent text-white text-3xl flex-1 font-black text-center w-full outline-none placeholder-zinc-700 caret-[#E5D5B3]"
                    style={{ maxWidth: `${Math.max(60, (amount?.length || 1) * 35)}px` }}
                  />
                </div>

                {/* Underline Accent */}
                {/* <div className="mt-4 mx-auto w-16 h-1 rounded-full bg-gradient-to-r from-transparent via-[#E5D5B3]/30 to-transparent" /> */}
              </div>
            </div>

            {/* Note Input */}
            {/* <div className="w-full max-w-[240px] relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-all group-focus-within:scale-110">
                <Sparkles size={14} className="text-[#E5D5B3] opacity-50 group-focus-within:opacity-100 transition-opacity" />
              </div>
              <input
                type="text"
                placeholder="ADD NOTE"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl text-[#E5D5B3] text-[10px] font-black uppercase tracking-widest placeholder-zinc-600 focus:outline-none focus:border-[#E5D5B3]/30 focus:bg-zinc-900/70 transition-all text-center"
              />
            </div> */}

            {/* Category Selector */}
            <div className="w-full overflow-x-auto no-scrollbar py-2">
              <div className="flex gap-2 px-4">
                {(['Shopping', 'Food', 'Travel', 'Bills', 'Entertainment', 'Other'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${category === cat
                      ? 'bg-zinc-100 text-black border-zinc-100'
                      : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/20'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-20 bg-white rounded-t-[1.5rem] p-8 pb-12 shadow-2xl">
          <h3 className="text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6">Payment Method</h3>

          <div className="space-y-4">
            <button
              onClick={() => setPaymentMethod('wallet')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${paymentMethod === 'wallet' ? 'border-black bg-zinc-50' : 'border-zinc-100'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'wallet' ? 'bg-black text-[#E5D5B3]' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                  <Wallet size={18} />
                </div>
                <div className="text-left">
                  <p className="font-black text-black text-sm tracking-tight">Main Vault</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Available: ₹{loadingBalances ? '...' : xlmToInr(walletBalance)}
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'wallet' ? 'border-black' : 'border-zinc-200'
                }`}>
                {paymentMethod === 'wallet' && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
              </div>
            </button>

            {/* Render ALL family wallets */}
            {familyWallets.map((familyWallet, index) => (
              <button
                key={familyWallet.permission.id}
                onClick={() => {
                  setPaymentMethod('family');
                  setSelectedFamilyIndex(index);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${paymentMethod === 'family' && selectedFamilyIndex === index
                  ? 'border-zinc-900 bg-zinc-50'
                  : 'border-zinc-100'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'family' && selectedFamilyIndex === index
                    ? 'bg-zinc-900 text-[#E5D5B3]'
                    : 'bg-zinc-100 text-zinc-400'
                    }`}>
                    <Shield size={18} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-black text-sm tracking-tight">
                      {familyWallet.ownerProfile.displayName || familyWallet.ownerProfile.stellarId.split('@')[0]}'s Family
                    </p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      Remaining: ₹{getFamilyRemainingLimit(familyWallet).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'family' && selectedFamilyIndex === index
                  ? 'border-zinc-900'
                  : 'border-zinc-200'
                  }`}>
                  {paymentMethod === 'family' && selectedFamilyIndex === index && (
                    <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handlePay}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full mt-10 gold-gradient text-black h-[72px] rounded-2xl font-black text-xl shadow-2xl active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                {generatingProof ? (
                  <Shield size={22} className="text-black animate-pulse" />
                ) : (
                  <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                )}
                <span className="text-sm uppercase tracking-widest">
                  {generatingProof ? 'Generating ZK Proof...' : 'Confirming...'}
                </span>
              </div>
            ) : (
              <>
                <span>Confirm Transfer</span>
                <Send size={20} />
              </>
            )}
          </button>

          {error && <p className="text-red-500 text-[10px] font-bold text-center mt-4 uppercase tracking-widest">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white">
      <div className="pt-5 px-5 flex items-center justify-between mb-">
        <div>
          <button
            onClick={() => navigate("/")}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          {/* <h2 className="text-4xl font-black tracking-tighter">Transfer</h2> */}
        </div>

      </div>

      <div className="px-5 mb-10 mt-8">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#E5D5B3] transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-6 py-3 bg-zinc-800/60 border border-white/5 rounded-2xl shadow-inner focus:ring-1 focus:ring-[#E5D5B3] font-bold text-lg text-white placeholder-zinc-700"
          />
        </div>
      </div>

      <div className="px-5 mb-12">
        <button
          onClick={() => {
            setIsUpiDrawerOpen(true);
            setUpiInput('');
          }}
          className="w-full flex items-center justify-between p-3 bg-zinc-900/80 border border-white/5 rounded-2xl shadow-xl active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 gold-gradient rounded-xl flex items-center justify-center text-black">
              <BadgeIndianRupee />
            </div>
            <div className="text-left">
              <p className="font-black text-white text-lg leading-none mb-1">New Pay</p>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">External UPI ID</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-zinc-700 group-hover:text-[#E5D5B3] transition-all" />
        </button>
      </div>

      <UpiDrawer
        isOpen={isUpiDrawerOpen}
        onClose={() => setIsUpiDrawerOpen(false)}
        upiInput={upiInput}
        setUpiInput={setUpiInput}
        onSearch={async () => {
          if (upiInput.trim()) {
            const id = upiInput.trim();
            const profile = await getProfileByStellarId(id);
            setSelectedContact({
              id,
              name: profile?.displayName || id.split('@')[0],
              avatarSeed: profile?.avatarSeed || id
            });
            setIsUpiDrawerOpen(false);
          }
        }}
        searching={false}
      />

      <div className="px-8 mb-10">
        <button
          onClick={syncContacts}
          disabled={syncing}
          className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
            <Users size={16} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
            {syncing ? 'Syncing Contacts...' : 'Find Contacts on Stellar'}
          </span>
        </button>
      </div>

      <div className="px-8 pb-32">
        {onStellarContacts.length > 0 && (
          <div className="mb-10">
            <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Contacts Joined
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {onStellarContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-zinc-800 rounded-2xl overflow-hidden border border-white/5 group-hover:border-[#E5D5B3]/50 transition-all shadow-lg">
                      <img
                        src={getAvatarUrl(contact.avatarSeed || contact.id)}
                        alt={contact.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-base leading-none mb-1 capitalize">{contact.name}</p>
                      <p className="text-[10px] font-bold text-zinc-400 tracking-tight">{contact.id}</p>
                    </div>
                  </div>
                  <div className="p-2 border border-white/5 rounded-xl group-hover:border-[#E5D5B3]/30 transition-all">
                    <ChevronRight size={16} className="text-zinc-700" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {inviteContacts.length > 0 && (
          <div className="mb-10">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Invite to Stellar</h3>
            <div className="grid grid-cols-1 gap-6">
              {inviteContacts.slice(0, 15).map((contact, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-zinc-900/50 rounded-2xl flex items-center justify-center text-zinc-700 border border-white/5">
                      <Smartphone size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-zinc-300 text-base leading-none mb-1 capitalize">{contact.name}</p>
                      <p className="text-[10px] font-bold text-zinc-600 tracking-tight">{contact.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInvite(contact.name)}
                    className="px-4 py-2 bg-[#E5D5B3]/5 border border-[#E5D5B3]/20 rounded-xl text-[#E5D5B3] text-[10px] font-black uppercase tracking-widest hover:bg-[#E5D5B3]/10 transition-all"
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {onStellarContacts.length === 0 && (
          <div className="mt-10">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Recent Ledger</h3>
            {loadingContacts ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#E5D5B3] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="bg-zinc-900/40 rounded-[1rem] border border-white/5 p-12 text-center">
                <p className="text-zinc-500 font-bold">No recent activity found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-zinc-800 rounded-2xl overflow-hidden border border-white/5 group-hover:border-[#E5D5B3]/50 transition-all shadow-lg">
                        <img
                          src={getAvatarUrl(contact.avatarSeed || contact.id)}
                          alt={contact.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white text-base leading-none mb-1 capitalize">{contact.name}</p>
                        <p className="text-[10px] font-bold text-zinc-400 tracking-tight">{contact.id}</p>
                      </div>
                    </div>
                    <div className="p-2 border border-white/5 rounded-xl group-hover:border-[#E5D5B3]/30 transition-all">
                      <ChevronRight size={16} className="text-zinc-700" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SendMoney;
