/**
 * VectorRE - Cross-References (XREFs) Modal
 * Opened via 'X' shortcut or inline link; allows rapid navigation of code and data references.
 */

import React, { useState } from 'react';
import { X, Search, ArrowRight, Link2 } from 'lucide-react';
import { BinaryFile, Xref } from '../../types/binary';

interface XrefModalProps {
  targetAddress: number;
  currentBinary: BinaryFile;
  onNavigateAddress: (addr: number) => void;
  onClose: () => void;
}

export const XrefModal: React.FC<XrefModalProps> = ({
  targetAddress,
  currentBinary,
  onNavigateAddress,
  onClose
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [search, setSearch] = useState('');

  // Find all xrefs targeting or referencing targetAddress
  const matchedXrefs = currentBinary.xrefs.filter((x) => {
    const isTarget = x.targetAddress === targetAddress || x.sourceAddress === targetAddress;
    const matchesType = filterType === 'All' || x.type === filterType;
    const matchesSearch =
      x.instructionPreview.toLowerCase().includes(search.toLowerCase()) ||
      (x.sourceFunction && x.sourceFunction.toLowerCase().includes(search.toLowerCase()));
    return (targetAddress === 0 || isTarget) && matchesType && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161822] border border-[#2b3040] rounded-xl w-full max-w-2xl flex flex-col max-h-[80vh] shadow-2xl font-mono text-xs select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#262b3a] bg-[#12141c] rounded-t-xl">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white text-sm">
              Cross-References {targetAddress !== 0 ? `to 0x${targetAddress.toString(16)}` : 'Directory'}
            </span>
            <span className="text-slate-400 font-sans text-xs">
              ({matchedXrefs.length} found)
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-[#232734] bg-[#14161f] flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search references..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 bg-[#0e1015] border border-[#262b38] rounded text-xs text-white focus:outline-none focus:border-cyan-500"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1 font-sans text-xs">
            {['All', 'CALL', 'READ', 'JUMP'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterType === t ? 'bg-cyan-900/80 text-cyan-300 font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* References Table */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e222e] p-1">
          {matchedXrefs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-sans text-xs">
              No cross-references recorded for address 0x{targetAddress.toString(16)}.
            </div>
          ) : (
            matchedXrefs.map((xref, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onNavigateAddress(xref.sourceAddress);
                  onClose();
                }}
                className="px-4 py-2.5 hover:bg-[#1a1e2b] cursor-pointer transition-colors flex items-center justify-between gap-4 group"
              >
                <div className="flex-1 truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#202534] text-amber-300 font-sans font-semibold">
                      {xref.type}
                    </span>
                    <span className="font-semibold text-cyan-300">
                      {xref.sourceFunction || `loc_${xref.sourceAddress.toString(16)}`}
                    </span>
                    <span className="text-slate-500 text-[11px] tabular-nums">
                      @ 0x{xref.sourceAddress.toString(16)}
                    </span>
                  </div>
                  <div className="text-slate-300 text-xs mt-1 truncate">
                    {xref.instructionPreview}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-500 group-hover:text-cyan-400 transition-colors font-sans text-xs">
                  <span>Jump</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#12141c] border-t border-[#232734] rounded-b-xl text-[11px] text-slate-500 flex items-center justify-between font-sans">
          <span>Click any reference to jump immediately</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};
