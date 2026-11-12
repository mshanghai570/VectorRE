/**
 * VectorRE - Intermediate Language (IL) View
 * Binary Ninja's core architectural strength:
 * Allows inspecting LLIL (Low Level IL), MLIL (Medium Level IL SSA), and HLIL (High Level IL).
 */

import React, { useState } from 'react';
import { Layers, GitBranch, Terminal, Shield, ArrowRight } from 'lucide-react';
import { FunctionItem, ILInstruction } from '../../types/binary';

export type ILTier = 'llil' | 'mlil' | 'hlil';

interface ILViewProps {
  selectedFunction: FunctionItem | null;
  onNavigateAddress: (addr: number) => void;
}

export const ILView: React.FC<ILViewProps> = ({ selectedFunction, onNavigateAddress }) => {
  const [activeTier, setActiveTier] = useState<ILTier>('mlil');

  if (!selectedFunction) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs">
        No function selected. Choose a function from the sidebar to inspect its Intermediate Language tiers.
      </div>
    );
  }

  const renderSsaTokens = (text: string) => {
    // SSA variable regex e.g. var_10#1 or rax#0
    const parts = text.split(/([a-zA-Z0-9_]+#[0-9]+)/);
    return parts.map((part, idx) => {
      if (/#([0-9]+)/.test(part)) {
        return (
          <span key={idx} className="text-amber-300 font-semibold px-1 py-0.2 bg-amber-950/40 rounded border border-amber-800/40">
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#111318] font-mono text-xs text-slate-300 select-none">
      {/* IL Tier Switcher Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#171922] border-b border-[#272b38] shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-100">
            {selectedFunction.demangledName || selectedFunction.name}
          </span>
          <span className="text-[11px] text-slate-500">
            Intermediate Representation
          </span>
        </div>

        {/* Tier Buttons */}
        <div className="flex items-center gap-1 bg-[#101217] p-1 rounded-lg border border-[#272b38]">
          <button
            onClick={() => setActiveTier('llil')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTier === 'llil'
                ? 'bg-[#242938] text-amber-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Low Level IL (LLIL)
          </button>

          <button
            onClick={() => setActiveTier('mlil')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTier === 'mlil'
                ? 'bg-[#242938] text-amber-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Medium Level IL (MLIL SSA)
          </button>

          <button
            onClick={() => setActiveTier('hlil')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTier === 'hlil'
                ? 'bg-[#242938] text-amber-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            High Level IL (HLIL)
          </button>
        </div>
      </div>

      {/* IL Content Table / Editor */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {activeTier === 'llil' && (
          <div className="divide-y divide-[#1d212c]">
            {selectedFunction.llil.map((ins) => (
              <div
                key={ins.index}
                onClick={() => onNavigateAddress(ins.address)}
                className="py-1.5 px-3 hover:bg-[#181c26] rounded cursor-pointer flex items-center gap-4 transition-colors group"
              >
                <span className="text-slate-500 w-8 text-right tabular-nums text-[11px]">
                  {ins.index}
                </span>
                <span className="text-slate-500 w-28 tabular-nums">
                  0x{ins.address.toString(16)}
                </span>
                <span className="text-slate-200 flex-1 group-hover:text-amber-300 transition-colors">
                  {ins.ilText}
                </span>
                {ins.operation && (
                  <span className="text-[10px] text-slate-500 px-1.5 py-0.2 bg-[#202430] rounded">
                    {ins.operation}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTier === 'mlil' && (
          <div className="divide-y divide-[#1d212c]">
            {selectedFunction.mlil.map((ins) => (
              <div
                key={ins.index}
                onClick={() => onNavigateAddress(ins.address)}
                className="py-1.5 px-3 hover:bg-[#181c26] rounded cursor-pointer flex items-center gap-4 transition-colors group"
              >
                <span className="text-slate-500 w-8 text-right tabular-nums text-[11px]">
                  {ins.index}
                </span>
                <span className="text-slate-500 w-28 tabular-nums">
                  0x{ins.address.toString(16)}
                </span>
                <span className="text-slate-200 flex-1 group-hover:text-amber-300 transition-colors">
                  {renderSsaTokens(ins.ilText)}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTier === 'hlil' && (
          <div className="bg-[#14161f] p-4 rounded-md border border-[#242938] leading-relaxed">
            {selectedFunction.hlil.map((line, idx) => (
              <div key={idx} className="flex items-start gap-4 hover:bg-[#1c202d] px-2 py-0.5 rounded">
                <span className="text-slate-600 w-8 text-right select-none text-[11px] tabular-nums">
                  {idx + 1}
                </span>
                <pre className="text-slate-200 font-mono whitespace-pre">{line}</pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-[#141720] border-t border-[#242938] text-[11px] text-slate-500 flex items-center justify-between">
        <span>Active Tier: {activeTier.toUpperCase()}</span>
        <span>Binary Ninja Architecture Pipeline: LLIL → MLIL SSA → HLIL → Pseudo-C</span>
      </div>
    </div>
  );
};
