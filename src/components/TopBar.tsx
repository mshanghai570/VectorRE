/**
 * VectorRE - Top Bar Navigation
 * Strictly complies with the Top Bar Contract:
 * [Zone 1: Brand title, one line] — [Zone 2: 4-5 single-line nav links] — [Zone 3: 1 primary action]
 */

import React from 'react';
import { Cpu, Terminal, Search, Settings as SettingsIcon, Upload, Layers } from 'lucide-react';
import { BinaryFile, ViewTier } from '../types/binary';

interface TopBarProps {
  currentBinary: BinaryFile;
  activeTier: ViewTier | 'flirt_lumina' | 'scripting' | 'plugins' | 'hex' | 'entropy' | 'rikugan';
  setActiveTier: (tier: any) => void;
  onOpenCommandPalette: () => void;
  onOpenSettings: () => void;
  onOpenUpload: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentBinary,
  activeTier,
  setActiveTier,
  onOpenCommandPalette,
  onOpenSettings,
  onOpenUpload
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-5 py-2.5 bg-[#16181d] border-b border-[#282c37] text-slate-200 select-none shrink-0 z-30">
      {/* Zone 1: Single text wordmark with architecture indicator */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <a href="/" className="text-base font-bold tracking-tight text-white flex items-center gap-2 hover:text-cyan-400 transition-colors">
          <span className="w-6 h-6 rounded bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-xs font-mono font-bold text-white shadow-sm">
            VR
          </span>
          <span className="tracking-wide">VectorRE</span>
        </a>
        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
          {currentBinary.format} · {currentBinary.architecture.split(' ')[0]}
        </span>
      </div>

      {/* Zone 2: Single-line clean navigation links */}
      <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveTier('disasm')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap shrink-0 ${
            activeTier === 'disasm' ? 'bg-[#252a36] text-cyan-400 font-semibold' : 'hover:text-slate-200 hover:bg-[#1f232d]'
          }`}
        >
          Disassembly
        </button>

        <button
          onClick={() => setActiveTier('graph')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap shrink-0 ${
            activeTier === 'graph' ? 'bg-[#252a36] text-cyan-400 font-semibold' : 'hover:text-slate-200 hover:bg-[#1f232d]'
          }`}
          title="Press Space to toggle"
        >
          Graph CFG
        </button>

        <button
          onClick={() => setActiveTier('llil')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap shrink-0 ${
            activeTier === 'llil' || activeTier === 'mlil' || activeTier === 'hlil'
              ? 'bg-[#252a36] text-amber-400 font-semibold'
              : 'hover:text-slate-200 hover:bg-[#1f232d]'
          }`}
        >
          IL Tiers
        </button>

        <button
          onClick={() => setActiveTier('pseudo_c')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap shrink-0 ${
            activeTier === 'pseudo_c' ? 'bg-[#252a36] text-emerald-400 font-semibold' : 'hover:text-slate-200 hover:bg-[#1f232d]'
          }`}
          title="Press Tab to toggle"
        >
          Pseudo C
        </button>

        <button
          onClick={() => setActiveTier('flirt_lumina')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap shrink-0 ${
            activeTier === 'flirt_lumina' ? 'bg-[#252a36] text-purple-400 font-semibold' : 'hover:text-slate-200 hover:bg-[#1f232d]'
          }`}
        >
          FLIRT & Lumina
        </button>

        <button
          onClick={() => setActiveTier('scripting')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap shrink-0 ${
            activeTier === 'scripting' ? 'bg-[#252a36] text-cyan-400 font-semibold' : 'hover:text-slate-200 hover:bg-[#1f232d]'
          }`}
        >
          Scripting & SDK
        </button>

        <button
          onClick={() => setActiveTier('plugins')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap shrink-0 ${
            activeTier === 'plugins' ? 'bg-[#252a36] text-cyan-400 font-semibold' : 'hover:text-slate-200 hover:bg-[#1f232d]'
          }`}
        >
          Plugins
        </button>

        <button
          onClick={() => setActiveTier('rikugan')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap shrink-0 ${
            activeTier === 'rikugan'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold shadow-sm'
              : 'hover:text-white hover:bg-[#1f232d] text-cyan-400 font-medium'
          }`}
          title="Rikugan AI Reverse Engineering Assistant"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Rikugan AI</span>
        </button>
      </nav>

      {/* Zone 3: Primary action & utility affordances */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 bg-[#20242f] hover:bg-[#282d3b] hover:text-slate-200 rounded border border-[#313746] transition-colors"
          title="Command Palette (⌘K or Ctrl+P)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Search</span>
          <kbd className="hidden sm:inline px-1 py-0.2 bg-[#12141a] rounded text-[10px] text-slate-400 font-mono">⌘K</kbd>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#222733] rounded transition-colors"
          title="Settings & Themes"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Open Binary</span>
        </button>
      </div>
    </header>
  );
};
