import React from 'react';
import { X, User } from 'lucide-react';

interface UpiDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    upiInput: string;
    setUpiInput: (value: string) => void;
    onSearch: () => void;
    searching: boolean;
}

const UpiDrawer: React.FC<UpiDrawerProps> = ({
    isOpen,
    onClose,
    upiInput,
    setUpiInput,
    onSearch,
    searching
}) => {
    return (
        <div
            className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b from-zinc-900 to-black rounded-t-[2rem] transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ height: '50vh', minHeight: '320px' }}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-zinc-700 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-6">
                    <h3 className="text-xl font-black text-white tracking-tight">Enter UPI ID</h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 flex flex-col gap-6">
                    {/* Input Field */}
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <User size={20} className="text-zinc-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="example@upi"
                            value={upiInput}
                            onChange={(e) => setUpiInput(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-zinc-800/80 border border-white/10 rounded-2xl text-white font-bold text-lg placeholder-zinc-600 focus:border-[#E5D5B3]/30 focus:outline-none transition-all"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-zinc-800 rounded-2xl text-zinc-400 font-bold text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSearch}
                            disabled={!upiInput.trim() || searching}
                            className="flex-[2] py-4 gold-gradient text-black rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center"
                        >
                            {searching ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                'Search'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpiDrawer;
