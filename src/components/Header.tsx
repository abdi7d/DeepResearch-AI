import React from 'react';
import { Sparkles, Plus, User, LogOut, History, ShieldCheck } from 'lucide-react';
import { User as UserType } from '../types/client.types.js';

interface HeaderProps {
  user: UserType | null;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenArchitecture: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onNewChat,
  onToggleSidebar,
  onOpenAuth,
  onLogout,
  onOpenArchitecture,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-white/[0.08] bg-[#0A0D12]/75 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      {/* Zone 1: Single text element wordmark with logo emblem */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors"
          title="Toggle conversation history"
        >
          <History className="w-5 h-5" />
        </button>

        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-amber-500/30 shadow-[0_0_15px_rgba(212,175,55,0.15)] flex items-center justify-center bg-neutral-900">
            <img
              src="/src/assets/images/aethelgard_emblem_mark_1791435456992.jpg"
              alt="DeepResearch AI"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback icon container
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <span className="text-base sm:text-lg font-semibold tracking-tight text-white group-hover:text-amber-200/90 transition-colors">
            DeepResearch AI
          </span>
          <span className="hidden sm:inline-block text-[11px] font-medium tracking-wider uppercase px-2 py-0.5 rounded border border-amber-500/20 text-amber-300/80 bg-amber-500/[0.05]">
            Agentic AI Web Research System
          </span>
        </a>
      </div>

      {/* Zone 2: Navigation Links (Clean unboxed text links) */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-400">
        <button
          onClick={onOpenArchitecture}
          className="hover:text-white transition-colors flex items-center gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80" />
          <span>Agentic Architecture</span>
        </button>
        <span className="text-neutral-700">·</span>
        <span className="text-neutral-400">Agent 1: Research</span>
        <span className="text-neutral-700">·</span>
        <span className="text-neutral-400">Agent 2: Synthesis</span>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-lg transition-all hover:border-amber-500/40"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">New Research</span>
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] font-semibold text-amber-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-neutral-300 hidden md:inline max-w-[100px] truncate">
                {user.name}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-white/[0.04] transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-950 bg-amber-300 hover:bg-amber-200 rounded-lg transition-colors shadow-sm"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
