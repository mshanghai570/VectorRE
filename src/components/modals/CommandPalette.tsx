/**
 * VectorRE - Command Palette (⌘K / Ctrl+P)
 * Fast navigation across functions, strings, views, and actions.
 */

import React, { useState, useMemo } from 'react';
import { Search, Code, FileText, Layers, Terminal, Sparkles, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { BinaryFile, FunctionItem, ViewTier } from '../../types/binary';

interface CommandPaletteProps {
  currentBinary: BinaryFile;
  onNavigateAddress: (addr: number) => void;
  onSelectFunction: (fn: FunctionItem) => void;
  onSelectTier: (tier: any) => void;
  onClose: () => void;
  onToggleStringsDock?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  currentBinary,
  onNavigateAddress,
  onSelectFunction,
  onSelectTier,
  onClose,
  onToggleStringsDock
}) => {
  const [query, setQuery] = useState('');

  // Results calculation
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return [
        {
          type: 'action',
          title: 'Toggle Strings Window (Shift+F12)',
          action: () => {
            if (onToggleStringsDock) onToggleStringsDock();
            onClose();
          },
          icon: FileText
        },
        { type: 'view', title: 'Switch to Disassembly View', action: () => onSelectTier('disasm'), icon: Code },
        { type: 'view', title: 'Switch to Control Flow Graph (CFG)', action: () => onSelectTier('graph'), icon: Code },
        { type: 'view', title: 'Switch to Pseudo-C Decompiler', action: () => onSelectTier('pseudo_c'), icon: FileText },
        { type: 'view', title: 'Open Rikugan AI Assistant (Smart Patch & Exploration)', action: () => onSelectTier('rikugan'), icon: Sparkles },
        { type: 'view', title: 'Open Scripting & Automation Console', action: () => onSelectTier('scripting'), icon: Terminal },
        { type: 'view', title: 'Open Plugin Manager', action: () => onSelectTier('plugins'), icon: Layers },
        { type: 'view', title: 'Open Hex Editor & Byte Patcher', action: () => onSelectTier('hex'), icon: Layers }
      ];
    }

    const items: Array<{ type: string; title: string; subtitle?: string; action: () => void; icon: any }> = [];

    // Direct address jump if query looks like hex
    const hexMatch = q.replace(/^0x/, '');
    if (/^[0-9a-f]+$/i.test(hexMatch)) {
      const addr = parseInt(hexMatch, 16);
      items.push({
        type: 'address',
        title: `Jump to address 0x${addr.toString(16)}`,
        subtitle: 'Direct memory navigation',
        action: () => onNavigateAddress(addr),
        icon: Search
      });
    }

    // Matching functions
    currentBinary.functions.forEach((fn) => {
      const name = fn.demangledName || fn.name;
      if (name.toLowerCase().includes(q) || fn.address.toString(16).includes(q)) {
        items.push({
          type: 'function',
          title: name,
          subtitle: `Function @ 0x${fn.address.toString(16)} (${fn.size} bytes)`,
          action: () => {
            onSelectFunction(fn);
            onNavigateAddress(fn.address);
          },
          icon: Code
        });
      }
    });

    // Matching strings
    currentBinary.strings.forEach((str) => {
      if (str.value.toLowerCase().includes(q)) {
        items.push({
          type: 'string',
          title: `"${str.value}"`,
          subtitle: `String in ${str.section} @ 0x${str.address.toString(16)}`,
          action: () => onNavigateAddress(str.address),
          icon: FileText
        });
      }
    });

    return items.slice(0, 15);
  }, [query, currentBinary, onNavigateAddress, onSelectFunction, onSelectTier]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 p-4">
      <div className="bg-[#161822] border border-[#2c3142] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden font-mono text-xs select-none">
        {/* Search Input Bar */}
        <div className="relative border-b border-[#252a38] bg-[#12141c] p-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            type="text"
            placeholder="Search functions, strings, memory addresses, or commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white focus:outline-none text-xs placeholder-slate-500 font-sans"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-[#1e222e] p-1 font-sans">
          {results.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">No matching results found.</div>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="px-3 py-2.5 hover:bg-[#1a1e2b] cursor-pointer transition-colors flex items-center justify-between gap-3 group rounded"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold text-white truncate text-xs">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 shrink-0 transition-colors" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-[#12141c] border-t border-[#232734] text-[10px] text-slate-500 flex items-center justify-between font-sans">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>Esc to close</span>
          </div>
          <span>VectorRE Command Engine</span>
        </div>
      </div>
    </div>
  );
};
