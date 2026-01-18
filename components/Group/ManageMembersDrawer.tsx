
import React, { useState } from 'react';
import { X, Search, RefreshCw, UserPlus, Trash2, Users, ChevronRight } from 'lucide-react';
import { UserProfile, SplitGroup } from '../../types';
import { searchUsers, updateGroupMembers } from '../../services/db';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    group: SplitGroup;
    profile: UserProfile;
    memberProfiles: Record<string, UserProfile>;
}

const ManageMembersDrawer: React.FC<Props> = ({ isOpen, onClose, group, profile, memberProfiles }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [savingMembers, setSavingMembers] = useState(false);

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.length > 2) {
            setIsSearching(true);
            try {
                const results = await searchUsers(val);
                setSearchResults(results.filter(r => !group.members.includes(r.stellarId)));
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleAddMember = async (user: UserProfile) => {
        setSavingMembers(true);
        try {
            await updateGroupMembers(group.id, [...group.members, user.stellarId]);
            setSearchQuery('');
            setSearchResults([]);
        } catch (err) {
            console.error(err);
        } finally {
            setSavingMembers(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        const displayName = memberProfiles[memberId]?.displayName || memberId.split('@')[0];
        if (window.confirm(`Remove ${displayName} from group?`)) {
            try {
                const newMembers = group.members.filter(m => m !== memberId);
                await updateGroupMembers(group.id, newMembers);
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className={`fixed inset-0 z-[110] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>
            <div className={`absolute bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#080808] rounded-t-[3.5rem] transition-all duration-700 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col border-t border-white/10 shadow-[0_-40px_100px_-20px_rgba(0,0,0,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ height: '85vh', minHeight: '600px' }}>

                {/* Visual Handle */}
                <div className="flex justify-center pt-6 pb-2">
                    <div className="w-16 h-1.5 bg-zinc-800/50 rounded-full" />
                </div>

                {/* Floating Navigation Header */}
                <div className="flex items-center justify-between px-10 py-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#E5D5B3] uppercase tracking-[0.4em] mb-1">StellarPay Group</span>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Members</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all active:scale-90"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-10 pb-24 space-y-8 no-scrollbar">

                    {/* Premium Search Section */}
                    <div className="relative group animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="absolute inset-0 bg-[#E5D5B3]/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-[#E5D5B3]" size={20} />
                            <input
                                type="text"
                                placeholder="Add members by ID..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-[1.8rem] py-5 pl-16 pr-6 text-base font-bold text-white outline-none focus:border-[#E5D5B3]/20 transition-all placeholder-zinc-800"
                            />
                            {isSearching && (
                                <RefreshCw className="absolute right-6 top-1/2 -translate-y-1/2 text-[#E5D5B3] animate-spin" size={20} />
                            )}
                        </div>

                        {/* Animated Search Results */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-4 bg-zinc-950/90 backdrop-blur-3xl rounded-[2rem] border border-white/10 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-300 z-50">
                                {searchResults.map(user => (
                                    <button
                                        key={user.uid}
                                        onClick={() => handleAddMember(user)}
                                        className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.03] transition-all text-left border-b border-white/5 last:border-0"
                                    >
                                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-800 border border-white/5">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed || user.uid}`} className="w-full h-full" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-white text-base leading-none mb-1">{user.displayName || user.stellarId.split('@')[0]}</p>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">@{user.stellarId.split('@')[0]}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-[#E5D5B3] flex items-center justify-center text-black shadow-lg">
                                            <UserPlus size={18} strokeWidth={3} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Member List Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Current Members</span>
                            <span className="text-[10px] font-black text-[#E5D5B3] uppercase tracking-widest bg-[#E5D5B3]/10 px-3 py-1.5 rounded-lg border border-[#E5D5B3]/10">{group.members.length} Total</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {group.members.map(memberId => {
                                const isMe = memberId === profile.stellarId;
                                const mProfile = memberProfiles[memberId];
                                return (
                                    <div
                                        key={memberId}
                                        className="flex items-center justify-between p-4 bg-zinc-900/30 border border-white/5 rounded-[2rem] transition-all hover:bg-zinc-900/50 hover:border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 p-0.5">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${memberId}`} className="w-full h-full rounded-[14px]" />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-black text-white text-base leading-none">
                                                        {mProfile?.displayName || memberId.split('@')[0]}
                                                    </span>
                                                    {isMe && <span className="text-[8px] bg-[#E5D5B3] text-black px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">You</span>}
                                                </div>
                                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest opacity-60">@{memberId.split('@')[0]}</span>
                                            </div>
                                        </div>

                                        {!isMe && (
                                            <button
                                                onClick={() => handleRemoveMember(memberId)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Fixed Footer Component */}
                <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
                    <div className="flex justify-center pointer-events-auto">
                        {/* Optional info or button could go here */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageMembersDrawer;
