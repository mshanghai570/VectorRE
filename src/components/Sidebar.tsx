/**
 * VectorRE - High-Density Sidebar
 * Binary Ninja & IDA Pro dockable explorer:
 * Functions, Symbols, Strings (with instant search & length filter), Sections (with Entropy), and XREFs.
 */

import React, { useState, useMemo } from 'react';
import { Search, Filter, Hash, Database, Link2, SlidersHorizontal, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { BinaryFile, BinaryString, BinarySymbol, FunctionItem, SymbolType, Xref } from '../types/binary';

export type SidebarTab = 'functions' | 'symbols' | 'strings' | 'sections' | 'xrefs';

interface SidebarProps {
  currentBinary: BinaryFile;
  selectedFunction: FunctionItem | null;
  onSelectFunction: (fn: FunctionItem) => void;
  onNavigateAddress: (address: number) => void;
  selectedAddress: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentBinary,
  selectedFunction,
  onSelectFunction,
  onNavigateAddress,
  selectedAddress
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('functions');
  const [funcQuery, setFuncQuery] = useState('');
  const [symbolQuery, setSymbolQuery] = useState('');
  const [symbolTypeFilter, setSymbolTypeFilter] = useState<string>('All');
  const [stringQuery, setStringQuery] = useState('');
  const [stringMinLength, setStringMinLength] = useState(4);
  const [xrefTypeFilter, setXrefTypeFilter] = useState<string>('All');

  // Filtered Functions
  const filteredFunctions = useMemo(() => {
    return currentBinary.functions.filter((fn) => {
      const q = funcQuery.toLowerCase();
      const addrHex = `0x${fn.address.toString(16).toLowerCase()}`;
      return (
        fn.name.toLowerCase().includes(q) ||
        (fn.demangledName && fn.demangledName.toLowerCase().includes(q)) ||
        addrHex.includes(q)
      );
    });
  }, [currentBinary.functions, funcQuery]);

  // Filtered Symbols
  const filteredSymbols = useMemo(() => {
    return currentBinary.symbols.filter((sym) => {
      const q = symbolQuery.toLowerCase();
      const matchesQuery =
        sym.name.toLowerCase().includes(q) ||
        (sym.demangledName && sym.demangledName.toLowerCase().includes(q)) ||
        `0x${sym.address.toString(16).toLowerCase()}`.includes(q);
      const matchesType = symbolTypeFilter === 'All' || sym.type === symbolTypeFilter;
      return matchesQuery && matchesType;
    });
  }, [currentBinary.symbols, symbolQuery, symbolTypeFilter]);

  // Filtered Strings
  const filteredStrings = useMemo(() => {
    return currentBinary.strings.filter((str) => {
      const q = stringQuery.toLowerCase();
      const matchesLength = str.length >= stringMinLength;
      const matchesQuery = str.value.toLowerCase().includes(q) || `0x${str.address.toString(16)}`.includes(q);
      return matchesLength && matchesQuery;
    });
  }, [currentBinary.strings, stringQuery, stringMinLength]);

  // Active Xrefs for the current context (either selected address or selected function)
  const currentXrefs = useMemo(() => {
    const targetAddr = selectedAddress || (selectedFunction ? selectedFunction.address : 0);
    return currentBinary.xrefs.filter((x) => {
      const matchesAddr =
        x.targetAddress === targetAddr ||
        x.sourceAddress === targetAddr ||
        (selectedFunction && x.sourceFunction === selectedFunction.name);
      const matchesType = xrefTypeFilter === 'All' || x.type === xrefTypeFilter;
      return matchesAddr && matchesType;
    });
  }, [currentBinary.xrefs, selectedAddress, selectedFunction, xrefTypeFilter]);

  return (
    <aside className="w-80 bg-[#14161d] border-r border-[#262a35] flex flex-col h-full select-none shrink-0 text-slate-300">
      {/* Sidebar Navigation Tabs */}
      <div className="flex border-b border-[#262a35] bg-[#101217] text-[11px] font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('functions')}
          className={`flex-1 py-2 px-1 text-center transition-colors border-b-2 ${
            activeTab === 'functions' ? 'border-cyan-500 text-cyan-400 bg-[#161820]' : 'border-transparent hover:text-slate-200'
          }`}
        >
          Functions ({currentBinary.functions.length})
        </button>

        <button
          onClick={() => setActiveTab('symbols')}
          className={`flex-1 py-2 px-1 text-center transition-colors border-b-2 ${
            activeTab === 'symbols' ? 'border-cyan-500 text-cyan-400 bg-[#161820]' : 'border-transparent hover:text-slate-200'
          }`}
        >
          Symbols ({currentBinary.symbols.length})
        </button>

        <button
          onClick={() => setActiveTab('strings')}
          className={`flex-1 py-2 px-1 text-center transition-colors border-b-2 ${
            activeTab === 'strings' ? 'border-cyan-500 text-cyan-400 bg-[#161820]' : 'border-transparent hover:text-slate-200'
          }`}
        >
          Strings ({currentBinary.strings.length})
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`flex-1 py-2 px-1 text-center transition-colors border-b-2 ${
            activeTab === 'sections' ? 'border-cyan-500 text-cyan-400 bg-[#161820]' : 'border-transparent hover:text-slate-200'
          }`}
        >
          Sections
        </button>

        <button
          onClick={() => setActiveTab('xrefs')}
          className={`flex-1 py-2 px-1 text-center transition-colors border-b-2 ${
            activeTab === 'xrefs' ? 'border-cyan-500 text-cyan-400 bg-[#161820]' : 'border-transparent hover:text-slate-200'
          }`}
          title="Press X to open XREFs modal"
        >
          XREFs
        </button>
      </div>

      {/* TAB CONTENT: FUNCTIONS */}
      {activeTab === 'functions' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-2 border-b border-[#232732] bg-[#161820]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter functions (⌘F)..."
                value={funcQuery}
                onChange={(e) => setFuncQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-[#0f1116] border border-[#262a36] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#1e222d]">
            {filteredFunctions.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">No functions matching query</div>
            ) : (
              filteredFunctions.map((fn) => {
                const isSelected = selectedFunction?.address === fn.address;
                return (
                  <div
                    key={fn.address}
                    onClick={() => {
                      onSelectFunction(fn);
                      onNavigateAddress(fn.address);
                    }}
                    className={`px-3 py-2 cursor-pointer transition-colors text-xs font-mono flex items-start justify-between gap-2 ${
                      isSelected ? 'bg-[#1e2535] text-cyan-300 border-l-2 border-cyan-400' : 'hover:bg-[#181b24] text-slate-300'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-slate-200 truncate">
                          {fn.demangledName || fn.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="tabular-nums">0x{fn.address.toString(16)}</span>
                        <span>·</span>
                        <span className="tabular-nums">{fn.size}B</span>
                      </div>
                    </div>

                    {/* FLIRT or Lumina badges */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {fn.flirtMatch && (
                        <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50 flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          FLIRT
                        </span>
                      )}
                      {fn.luminaMatch && (
                        <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          Lumina
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SYMBOLS */}
      {activeTab === 'symbols' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-2 border-b border-[#232732] bg-[#161820] flex flex-col gap-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search symbols..."
                value={symbolQuery}
                onChange={(e) => setSymbolQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-[#0f1116] border border-[#262a36] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
              {['All', 'Export', 'Import', 'Function', 'Data'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSymbolTypeFilter(st)}
                  className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
                    symbolTypeFilter === st ? 'bg-cyan-900/70 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#1e222d]">
            {filteredSymbols.map((sym, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateAddress(sym.address)}
                className="px-3 py-2 cursor-pointer hover:bg-[#181b24] transition-colors text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 truncate">{sym.demangledName || sym.name}</span>
                  <span className="text-[10px] text-slate-400 px-1 py-0.2 bg-[#202430] rounded">{sym.type}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="tabular-nums">0x{sym.address.toString(16)}</span>
                  {sym.section && (
                    <>
                      <span>·</span>
                      <span className="truncate">{sym.section}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: STRINGS */}
      {activeTab === 'strings' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-2 border-b border-[#232732] bg-[#161820] flex flex-col gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search strings (min len)..."
                value={stringQuery}
                onChange={(e) => setStringQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-[#0f1116] border border-[#262a36] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Min Length: {stringMinLength}</span>
              <input
                type="range"
                min="3"
                max="20"
                value={stringMinLength}
                onChange={(e) => setStringMinLength(Number(e.target.value))}
                className="w-24 accent-cyan-500 h-1 bg-[#282d3b] rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#1e222d]">
            {filteredStrings.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">No strings found matching filter</div>
            ) : (
              filteredStrings.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateAddress(s.address)}
                  className="px-3 py-2 cursor-pointer hover:bg-[#181b24] transition-colors text-xs font-mono"
                >
                  <div className="text-amber-300 font-medium break-all select-text">
                    "{s.value}"
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                    <span className="tabular-nums">0x{s.address.toString(16)}</span>
                    <span className="text-cyan-400 text-[10px]">
                      {s.xrefCount} {s.xrefCount === 1 ? 'xref' : 'xrefs'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SECTIONS */}
      {activeTab === 'sections' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto divide-y divide-[#1e222d] p-1">
          {currentBinary.sections.map((sec, idx) => {
            const isHighEntropy = sec.entropy > 7.0;
            return (
              <div
                key={idx}
                onClick={() => onNavigateAddress(sec.virtualAddress)}
                className="p-2.5 cursor-pointer hover:bg-[#181b24] rounded transition-colors text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{sec.name}</span>
                  <span className="text-[10px] text-slate-400 px-1.5 py-0.2 bg-[#202430] rounded">
                    {sec.permissions}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span className="tabular-nums">0x{sec.virtualAddress.toString(16)}</span>
                  <span className="tabular-nums">{(sec.size / 1024).toFixed(1)} KB</span>
                </div>
                {/* Shannon Entropy Bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400">Shannon Entropy</span>
                    <span className={`font-semibold tabular-nums ${isHighEntropy ? 'text-rose-400' : 'text-slate-300'}`}>
                      {sec.entropy.toFixed(2)} / 8.0
                    </span>
                  </div>
                  <div className="w-full bg-[#20232d] h-1.5 rounded overflow-hidden">
                    <div
                      className={`h-full rounded ${
                        isHighEntropy ? 'bg-rose-500' : sec.entropy > 5.5 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(sec.entropy / 8.0) * 100}%` }}
                    />
                  </div>
                  {isHighEntropy && (
                    <div className="flex items-center gap-1 text-[10px] text-rose-400 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Likely packed / encrypted payload</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: XREFS */}
      {activeTab === 'xrefs' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-2 border-b border-[#232732] bg-[#161820] flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Cross References</span>
            <div className="flex gap-1 text-[10px]">
              {['All', 'CALL', 'READ', 'JUMP'].map((t) => (
                <button
                  key={t}
                  onClick={() => setXrefTypeFilter(t)}
                  className={`px-1.5 py-0.5 rounded ${
                    xrefTypeFilter === t ? 'bg-cyan-900/80 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#1e222d]">
            {currentXrefs.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">
                No cross references found for 0x{selectedAddress.toString(16)}. Select an instruction or string with xrefs.
              </div>
            ) : (
              currentXrefs.map((xref, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateAddress(xref.sourceAddress)}
                  className="px-3 py-2 cursor-pointer hover:bg-[#181b24] transition-colors text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-300">
                      {xref.sourceFunction || `loc_${xref.sourceAddress.toString(16)}`}
                    </span>
                    <span className="text-[10px] px-1 py-0.2 bg-[#202430] text-amber-300 rounded">
                      {xref.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-1">
                    {xref.instructionPreview}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span>from 0x{xref.sourceAddress.toString(16)}</span>
                    <span>→</span>
                    <span>to 0x{xref.targetAddress.toString(16)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
