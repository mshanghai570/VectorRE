/**
 * VectorRE - Settings & Preferences Modal (Binary Ninja Style)
 * Configures UI themes, disassembly syntax, graph layout, and FLIRT/Lumina behavior.
 */

import React from 'react';
import { X, Sliders, Palette, Code, ShieldCheck, Check } from 'lucide-react';
import { ThemeName, WorkbenchSettings } from '../../types/binary';

interface SettingsModalProps {
  settings: WorkbenchSettings;
  onUpdateSettings: (newSettings: Partial<WorkbenchSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose
}) => {
  const themes: Array<{ id: ThemeName; name: string; preview: string; desc: string }> = [
    {
      id: 'binja-charcoal',
      name: 'Binary Ninja Charcoal (Default)',
      preview: 'bg-[#1e1e1e] border-amber-500',
      desc: 'Authentic Binary Ninja charcoal palette with amber IL and neon branch vectors.'
    },
    {
      id: 'ida-slate',
      name: 'IDA Pro Slate Dark',
      preview: 'bg-[#181824] border-cyan-500',
      desc: 'IDA Pro modern slate dark theme with cyan code references.'
    },
    {
      id: 'ida-classic',
      name: 'IDA Pro Classic (Win32)',
      preview: 'bg-[#2a2a2a] border-yellow-400',
      desc: 'Classic high contrast Win32 disassembly color scheme for IDA purists.'
    },
    {
      id: 'monokai',
      name: 'Monokai Pro',
      preview: 'bg-[#19181a] border-rose-500',
      desc: 'Vibrant syntax contrast with warm pastels.'
    },
    {
      id: 'macos-midnight',
      name: 'macOS Midnight (Apple Silicon)',
      preview: 'bg-[#0f141c] border-sky-500',
      desc: 'Apple native dark mode aesthetic optimized for Retina displays.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161822] border border-[#2c3142] rounded-xl w-full max-w-2xl flex flex-col max-h-[85vh] shadow-2xl font-sans text-xs select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#252a38] bg-[#12141c] rounded-t-xl">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">Workbench Settings & Preferences</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SECTION 1: THEMES */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs flex items-center gap-2 mb-3">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interface & Color Theme</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {themes.map((t) => {
                const isActive = settings.theme === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => onUpdateSettings({ theme: t.id })}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#1f2433] border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                        : 'bg-[#12141b] border-[#252936] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{t.name}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {t.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: DISASSEMBLY & CODE */}
          <div className="border-t border-[#232734] pt-4 space-y-3">
            <h4 className="font-semibold text-slate-200 text-xs flex items-center gap-2">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>Disassembly & Intermediate Language</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px]">Assembly Syntax</label>
                <select
                  value={settings.syntaxStyle}
                  onChange={(e) => onUpdateSettings({ syntaxStyle: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-[#101217] border border-[#272b3a] rounded text-white text-xs focus:outline-none"
                >
                  <option value="intel">Intel (mov dst, src)</option>
                  <option value="att">AT&T (mov src, dst)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px]">Graph Layout Engine</label>
                <select
                  value={settings.graphLayout}
                  onChange={(e) => onUpdateSettings({ graphLayout: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-[#101217] border border-[#272b3a] rounded text-white text-xs focus:outline-none"
                >
                  <option value="hierarchical">Hierarchical Sugiyama (Binary Ninja)</option>
                  <option value="orthogonal">Orthogonal Routing (IDA Pro)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showHexBytes}
                  onChange={(e) => onUpdateSettings({ showHexBytes: e.target.checked })}
                  className="rounded border-[#272b3a] bg-[#101217] text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300">Show machine hex bytes in linear disassembly</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showAddresses}
                  onChange={(e) => onUpdateSettings({ showAddresses: e.target.checked })}
                  className="rounded border-[#272b3a] bg-[#101217] text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300">Show memory addresses inside CFG basic blocks</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.demangleSymbols}
                  onChange={(e) => onUpdateSettings({ demangleSymbols: e.target.checked })}
                  className="rounded border-[#272b3a] bg-[#101217] text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300">Auto-demangle Swift and C++ function signatures</span>
              </label>
            </div>
          </div>

          {/* SECTION 3: FLIRT & LUMINA */}
          <div className="border-t border-[#232734] pt-4 space-y-3">
            <h4 className="font-semibold text-slate-200 text-xs flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Automated Signature & Lumina Services</span>
            </h4>

            <div>
              <label className="block text-slate-400 mb-1 text-[11px]">Lumina Cloud Server Endpoint</label>
              <input
                type="text"
                value={settings.luminaServerUrl}
                onChange={(e) => onUpdateSettings({ luminaServerUrl: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[#101217] border border-[#272b3a] rounded text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoRunFlirt}
                onChange={(e) => onUpdateSettings({ autoRunFlirt: e.target.checked })}
                className="rounded border-[#272b3a] bg-[#101217] text-cyan-500 focus:ring-0"
              />
              <span className="text-slate-300">Auto-run FLIRT library signature scan on binary load</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#12141c] border-t border-[#232734] rounded-b-xl flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
