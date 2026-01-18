
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
        <div className={`fixed inset-0 z-[100] transition-opacity duration-300 opacity-100`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-zinc-900 to-black rounded-t-[2rem] transition-transform duration-300 ease-out translate-y-0"
                style={{ height: '55vh', minHeight: '420px' }}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-zinc-700 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-4 pt-3">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Create Group</h3>
                        <p className="text-[14px] font-black uppercas text-zinc-500 mt-1">Split expenses with friends</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <span className="text-xl">×</span>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 flex flex-col gap-5 overflow-y-auto" style={{ maxHeight: 'calc(55vh - 140px)' }}>
                    {/* Group Name Input */}
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <span className="text-zinc-500 text-lg">✦</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Group Name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            autoFocus
                            className="w-full pl-12 pr-4 py-4 bg-zinc-800/60 border border-white/10 rounded-2xl text-white text-lg font-medium placeholder-zinc-600 focus:outline-none focus:border-[#E5D5B3]/40 focus:ring-2 focus:ring-[#E5D5B3]/20 transition-all"
                        />
                    </div>

                    {/* Members Section */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Select Members</p>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                            {contacts.filter(c => !c.isGroup).map(c => {
                                const isSelected = selectedMembers.includes(c.id);
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => toggleMember(c.id)}
                                        className="flex flex-col items-center gap-2 min-w-[60px] relative"
                                    >
                                        <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? 'border-[#E5D5B3] scale-95' : 'border-white/5 opacity-50'}`}>
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatarSeed}`} className="w-full h-full" alt={c.name} />
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-0 right-0 w-5 h-5 bg-[#E5D5B3] rounded-full flex items-center justify-center text-black shadow-lg">
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                        )}
                                        <span className="text-[9px] font-bold uppercase tracking-tighter truncate w-14 text-center text-zinc-400">{c.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-zinc-800/80 border border-white/5 rounded-2xl font-black text-sm text-zinc-500 hover:bg-zinc-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!groupName || selectedMembers.length === 0 || isCreating}
                            onClick={handleCreate}
                            className="flex-[2] py-4 gold-gradient text-black rounded-2xl font-black text-sm shadow-xl disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                        >
                            {isCreating ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Create Group</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Hint Text */}
                    <p className="text-zinc-500 text-xs font-medium text-center pb-4">
                        Add at least one member to create a group
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
