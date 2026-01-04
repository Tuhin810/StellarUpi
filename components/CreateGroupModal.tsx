
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { createGroup } from '../services/db';

interface Contact {
    id: string;
    name: string;
    avatarSeed: string;
    isGroup?: boolean;
}

interface CreateGroupModalProps {
    contacts: Contact[];
    stellarId: string;
    onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ contacts, stellarId, onClose }) => {
    const navigate = useNavigate();
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            const id = await createGroup({
                name: groupName,
                members: [stellarId, ...selectedMembers],
                createdBy: stellarId,
                avatarSeed: groupName
            });
            navigate(`/group/${id}`);
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    };

    const toggleMember = (id: string) => {
        if (selectedMembers.includes(id)) {
            setSelectedMembers(prev => prev.filter(m => m !== id));
        } else {
            setSelectedMembers(prev => [...prev, id]);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-zinc-900 rounded-[3rem] p-8 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
                <h3 className="text-xl font-black mb-1">Create Group</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8">Split expenses with friends</p>

                <input
                    type="text"
                    placeholder="Group Name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 font-bold text-sm mb-6 outline-none focus:border-[#E5D5B3]/20"
                />

                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4 px-2">Select Members</p>
                <div className="flex gap-4 overflow-x-auto no-scrollbar mb-8 -mx-2 px-2">
                    {contacts.filter(c => !c.isGroup).map(c => {
                        const isSelected = selectedMembers.includes(c.id);
                        return (
                            <button
                                key={c.id}
                                onClick={() => toggleMember(c.id)}
                                className="flex flex-col items-center gap-2 min-w-[60px] relative"
                            >
                                <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? 'border-[#E5D5B3] scale-90' : 'border-transparent opacity-40'}`}>
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatarSeed}`} className="w-full h-full" alt={c.name} />
                                </div>
                                {isSelected && (
                                    <div className="absolute top-0 right-0 w-5 h-5 bg-[#E5D5B3] rounded-full flex items-center justify-center text-black">
                                        <Check size={12} strokeWidth={4} />
                                    </div>
                                )}
                                <span className="text-[9px] font-black uppercase tracking-tighter truncate w-14 text-center">{c.name}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-zinc-800 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-500">Cancel</button>
                    <button
                        disabled={!groupName || selectedMembers.length === 0 || isCreating}
                        onClick={handleCreate}
                        className="flex-[2] py-4 gold-gradient text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-30 flex items-center justify-center"
                    >
                        {isCreating ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
