import React from 'react';
import { Search, Zap, ChevronRight } from 'lucide-react';
import { getAvatarUrl } from '../services/avatars';

interface Contact {
    id: string;
    name: string;
    avatarSeed?: string;
}

interface ContactSelectorProps {
    contacts: Contact[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onSelectContact: (contact: Contact) => void;
    onNewPayClick: () => void;
}

const ContactSelector: React.FC<ContactSelectorProps> = ({
    contacts,
    searchQuery,
    setSearchQuery,
    onSelectContact,
    onNewPayClick
}) => {
    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            {/* Search Bar */}
            <div className="px-5 mb-8">
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                    <input
                        type="text"
                        placeholder="Search contacts"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-6 py-3 bg-zinc-800/60 border border-white/5 rounded-2xl shadow-inner focus:ring-1 focus:ring-[#E5D5B3] font-bold text-lg text-white placeholder-zinc-700"
                    />
                </div>
            </div>

            {/* New Pay Button */}
            <div className="px-5 mb-12">
                <button
                    onClick={onNewPayClick}
                    className="w-full flex items-center justify-between p-3 bg-zinc-900/80 border border-white/5 rounded-2xl shadow-xl active:scale-[0.98] transition-all group"
                >
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 gold-gradient rounded-xl flex items-center justify-center text-black">
                            <Zap size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-black text-white text-lg leading-none mb-1">New Pay</p>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">External UPI ID</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-zinc-700 group-hover:text-[#E5D5B3] transition-all" />
                </button>
            </div>

            {/* Contacts Section */}
            <div className="px-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 px-1">
                    Recent Contacts
                </p>
                <div className="space-y-2">
                    {filteredContacts.length === 0 ? (
                        <p className="text-center text-zinc-600 py-8 text-sm">No contacts found</p>
                    ) : (
                        filteredContacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => onSelectContact(contact)}
                                className="w-full flex items-center gap-5 p-3 hover:bg-zinc-900/50 rounded-2xl transition-all active:scale-[0.98] group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/5 overflow-hidden">
                                    <img
                                        src={getAvatarUrl(contact.avatarSeed || contact.id)}
                                        alt={contact.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-black text-white text-base capitalize leading-none mb-1">
                                        {contact.name}
                                    </p>
                                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                                        {contact.id}
                                    </p>
                                </div>
                                <ChevronRight size={18} className="text-zinc-800 group-hover:text-[#E5D5B3] transition-all" />
                            </button>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default ContactSelector;
