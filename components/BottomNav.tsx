
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
        path === '/gullak' ||
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
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M2 12.204c0-2.289 0-3.433.52-4.381c.518-.949 1.467-1.537 3.364-2.715l2-1.241C9.889 2.622 10.892 2 12 2s2.11.622 4.116 1.867l2 1.241c1.897 1.178 2.846 1.766 3.365 2.715S22 9.915 22 12.203v1.522c0 3.9 0 5.851-1.172 7.063S17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.212S2 17.626 2 13.725z" opacity=".5" /><path fill="currentColor" d="M9.447 15.398a.75.75 0 0 0-.894 1.205A5.77 5.77 0 0 0 12 17.75a5.77 5.77 0 0 0 3.447-1.147a.75.75 0 0 0-.894-1.206A4.27 4.27 0 0 1 12 16.25a4.27 4.27 0 0 1-2.553-.852" /></svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.6.376 3.112 1.043 4.453c.178.356.237.763.134 1.148l-.595 2.226a1.3 1.3 0 0 0 1.591 1.592l2.226-.596a1.63 1.63 0 0 1 1.149.133A9.96 9.96 0 0 0 12 22" opacity=".5" /><path fill="currentColor" d="M12.75 8a.75.75 0 0 0-1.5 0v.01c-1.089.275-2 1.133-2 2.323c0 1.457 1.365 2.417 2.75 2.417c.824 0 1.25.533 1.25.917s-.426.916-1.25.916s-1.25-.532-1.25-.916a.75.75 0 0 0-1.5 0c0 1.19.911 2.049 2 2.323V16a.75.75 0 0 0 1.5 0v-.01c1.089-.274 2-1.133 2-2.323c0-1.457-1.365-2.417-2.75-2.417c-.824 0-1.25-.533-1.25-.917s.426-.916 1.25-.916s1.25.532 1.25.916a.75.75 0 0 0 1.5 0c0-1.19-.911-2.048-2-2.323z" /></svg>
                <span className="text-[10px] mt-1">Activity</span>
            </Link>
        </div>
    );
};

export default BottomNav;
