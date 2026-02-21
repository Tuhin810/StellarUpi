
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { getAvatarUrl } from '../services/avatars';

interface Contact {
    id: string;
    name: string;
    avatarSeed: string;
    isGroup?: boolean;
    memberAvatars?: string[];
}

interface PeopleListProps {
    contacts: Contact[];
    loading: boolean;
    onCreateGroupClick: () => void;
}

const PeopleList: React.FC<PeopleListProps> = ({ contacts, loading, onCreateGroupClick }) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Initial view: 'New Group' + 7 contacts = 8 items (2 lines of 4)
    const displayedContacts = isExpanded ? contacts : contacts.slice(0, 3);
    const hasMore = contacts.length > 3;

    const renderGroupCollage = (memberAvatars: string[]) => {
        const count = Math.min(memberAvatars.length, 4);

        if (count === 1) {
            return (
                <div className="w-full h-full bg-zinc-800">
                    <img src={getAvatarUrl(memberAvatars[0], false)} alt="member" className="w-full h-full object-cover scale-110" />
                </div>
            );
        }

        if (count === 2) {
            return (
                <div className="flex w-full h-full gap-[2px]">
                    <div className="flex-1 h-full overflow-hidden bg-zinc-800">
                        <img src={getAvatarUrl(memberAvatars[0], false)} alt="member" className="w-full h-full object-cover scale-110" />
                    </div>
                    <div className="flex-1 h-full overflow-hidden bg-zinc-800">
                        <img src={getAvatarUrl(memberAvatars[1], false)} alt="member" className="w-full h-full object-cover scale-110" />
                    </div>
                </div>
            );
        }

        if (count === 3) {
            return (
                <div className="flex w-full h-full gap-[2px]">
                    <div className="flex-1 h-full overflow-hidden bg-zinc-800 border-r border-zinc-900">
                        <img src={getAvatarUrl(memberAvatars[0], false)} alt="member" className="w-full h-full object-cover scale-110" />
                    </div>
                    <div className="flex-1 flex flex-col gap-[2px]">
                        <div className="flex-1 overflow-hidden bg-zinc-800">
                            <img src={getAvatarUrl(memberAvatars[1], false)} alt="member" className="w-full h-full object-cover scale-110" />
                        </div>
                        <div className="flex-1 overflow-hidden bg-zinc-800">
                            <img src={getAvatarUrl(memberAvatars[2], false)} alt="member" className="w-full h-full object-cover scale-110" />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-[2px]">
                {memberAvatars.slice(0, 4).map((avatar, idx) => (
                    <div key={idx} className="w-full h-full bg-zinc-800 overflow-hidden">
                        <img
                            src={getAvatarUrl(avatar, false)}
                            alt="member"
                            className="w-full h-full object-cover scale-110"
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="mt-10">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black tracking-tight">People</h3>
                {hasMore && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-[#E5D5B3] text-xs font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                    >
                        {isExpanded ? 'View Less' : 'View All'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-4 gap-y-4 gap-x-0">
                {/* Create Group Button */}
                <button
                    onClick={onCreateGroupClick}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className="w-16 h-16 rounded-[2rem] bg-zinc-900/50 backdrop-blur-md border border-[#E5D5B3]/10 flex items-center justify-center text-[#E5D5B3] group-hover:gold-gradient group-hover:text-black transition-all shadow-xl shadow-black/40 group-hover:scale-105 active:scale-95 group-hover:border-transparent">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><circle cx="12" cy="6" r="4" fill="currentColor" /><path fill="currentColor" d="M18.095 15.031C17.67 15 17.149 15 16.5 15c-1.65 0-2.475 0-2.987.513C13 16.025 13 16.85 13 18.5c0 1.166 0 1.92.181 2.443Q12.605 21 12 21c-3.866 0-7-1.79-7-4s3.134-4 7-4c2.613 0 4.892.818 6.095 2.031" opacity=".5" /><path fill="currentColor" fill-rule="evenodd" d="M16.5 22c-1.65 0-2.475 0-2.987-.513C13 20.975 13 20.15 13 18.5s0-2.475.513-2.987C14.025 15 14.85 15 16.5 15s2.475 0 2.987.513C20 16.025 20 16.85 20 18.5s0 2.475-.513 2.987C18.975 22 18.15 22 16.5 22m.583-5.056a.583.583 0 1 0-1.166 0v.973h-.973a.583.583 0 1 0 0 1.166h.973v.973a.583.583 0 1 0 1.166 0v-.973h.973a.583.583 0 1 0 0-1.166h-.973z" clip-rule="evenodd" /></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-[#E5D5B3] transition-colors">New Group</span>
                </button>

                {loading ? (
                    <>
                        {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                                <div className="w-16 h-16 bg-zinc-800/50 rounded-[2rem]"></div>
                                <div className="h-2 bg-zinc-800 rounded w-12"></div>
                            </div>
                        ))}
                    </>
                ) : contacts.length === 0 ? (
                    <div className="col-span-3 flex items-center justify-center py-6 bg-zinc-900/30 rounded-3xl border border-white/5">
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">No recent</p>
                    </div>
                ) : (
                    displayedContacts.map((contact) => (
                        <button
                            key={contact.id}
                            onClick={() => navigate(contact.isGroup ? `/group/${contact.id}` : `/chat/${contact.id}`)}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className={`w-16 h-16 rounded-[2.5rem] ${contact.isGroup ? 'bg-zinc-900 border-[#E5D5B3]/40 p-0.5' : 'bg-zinc-800 border-white/5 p-0'} border overflow-hidden group-hover:border-[#E5D5B3]/80 transition-all shadow-2xl shadow-black/60 group-hover:scale-105 active:scale-95 flex items-center justify-center relative`}>
                                {contact.isGroup && contact.memberAvatars && contact.memberAvatars.length > 0 ? (
                                    <div className="w-full h-full rounded-[2rem] overflow-hidden bg-zinc-900">
                                        {renderGroupCollage(contact.memberAvatars)}
                                    </div>
                                ) : (
                                    <img
                                        src={getAvatarUrl(contact.avatarSeed, contact.isGroup)}
                                        alt={contact.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <span className="text-[10px] font-black  text-zinc-500 group-hover:text-white transition-colors truncate w-full px-1 text-center">{contact.name}</span>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default PeopleList;
