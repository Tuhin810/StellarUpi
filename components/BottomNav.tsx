
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, History, ChevronUp, QrCode } from 'lucide-react';

const BottomNav: React.FC = () => {
    const location = useLocation();
    const path = location.pathname;

    // Hide BottomNav on these routes
    if (
        path === '/send' ||
        path === '/scan' ||
        path === '/receive' ||
        path === '/family' ||
        path === '/profile' ||
        path === '/rewards' ||
        path === '/add-money' ||
        path.startsWith('/chat') ||
        path.startsWith('/group') ||
        (path.startsWith('/transaction/') && !path.startsWith('/transactions'))
    ) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-gradient-to-br from-[#E5D5B3]/20 to-[#E5D5B3]/5 backdrop-blur-lg rounded-3xl p-1 px-6 flex items-center justify-between shadow-2xl z-50">
            <Link
                to="/"
                className={`flex-1 flex flex-col items-center py- rounded-2xl transition-all ${path === '/' ? 'text-[#E5D5B3] font-black' : 'text-zinc-300 font-bold'}`}
            >
                <Home size={22} />
                <span className="text-[10px] mt-1">Home</span>
            </Link>

            <div className="relative -top-10 px-2 group">
                <Link
                    to="/scan"
                    className="w-16 h-16 gold-gradient rounded-2xl flex flex-col items-center justify-center shadow-xl group-hover:scale-105 active:scale-95 transition-all text-black border-4 border-[#1A1A1A]"
                >
                    {/* <ChevronUp size={20} className="mb-[-2px]" /> */}
                    <QrCode size={20} className="mb-[2px]" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Pay</span>
                </Link>
            </div>

            <Link
                to="/transactions"
                className={`flex-1 flex flex-col items-center py- rounded-2xl transition-all ${path === '/transactions' ? 'text-[#E5D5B3] font-black' : 'text-zinc-300 font-bold'}`}
            >
                <History size={22} />
                <span className="text-[10px] mt-1">Activity</span>
            </Link>
        </div>
    );
};

export default BottomNav;
