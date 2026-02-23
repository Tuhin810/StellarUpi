
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Calendar, Clock, Plus, Trash2, Send,
    CheckCircle2, XCircle, AlertCircle, Timer, Search,
    ChevronRight, Zap, CalendarClock, BadgeIndianRupee
} from 'lucide-react';
import { UserProfile, ScheduledPayment } from '../types';
import { Timestamp } from 'firebase/firestore';
import {
    createScheduledPayment,
    getScheduledPayments,
    cancelScheduledPayment,
    getTransactions,
    getProfileByStellarId
} from '../services/db';
import { getAvatarUrl } from '../services/avatars';

interface Props {
    profile: UserProfile;
}

interface Contact {
    id: string;
    name: string;
    avatarSeed?: string;
}

const SchedulePay: React.FC<Props> = ({ profile }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [tab, setTab] = useState<'create' | 'history'>('create');
    const [payments, setPayments] = useState<ScheduledPayment[]>([]);
    const [loading, setLoading] = useState(true);

    // Create form state
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [category, setCategory] = useState<'Shopping' | 'Food' | 'Travel' | 'Bills' | 'Entertainment' | 'Other'>('Other');
    const [creating, setCreating] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [error, setError] = useState('');

    // Contacts
    const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);

    useEffect(() => {
        loadPayments();
        loadContacts();

        // Pre-fill from URL params if coming from send page
        const toParam = searchParams.get('to');
        const nameParam = searchParams.get('name');
        if (toParam) {
            setSelectedContact({
                id: toParam,
                name: nameParam || toParam.split('@')[0],
                avatarSeed: toParam
            });
        }
    }, [profile]);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const data = await getScheduledPayments(profile.uid);
            setPayments(data);
        } catch (err) {
            console.error("Error loading scheduled payments:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadContacts = async () => {
        try {
            const txs = await getTransactions(profile.stellarId);
            const uniqueIds = Array.from(new Set(txs.map(tx =>
                tx.fromId === profile.stellarId ? tx.toId : tx.fromId
            ))).filter(id => id !== profile.stellarId).slice(0, 15);

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

    const handleCreate = async () => {
        if (!selectedContact || !amount || !scheduleDate || !scheduleTime) {
            setError('Please fill all fields');
            return;
        }

        const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        if (scheduledDateTime <= new Date()) {
            setError('Schedule time must be in the future');
            return;
        }

        setCreating(true);
        setError('');

        try {
            await createScheduledPayment({
                userId: profile.uid,
                userStellarId: profile.stellarId,
                recipientStellarId: selectedContact.id,
                recipientName: selectedContact.name,
                amount: parseFloat(amount),
                memo,
                category,
                scheduledDate: Timestamp.fromDate(scheduledDateTime),
            });

            setSuccessMsg(`₹${parseInt(amount).toLocaleString()} scheduled for ${selectedContact.name}`);
            setAmount('');
            setMemo('');
            setScheduleDate('');
            setScheduleTime('');
            setSelectedContact(null);
            setCategory('Other');

            await loadPayments();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err: any) {
            setError(err.message || 'Failed to schedule payment');
        } finally {
            setCreating(false);
        }
    };

    const handleCancel = async (paymentId: string) => {
        if (!window.confirm("Cancel this scheduled payment?")) return;
        try {
            await cancelScheduledPayment(paymentId);
            setPayments(prev => prev.map(p =>
                p.id === paymentId ? { ...p, status: 'cancelled' as const } : p
            ));
        } catch (err) {
            console.error("Error cancelling:", err);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Timer size={16} className="text-amber-400" />;
            case 'completed': return <CheckCircle2 size={16} className="text-emerald-400" />;
            case 'failed': return <XCircle size={16} className="text-rose-400" />;
            case 'cancelled': return <XCircle size={16} className="text-zinc-500" />;
            default: return <AlertCircle size={16} className="text-zinc-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'completed': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'failed': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
            case 'cancelled': return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
            default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    const formatScheduleDate = (timestamp: any) => {
        let date: Date;
        if (timestamp && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } else if (timestamp?.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredContacts = recentContacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingPayments = payments.filter(p => p.status === 'pending');
    const pastPayments = payments.filter(p => p.status !== 'pending');

    // Minimum date = today
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f0a] via-[#0d1210] to-[#0a0f0a] text-white pb-32">
            {/* Ambient Glow */}
            <div className="fixed top-0 right-0 w-[60%] h-[40%] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[20%] left-[-10%] w-[40%] h-[30%] bg-[#E5D5B3]/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 pt-5 px-5 flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 transition-all border border-white/5"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter">Schedule Pay</h2>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Set it & forget it</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20">
                        <CalendarClock size={20} className="text-violet-400" />
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="px-5 mb-8">
                <div className="flex bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-1.5">
                    <button
                        onClick={() => setTab('create')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'create'
                            ? 'bg-white text-black shadow-lg'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Plus size={14} />
                            Schedule
                        </div>
                    </button>
                    <button
                        onClick={() => setTab('history')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${tab === 'history'
                            ? 'bg-white text-black shadow-lg'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Clock size={14} />
                            Upcoming
                            {pendingPayments.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                                    {pendingPayments.length}
                                </span>
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {/* Success Banner */}
            {successMsg && (
                <div className="mx-5 mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={20} className="text-emerald-400" />
                    </div>
                    <p className="text-sm font-bold text-emerald-400">{successMsg}</p>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="mx-5 mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <XCircle size={18} className="text-rose-400" />
                    <p className="text-sm font-bold text-rose-400">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-rose-400/60 hover:text-rose-400">
                        <XCircle size={16} />
                    </button>
                </div>
            )}

            {/* ═══════════ CREATE TAB ═══════════ */}
            {tab === 'create' && (
                <div className="px-5 space-y-6 animate-in fade-in duration-500">
                    {/* Step 1: Select Contact */}
                    {!selectedContact ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-1 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
                                    <span className="text-xs font-black">1</span>
                                </div>
                                <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Select Recipient</p>
                            </div>

                            {/* Search */}
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#E5D5B3] transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search contacts"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl font-bold text-sm text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                                />
                            </div>

                            {/* Contacts Grid */}
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar">
                                {loadingContacts ? (
                                    <div className="flex flex-col items-center justify-center py-16 opacity-30">
                                        <Clock size={32} className="animate-pulse mb-3" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Loading contacts...</p>
                                    </div>
                                ) : filteredContacts.length === 0 ? (
                                    <div className="text-center py-16 bg-zinc-900/40 rounded-3xl border border-dashed border-white/5">
                                        <AlertCircle size={32} className="text-zinc-800 mx-auto mb-4" />
                                        <p className="text-zinc-600 font-bold text-sm">No contacts found</p>
                                        <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest mt-1">Send money to someone first</p>
                                    </div>
                                ) : (
                                    filteredContacts.map(contact => (
                                        <button
                                            key={contact.id}
                                            onClick={() => setSelectedContact(contact)}
                                            className="w-full flex items-center gap-4 p-4 bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl hover:bg-zinc-900/70 hover:border-white/10 transition-all group active:scale-[0.98]"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-zinc-800 overflow-hidden border border-white/5 group-hover:border-violet-500/30 transition-all">
                                                <img
                                                    src={getAvatarUrl(contact.avatarSeed || contact.id)}
                                                    alt={contact.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="font-black text-white text-sm tracking-tight capitalize">{contact.name}</p>
                                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{contact.id}</p>
                                            </div>
                                            <ChevronRight size={18} className="text-zinc-700 group-hover:text-violet-400 transition-colors" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Payment Details */
                        <div className="space-y-6">
                            {/* Selected Contact Card */}
                            <button
                                onClick={() => setSelectedContact(null)}
                                className="w-full flex items-center gap-4 p-5 bg-violet-500/5 border border-violet-500/20 rounded-2xl group hover:bg-violet-500/10 transition-all"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-zinc-800 overflow-hidden border-2 border-violet-500/30 shadow-lg shadow-violet-500/5">
                                    <img
                                        src={getAvatarUrl(selectedContact.avatarSeed || selectedContact.id)}
                                        alt={selectedContact.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-white tracking-tight capitalize text-lg">{selectedContact.name}</p>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{selectedContact.id}</p>
                                </div>
                                <div className="text-[9px] font-black text-violet-400 uppercase tracking-widest opacity-60">Change</div>
                            </button>

                            {/* Amount Input */}
                            <div>
                                <div className="flex items-center gap-3 px-1 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
                                        <span className="text-xs font-black">2</span>
                                    </div>
                                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Amount & Details</p>
                                </div>

                                <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                                    <div className="flex items-center justify-center gap-1 mb-6">
                                        <span className={`font-black text-3xl transition-colors ${amount ? 'text-[#E5D5B3]' : 'text-zinc-700'}`}>₹</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={amount ? parseInt(amount).toLocaleString('en-IN') : ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                if (val.length <= 8) setAmount(val);
                                            }}
                                            placeholder="0"
                                            className="bg-transparent text-white text-3xl font-black text-center outline-none placeholder-zinc-700 caret-[#E5D5B3] w-full max-w-[200px]"
                                        />
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="ADD NOTE (OPTIONAL)"
                                        value={memo}
                                        onChange={(e) => setMemo(e.target.value)}
                                        className="w-full py-3 bg-zinc-800/50 border border-white/5 rounded-xl text-zinc-400 text-[10px] font-bold uppercase tracking-widest placeholder-zinc-700 text-center focus:outline-none focus:border-violet-500/30 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Category Selector */}
                            <div className="overflow-x-auto no-scrollbar">
                                <div className="flex gap-3 px-1">
                                    {([
                                        { name: 'Shopping' as const, icon: '🛍️' },
                                        { name: 'Food' as const, icon: '🍕' },
                                        { name: 'Travel' as const, icon: '✈️' },
                                        { name: 'Bills' as const, icon: '📄' },
                                        { name: 'Entertainment' as const, icon: '🎬' },
                                        { name: 'Other' as const, icon: '💸' },
                                    ]).map((cat) => (
                                        <button
                                            key={cat.name}
                                            type="button"
                                            onClick={() => setCategory(cat.name)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${category === cat.name
                                                ? 'bg-white text-black border-white shadow-lg'
                                                : 'bg-zinc-900/60 text-zinc-500 border-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            <span>{cat.icon}</span>
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date & Time Picker */}
                            <div>
                                <div className="flex items-center gap-3 px-1 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
                                        <span className="text-xs font-black">3</span>
                                    </div>
                                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">When to Pay</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Calendar size={14} className="text-violet-400" />
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Date</span>
                                        </div>
                                        <input
                                            type="date"
                                            min={today}
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            className="w-full bg-transparent text-white font-bold text-sm outline-none [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Clock size={14} className="text-violet-400" />
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Time</span>
                                        </div>
                                        <input
                                            type="time"
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            className="w-full bg-transparent text-white font-bold text-sm outline-none [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                {scheduleDate && scheduleTime && (
                                    <div className="mt-4 p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
                                            <Zap size={18} className="text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Auto-pay on</p>
                                            <p className="text-sm font-bold text-white">
                                                {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleDateString('en-IN', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })} at {scheduleTime}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Schedule Button */}
                            <button
                                onClick={handleCreate}
                                disabled={creating || !amount || !scheduleDate || !scheduleTime || parseFloat(amount) <= 0}
                                className="w-full h-16 bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-violet-500/20 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                            >
                                {creating ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Scheduling...</span>
                                    </div>
                                ) : (
                                    <>
                                        <CalendarClock size={20} />
                                        <span>Schedule ₹{amount ? parseInt(amount).toLocaleString('en-IN') : '0'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ HISTORY TAB ═══════════ */}
            {tab === 'history' && (
                <div className="px-5 space-y-6 animate-in fade-in duration-500">
                    {/* Pending Section */}
                    {pendingPayments.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Upcoming</p>
                                <span className="bg-amber-400/10 text-amber-400 px-3 py-1 rounded-full text-[9px] font-black border border-amber-400/20">
                                    {pendingPayments.length} SCHEDULED
                                </span>
                            </div>

                            {pendingPayments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-5 group hover:bg-zinc-900 transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 overflow-hidden border border-white/5 group-hover:border-violet-500/30 transition-all">
                                            <img
                                                src={getAvatarUrl(payment.recipientName)}
                                                alt={payment.recipientName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-black text-white tracking-tight capitalize">{payment.recipientName}</h4>
                                                <p className="text-lg font-black text-[#E5D5B3] tracking-tighter">₹{payment.amount.toLocaleString()}</p>
                                            </div>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">{payment.recipientStellarId}</p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={12} className="text-violet-400" />
                                                    <span className="text-[10px] font-bold text-zinc-400">{formatScheduleDate(payment.scheduledDate)}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleCancel(payment.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-rose-400/60 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Cancel</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {payment.memo && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <p className="text-[10px] font-bold text-zinc-600 italic">"{payment.memo}"</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Past Payments */}
                    {pastPayments.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">History</p>

                            {pastPayments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className={`bg-zinc-900/30 backdrop-blur-md border rounded-2xl p-4 ${payment.status === 'cancelled' ? 'border-white/5 opacity-50' : 'border-white/5'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden border border-white/5">
                                            <img
                                                src={getAvatarUrl(payment.recipientName)}
                                                alt={payment.recipientName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-white text-sm capitalize truncate">{payment.recipientName}</p>
                                                <p className="font-black text-sm text-zinc-400">₹{payment.amount.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[9px] font-bold text-zinc-600">{formatScheduleDate(payment.scheduledDate)}</span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(payment.status)}`}>
                                                    {getStatusIcon(payment.status)}
                                                    {payment.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {payment.failReason && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <p className="text-[10px] font-bold text-rose-400/80">{payment.failReason}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                            <Clock size={40} className="animate-pulse mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Loading...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 mx-auto mb-6 bg-zinc-900/60 rounded-3xl flex items-center justify-center border border-dashed border-white/10">
                                <CalendarClock size={36} className="text-zinc-700" />
                            </div>
                            <h3 className="font-black text-lg text-zinc-500 tracking-tight mb-2">No Scheduled Payments</h3>
                            <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest">Create your first scheduled payment</p>
                            <button
                                onClick={() => setTab('create')}
                                className="mt-6 px-6 py-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-violet-500/20 transition-all"
                            >
                                + Schedule Now
                            </button>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default SchedulePay;
