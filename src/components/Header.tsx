import React from 'react';

interface HeaderProps {
  currentTab: 'book' | 'tracking' | 'admin';
  onSelectTab: (tab: 'book' | 'tracking' | 'admin') => void;
  onOpenChat: () => void;
  language: 'en' | 'hi';
  onToggleLanguage: () => void;
  pendingSuggestionsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenChat,
  language,
  onToggleLanguage,
  pendingSuggestionsCount = 0,
}) => {
  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('book')}>
          <div className="relative w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">precision_manufacturing</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
                EasyDrop
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold tracking-wide uppercase">
                Robotics Fleet
              </span>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline-block leading-none mt-1">
              Autonomous doorstep rovers & smart dispatch
            </span>
          </div>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-slate-200">
          <button
            onClick={() => onSelectTab('book')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentTab === 'book'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
            <span>Book Slot</span>
          </button>

          <button
            onClick={() => onSelectTab('tracking')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentTab === 'tracking'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">radar</span>
            <span>Live Rover Track</span>
          </button>

          <button
            onClick={() => onSelectTab('admin')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentTab === 'admin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dashboard_customize</span>
            <span>Dispatcher Desk</span>
            {pendingSuggestionsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                {pendingSuggestionsCount}
              </span>
            )}
          </button>
        </nav>


        {/* Right Actions: Language Switch, DropBot Chat Launcher, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Demo Data Tag */}
          <div className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Demo Data Mode</span>
          </div>

          {/* Bilingual Switch (EN / हिन्दी) */}
          <button
            onClick={onToggleLanguage}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all"
            title="Toggle Language / भाषा बदलें"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">translate</span>
            <span className="font-bold">{language === 'en' ? 'EN' : 'हिन्दी'}</span>
          </button>

          {/* DropBot AI Assistant Button */}
          <button
            onClick={onOpenChat}
            className="relative px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-sm border border-slate-700 active:scale-95 group"
            title="Open DropBot Autonomous Robotics Assistant"
          >
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[13px]">
              <span className="material-symbols-outlined text-[15px]">smart_toy</span>
            </div>
            <span className="hidden sm:inline font-bold">DropBot AI</span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">
              Bilingual
            </span>
          </button>

          {/* Admin shortcut for mobile */}
          <button
            onClick={() => onSelectTab(currentTab === 'admin' ? 'book' : 'admin')}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center border border-slate-200 transition-all"
            title="Dispatcher Portal"
          >
            <span className="material-symbols-outlined text-[19px]">tune</span>
          </button>
        </div>
      </div>
    </header>
  );
};
