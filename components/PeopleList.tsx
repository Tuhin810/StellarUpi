
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    avatarSeed: string;
    isGroup?: boolean;
}

interface PeopleListProps {
    contacts: Contact[];
    loading: boolean;
    onCreateGroupClick: () => void;
}

const PeopleList: React.FC<PeopleListProps> = ({ contacts, loading, onCreateGroupClick }) => {
    const navigate = useNavigate();

    return (
        <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black tracking-tight">People</h3>
                <button className="text-[#E5D5B3] text-xs font-black uppercase tracking-widest opacity-60">View All</button>
            </div>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                {/* Create Group Button */}
                <button
                    onClick={onCreateGroupClick}
                    className="flex flex-col items-center gap-3 min-w-[72px] group"
                >
                    <div className="w-16 h-16 rounded-[2rem] bg-zinc-900/50 backdrop-blur-md border border-[#E5D5B3]/10 flex items-center justify-center text-[#E5D5B3] group-hover-:gold-gradient group-hover-:text-black transition-all shadow-xl shadow-black/40 group-hover-:scale-105 active:scale-95 group-hover-:border-transparent">
                        <UserPlus size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover-:text-[#E5D5B3] transition-colors">New Group</span>
                </button>

                {loading ? (
                    <div className="flex gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                                <div className="w-16 h-16 bg-zinc-800 rounded-full"></div>
                                <div className="h-3 bg-zinc-800 rounded w-12"></div>
                            </div>
                        ))}
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="w-full text-center py-6 bg-zinc-900/30 rounded-3xl border border-white/5">
                        <p className="text-zinc-500 text-sm font-bold">No recent contacts</p>
                    </div>
                ) : contacts.map((contact) => (
                    <button
                        key={contact.id}
                        onClick={() => navigate(contact.isGroup ? `/group/${contact.id}` : `/chat/${contact.id}`)}
                        className="flex flex-col items-center gap-3 min-w-[72px] group"
                    >
                        <div className={`w-16 h-16 rounded-[2rem] ${contact.isGroup ? 'bg-zinc-900 border-[#E5D5B3]/40' : 'bg-zinc-800 border-white/5'} border overflow-hidden group-hover-:border-[#E5D5B3]/80 transition-all shadow-2xl shadow-black/60 group-hover-:scale-105 active:scale-95 flex items-center justify-center relative`}>
                            <img
                                src={`https://api.dicebear.com/7.x/${contact.isGroup ? 'shapes' : 'avataaars'}/svg?seed=${contact.avatarSeed}`}
                                alt={contact.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover-:text-white transition-colors truncate w-16 text-center">{contact.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PeopleList;
