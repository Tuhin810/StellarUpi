
import React, { useState } from 'react';
import { X, Search, RefreshCw, UserPlus, Trash2 } from 'lucide-react';
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
        try {
            await updateGroupMembers(group.id, [...group.members, user.stellarId]);
            setSearchQuery('');
            setSearchResults([]);
        } catch (err) {
            console.error(err);
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
        <div className={`fixed inset-0 z-[110] transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b from-zinc-900 to-black rounded-t-[2rem] transition-transform duration-300 ease-out shadow-[0_-40px_100px_-20px_rgba(0,0,0,1)] flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ height: '75vh', minHeight: '200px' }}
            >

                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-zinc-700 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-">
                    <h3 className="text-xl font-black text-white tracking-tight">Manage Members</h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-8 no-scrollbar mt-6">

                    {/* Search Section */}
                    <div className="relative group animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-[#E5D5B3]" size={18} />
                            <input
                                type="text"
                                placeholder="Add members by ID..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-[#E5D5B3]/20 transition-all placeholder-zinc-800"
                            />
                            {isSearching && (
                                <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 text-[#E5D5B3] animate-spin" size={16} />
                            )}
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-3 bg-zinc-950/90 backdrop-blur-3xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-50">
                                {searchResults.map(user => (
                                    <button
                                        key={user.uid}
                                        onClick={() => handleAddMember(user)}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-all text-left border-b border-white/5 last:border-0"
                                    >
                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-white/5">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed || user.uid}`} className="w-full h-full" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white text-sm leading-none mb-1">{user.displayName || user.stellarId.split('@')[0]}</p>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">@{user.stellarId.split('@')[0]}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-[#E5D5B3] flex items-center justify-center text-black">
                                            <UserPlus size={14} strokeWidth={3} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Member List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-sm font-black text-zinc-600">Current Members</span>
                            <span className="text-[10px] font-black text-[#E5D5B3] uppercase tracking-widest bg-[#E5D5B3]/10 px-2 py-1 rounded-md">{group.members.length} Total</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {group.members.map(memberId => {
                                const isMe = memberId === profile.stellarId;
                                const mProfile = memberProfiles[memberId];
                                return (
                                    <div
                                        key={memberId}
                                        className="flex items-center justify-between p-3.5 bg-zinc-900/30 border border-white/5 rounded-2xl transition-all hover:bg-zinc-900/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-white/10">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${memberId}`} className="w-full h-full rounded-lg" />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-bold text-white text-sm leading-none">
                                                        {mProfile?.displayName || memberId.split('@')[0]}
                                                    </span>
                                                    {isMe && <span className="text-[7px] bg-[#E5D5B3] text-black px-1.5 py-0.5 rounded-full font-black uppercase">You</span>}
                                                </div>
                                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tight">@{memberId.split('@')[0]}</span>
                                            </div>
                                        </div>

                                        {!isMe && (
                                            <button
                                                onClick={() => handleRemoveMember(memberId)}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageMembersDrawer;
