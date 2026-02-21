
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
    onReceiveClick: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onReceiveClick }) => {
    const navigate = useNavigate();

    const actions = [
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"><path fill="currentColor" d="M4.892 9.614c0-.402.323-.728.722-.728H9.47c.4 0 .723.326.723.728a.726.726 0 0 1-.723.729H5.614a.726.726 0 0 1-.722-.729" /><path fill="currentColor" fill-rule="evenodd" d="M21.188 10.004q-.094-.005-.2-.004h-2.773C15.944 10 14 11.736 14 14s1.944 4 4.215 4h2.773q.106.001.2-.004c.923-.056 1.739-.757 1.808-1.737c.004-.064.004-.133.004-.197v-4.124c0-.064 0-.133-.004-.197c-.069-.98-.885-1.68-1.808-1.737m-3.217 5.063c.584 0 1.058-.478 1.058-1.067c0-.59-.474-1.067-1.058-1.067s-1.06.478-1.06 1.067c0 .59.475 1.067 1.06 1.067" clip-rule="evenodd" /><path fill="currentColor" d="M21.14 10.002c0-1.181-.044-2.448-.798-3.355a4 4 0 0 0-.233-.256c-.749-.748-1.698-1.08-2.87-1.238C16.099 5 14.644 5 12.806 5h-2.112C8.856 5 7.4 5 6.26 5.153c-1.172.158-2.121.49-2.87 1.238c-.748.749-1.08 1.698-1.238 2.87C2 10.401 2 11.856 2 13.694v.112c0 1.838 0 3.294.153 4.433c.158 1.172.49 2.121 1.238 2.87c.749.748 1.698 1.08 2.87 1.238c1.14.153 2.595.153 4.433.153h2.112c1.838 0 3.294 0 4.433-.153c1.172-.158 2.121-.49 2.87-1.238q.305-.308.526-.66c.45-.72.504-1.602.504-2.45l-.15.001h-2.774C15.944 18 14 16.264 14 14s1.944-4 4.215-4h2.773q.079 0 .151.002" opacity=".5" /><path fill="currentColor" d="M10.101 2.572L8 3.992l-1.733 1.16C7.405 5 8.859 5 10.694 5h2.112c1.838 0 3.294 0 4.433.153q.344.045.662.114L16 4l-2.113-1.428a3.42 3.42 0 0 0-3.786 0" /></svg>,
            label: 'Add',
            action: () => navigate('/add-money')
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" style={{ transform: 'rotate(135deg)' }}><path fill="currentColor" d="M8.037 14.144a.5.5 0 0 1-.68-.244L3.164 4.498c-.667-1.495.815-3.047 2.202-2.306l5.904 3.152c.46.245 1 .245 1.459 0l5.904-3.152c1.387-.741 2.869.81 2.202 2.306l-1.572 3.525a2 2 0 0 1-.932.974z" /><path fill="currentColor" d="M8.61 15.534a.5.5 0 0 0-.234.651l2.151 4.823c.59 1.323 2.355 1.323 2.945 0l3.968-8.898a.5.5 0 0 0-.68-.651z" opacity=".5" /></svg>,
            label: 'Send',
            action: () => navigate('/send')
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"><path fill="currentColor" d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12" opacity=".5" /><path fill="currentColor" d="M3.465 20.536C4.929 22 7.286 22 12 22s7.072 0 8.536-1.465C21.893 19.179 21.993 17.056 22 13h-3.16c-.905 0-1.358 0-1.755.183c-.398.183-.693.527-1.282 1.214l-.605.706c-.59.687-.884 1.031-1.282 1.214s-.85.183-1.755.183h-.321c-.905 0-1.358 0-1.756-.183s-.692-.527-1.281-1.214l-.606-.706c-.589-.687-.883-1.031-1.281-1.214S6.066 13 5.16 13H2c.007 4.055.107 6.179 1.465 7.535m9.065-9.205a.75.75 0 0 1-1.06 0l-3.3-3.3a.75.75 0 1 1 1.06-1.06l2.02 2.02V2h1.5v6.99l2.02-2.02a.75.75 0 1 1 1.06 1.06z" /></svg>,
            label: 'Receive',
            action: onReceiveClick
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"><defs><path id="SVG1WEi9bFG" d="M10.75 9.5a1.25 1.25 0 1 1 2.5 0a1.25 1.25 0 0 1-2.5 0" /></defs><path fill="currentColor" fill-rule="evenodd" d="m21.532 11.586l-.782-.626v10.29H22a.75.75 0 0 1 0 1.5H2a.75.75 0 1 1 0-1.5h1.25V10.96l-.781.626a.75.75 0 1 1-.937-1.172l8.125-6.5a3.75 3.75 0 0 1 4.686 0l8.125 6.5a.75.75 0 1 1-.936 1.172M12 6.75a2.75 2.75 0 1 0 0 5.5a2.75 2.75 0 0 0 0-5.5m1.746 6.562c-.459-.062-1.032-.062-1.697-.062h-.098c-.665 0-1.238 0-1.697.062c-.491.066-.963.215-1.345.597s-.531.854-.597 1.345c-.062.459-.062 1.032-.062 1.697v4.299h7.5v-4.423c0-.612-.004-1.143-.062-1.573c-.066-.491-.215-.963-.597-1.345s-.853-.531-1.345-.597" clip-rule="evenodd" /><g fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" opacity=".5"><use href="#SVG1WEi9bFG" /><use href="#SVG1WEi9bFG" /></g><path fill="currentColor" d="M12.05 13.25c.664 0 1.237 0 1.696.062c.492.066.963.215 1.345.597s.531.853.597 1.345c.058.43.062.96.062 1.573v4.423h-7.5v-4.3c0-.664 0-1.237.062-1.696c.066-.492.215-.963.597-1.345s.854-.531 1.345-.597c.459-.062 1.032-.062 1.697-.062zM16 3h2.5a.5.5 0 0 1 .5.5v4.14l-3.5-2.8V3.5A.5.5 0 0 1 16 3" opacity=".5" /></svg>,
            label: 'Family',
            action: () => navigate('/family')
        },
    ];

    return (
        <div className="grid grid-cols-4 gap-4 mt-10">
            {actions.map((item: any, i) => (
                <button
                    key={i}
                    onClick={item.action}
                    className="flex flex-col items-center gap-3"
                >
                    <div className={`w-14 h-14 border rounded-2xl flex items-center justify-center shadow-lg hover:bg-zinc-800 transition-all active:scale-90 ${item.highlight
                        ? 'gold-gradient text-black border-[#E5D5B3]/30'
                        : 'bg-gradient-to-br from-[#E5D5B3]/10 to-[#E5D5B3]/5 border-white/5 text-[#E5D5B3]'
                        }`}>
                        {item.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.label}</span>
                </button>
            ))}
        </div>
    );
};

export default QuickActions;
