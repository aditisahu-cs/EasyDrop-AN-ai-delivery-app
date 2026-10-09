import React from 'react';

interface BottomNavigationProps {
  currentTab: 'book' | 'tracking' | 'admin';
  onSelectTab: (tab: 'book' | 'tracking' | 'admin') => void;
  onOpenChat: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenChat,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-lg pb-safe">
      <div className="flex justify-around items-center h-16 px-3">
        <button
          onClick={() => onSelectTab('book')}
          className={`flex flex-col items-center justify-center min-w-[64px] py-1 transition-all ${
            currentTab === 'book' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">event_available</span>
          <span className="text-[10px] mt-0.5 font-headline">Book</span>
        </button>

        <button
          onClick={() => onSelectTab('tracking')}
          className={`flex flex-col items-center justify-center min-w-[64px] py-1 transition-all ${
            currentTab === 'tracking' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">local_shipping</span>
          <span className="text-[10px] mt-0.5 font-headline">Deliveries</span>
        </button>

        <button
          onClick={() => onSelectTab('admin')}
          className={`flex flex-col items-center justify-center min-w-[64px] py-1 transition-all ${
            currentTab === 'admin' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">dashboard_customize</span>
          <span className="text-[10px] mt-0.5 font-headline">Admin</span>
        </button>

        <button
          onClick={onOpenChat}
          className="flex flex-col items-center justify-center min-w-[64px] py-1 text-slate-800 hover:text-emerald-700 transition-all group"
        >
          <div className="w-6 h-6 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center text-[13px] group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[15px]">smart_toy</span>
          </div>
          <span className="text-[10px] mt-0.5 font-headline font-bold text-slate-700">DropBot</span>
        </button>
      </div>
    </nav>
  );
};

