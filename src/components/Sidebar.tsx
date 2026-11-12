/**
 * VectorRE - High-Density Dockable & Adjustable Sidebar
 * Binary Ninja & IDA Pro dockable explorer with:
 * - Adjustable sidebar width (drag handle & collapse toggle)
 * - Dual split panes (Functions on top, Strings on bottom) with draggable vertical splitter
 * - Quick splitter presets: 30/70 (Strings focus), 50/50 (Balanced), 70/30 (Functions focus)
 * - Compact density mode ("smaller" single-line rows so functions don't take over)
 * - Tabbed or Split mode toggle
 * - Pop-out Strings to Bottom Dock (Shift+F12)
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Hash,
  Database,
  Link2,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  GripHorizontal,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  ArrowUpDown,
  Copy,
  Check,
  Maximize,
  ExternalLink,
  Layers,
  ArrowRightLeft,
  X
} from 'lucide-react';
import { BinaryFile, BinaryString, BinarySymbol, FunctionItem, SymbolType, Xref } from '../types/binary';

export type SidebarTab = 'functions' | 'symbols' | 'strings' | 'sections' | 'xrefs';

interface SidebarProps {
  currentBinary: BinaryFile;
  selectedFunction: FunctionItem | null;
  onSelectFunction: (fn: FunctionItem) => void;
  onNavigateAddress: (address: number) => void;
  selectedAddress: number;
  onToggleBottomStringsDock?: () => void;
  isBottomStringsDockOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentBinary,
  selectedFunction,
  onSelectFunction,
  onNavigateAddress,
  selectedAddress,
  onToggleBottomStringsDock,
  isBottomStringsDockOpen
}) => {
  // Layout states
  const [layoutMode, setLayoutMode] = useState<'split' | 'tabs'>('split');
  const [topTab, setTopTab] = useState<'functions' | 'symbols'>('functions');
  const [bottomTab, setBottomTab] = useState<'strings' | 'xrefs' | 'sections'>('strings');
  const [activeSingleTab, setActiveSingleTab] = useState<SidebarTab>('functions');

  // Adjustable dimensions
  const [sidebarWidth, setSidebarWidth] = useState<number>(310);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [splitPercent, setSplitPercent] = useState<number>(45); // 45% top (functions), 55% bottom (strings)
  const [density, setDensity] = useState<'compact' | 'normal'>('compact'); // Default to compact so functions don't dominate!
  const [isSwapped, setIsSwapped] = useState<boolean>(false); // Swap top and bottom panes

  // Search & filter states
  const [funcQuery, setFuncQuery] = useState('');
  const [symbolQuery, setSymbolQuery] = useState('');
  const [symbolTypeFilter, setSymbolTypeFilter] = useState<string>('All');
  const [stringQuery, setStringQuery] = useState('');
  const [stringMinLength, setStringMinLength] = useState<number>(4);
  const [xrefTypeFilter, setXrefTypeFilter] = useState<string>('All');
  const [copiedStringAddr, setCopiedStringAddr] = useState<number | null>(null);

  // Dragging refs
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingWidthRef = useRef(false);
  const isDraggingSplitRef = useRef(false);

  // Horizontal width drag handler
  const handleWidthMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingWidthRef.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingWidthRef.current) return;
      const newWidth = Math.min(Math.max(startWidth + (moveEvent.clientX - startX), 210), 580);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDraggingWidthRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Vertical split divider drag handler
  const handleSplitMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSplitRef.current = true;
    const container = sidebarContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const containerTop = rect.top;
    const containerHeight = rect.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingSplitRef.current) return;
      const relativeY = moveEvent.clientY - containerTop;
      const pct = Math.min(Math.max(Math.round((relativeY / containerHeight) * 100), 18), 82);
      setSplitPercent(pct);
    };

    const handleMouseUp = () => {
      isDraggingSplitRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

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
      const matchesQuery =
        !q ||
        str.value.toLowerCase().includes(q) ||
        `0x${str.address.toString(16)}`.includes(q);
      return matchesLength && matchesQuery;
    });
  }, [currentBinary.strings, stringQuery, stringMinLength]);

  // Active Xrefs
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

  const handleCopyStringValue = (str: BinaryString, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(str.value);
    setCopiedStringAddr(str.address);
    setTimeout(() => setCopiedStringAddr(null), 1200);
  };

  // Render Functions List Component
  const renderFunctionsList = () => (
    <div className="flex flex-col flex-1 min-h-0 bg-[#13151c]">
      {/* Search Bar */}
      <div className="px-2 py-1.5 border-b border-[#232732] bg-[#161820] flex items-center gap-1.5 shrink-0">
        <div className="relative flex-1">
          <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter functions (⌘F)..."
            value={funcQuery}
            onChange={(e) => setFuncQuery(e.target.value)}
            className="w-full pl-7 pr-5 py-1 bg-[#0f1116] border border-[#262a36] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
          {funcQuery && (
            <button
              onClick={() => setFuncQuery('')}
              className="absolute right-1.5 top-1.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
          {filteredFunctions.length}/{currentBinary.functions.length}
        </span>
      </div>

      {/* Function Items Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e222d]/70">
        {filteredFunctions.length === 0 ? (
          <div className="p-4 text-xs text-slate-500 text-center">No functions matching query</div>
        ) : (
          filteredFunctions.map((fn) => {
            const isSelected = selectedFunction?.address === fn.address;
            const displayName = fn.demangledName || fn.name;

            if (density === 'compact') {
              return (
                <div
                  key={fn.address}
                  onClick={() => {
                    onSelectFunction(fn);
                    onNavigateAddress(fn.address);
                  }}
                  title={`${displayName} @ 0x${fn.address.toString(16)} (${fn.size}B)`}
                  className={`px-2 py-1 cursor-pointer transition-colors text-[11px] font-mono flex items-center justify-between gap-1.5 border-l-2 ${
                    isSelected
                      ? 'bg-[#1e2535] text-cyan-300 border-cyan-400 font-semibold'
                      : 'hover:bg-[#181b24] text-slate-300 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                    <span className="text-slate-500 text-[10px] tabular-nums shrink-0">
                      0x{fn.address.toString(16).slice(-6)}
                    </span>
                    <span className="truncate text-slate-200">{displayName}</span>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    <span className="text-[9px] text-slate-500 tabular-nums">
                      {fn.size}B
                    </span>
                    {fn.flirtMatch && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" title="FLIRT match" />
                    )}
                    {fn.luminaMatch && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="Lumina match" />
                    )}
                  </div>
                </div>
              );
            }

            // Normal density
            return (
              <div
                key={fn.address}
                onClick={() => {
                  onSelectFunction(fn);
                  onNavigateAddress(fn.address);
                }}
                className={`px-2.5 py-1.5 cursor-pointer transition-colors text-xs font-mono flex items-start justify-between gap-2 border-l-2 ${
                  isSelected
                    ? 'bg-[#1e2535] text-cyan-300 border-cyan-400'
                    : 'hover:bg-[#181b24] text-slate-300 border-transparent'
                }`}
              >
                <div className="truncate flex-1 min-w-0">
                  <div className="truncate font-semibold text-slate-200">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="tabular-nums">0x{fn.address.toString(16)}</span>
                    <span>·</span>
                    <span className="tabular-nums">{fn.size} bytes</span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  {fn.flirtMatch && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50 flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      FLIRT
                    </span>
                  )}
                  {fn.luminaMatch && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 flex items-center gap-0.5">
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
  );

  // Render Symbols List Component
  const renderSymbolsList = () => (
    <div className="flex flex-col flex-1 min-h-0 bg-[#13151c]">
      <div className="p-1.5 border-b border-[#232732] bg-[#161820] flex flex-col gap-1 shrink-0">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={symbolQuery}
            onChange={(e) => setSymbolQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 bg-[#0f1116] border border-[#262a36] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto text-[10px] pb-0.5">
          {['All', 'Export', 'Import', 'Function', 'Data'].map((st) => (
            <button
              key={st}
              onClick={() => setSymbolTypeFilter(st)}
              className={`px-1.5 py-0.2 rounded whitespace-nowrap transition-colors ${
                symbolTypeFilter === st ? 'bg-cyan-900/70 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[#1e222d]/70">
        {filteredSymbols.map((sym, idx) => (
          <div
            key={idx}
            onClick={() => onNavigateAddress(sym.address)}
            className="px-2.5 py-1.5 cursor-pointer hover:bg-[#181b24] transition-colors text-xs font-mono"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 truncate">{sym.demangledName || sym.name}</span>
              <span className="text-[9px] text-slate-400 px-1 py-0.2 bg-[#202430] rounded">{sym.type}</span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
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
  );

  // Render Strings List Component
  const renderStringsList = () => (
    <div className="flex flex-col flex-1 min-h-0 bg-[#13151c]">
      {/* Strings Controls & Filter Header */}
      <div className="p-1.5 border-b border-[#232732] bg-[#161820] flex flex-col gap-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
            <input
              type="text"
              placeholder="Search strings..."
              value={stringQuery}
              onChange={(e) => setStringQuery(e.target.value)}
              className="w-full pl-7 pr-5 py-1 bg-[#0f1116] border border-[#262a36] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            {stringQuery && (
              <button
                onClick={() => setStringQuery('')}
                className="absolute right-1.5 top-1.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Pop-out to bottom dock button */}
          {onToggleBottomStringsDock && (
            <button
              onClick={onToggleBottomStringsDock}
              className={`p-1 rounded text-xs border transition-colors shrink-0 ${
                isBottomStringsDockOpen
                  ? 'bg-amber-950/80 text-amber-300 border-amber-600/50'
                  : 'bg-[#1b1f2b] text-slate-400 hover:text-amber-300 border-[#262b3a]'
              }`}
              title="Pop out Strings to Bottom Dock (Shift+F12)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Length Filters */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Min:</span>
            {[3, 4, 8, 16].map((len) => (
              <button
                key={len}
                onClick={() => setStringMinLength(len)}
                className={`px-1.5 py-0.2 rounded transition-colors ${
                  stringMinLength === len
                    ? 'bg-amber-900/60 text-amber-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200 bg-[#1e222e]'
                }`}
              >
                ≥{len}
              </button>
            ))}
          </div>

          <span className="text-amber-300 font-medium tabular-nums">
            {filteredStrings.length} found
          </span>
        </div>
      </div>

      {/* Strings Scroll List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e222d]/70">
        {filteredStrings.length === 0 ? (
          <div className="p-4 text-xs text-slate-500 text-center">No strings found matching filter</div>
        ) : (
          filteredStrings.map((s, idx) => {
            const isCopied = copiedStringAddr === s.address;

            if (density === 'compact') {
              return (
                <div
                  key={idx}
                  onClick={() => onNavigateAddress(s.address)}
                  title={`"${s.value}" @ 0x${s.address.toString(16)} (${s.xrefCount} xrefs)`}
                  className="group px-2 py-1 cursor-pointer hover:bg-[#181b24] transition-colors text-[11px] font-mono flex items-center justify-between gap-1.5"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                    <span className="text-slate-500 text-[10px] tabular-nums shrink-0">
                      0x{s.address.toString(16).slice(-6)}
                    </span>
                    <span className="text-amber-300 truncate font-mono select-text">
                      "{s.value}"
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    {s.xrefCount > 0 && (
                      <span className="text-[9px] text-cyan-400 px-1 py-0.2 bg-[#1b2230] rounded tabular-nums">
                        {s.xrefCount}x
                      </span>
                    )}
                    <button
                      onClick={(e) => handleCopyStringValue(s, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-200 transition-opacity"
                      title="Copy string"
                    >
                      {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    </button>
                  </div>
                </div>
              );
            }

            // Normal density
            return (
              <div
                key={idx}
                onClick={() => onNavigateAddress(s.address)}
                className="group px-2.5 py-1.5 cursor-pointer hover:bg-[#181b24] transition-colors text-xs font-mono"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="text-amber-300 font-medium break-all select-text flex-1">
                    "{s.value}"
                  </div>
                  <button
                    onClick={(e) => handleCopyStringValue(s, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-200 transition-opacity shrink-0"
                    title="Copy string"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                  <span className="tabular-nums">0x{s.address.toString(16)}</span>
                  <span className="text-cyan-400 text-[10px]">
                    {s.xrefCount} {s.xrefCount === 1 ? 'xref' : 'xrefs'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Render Sections List Component
  const renderSectionsList = () => (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto divide-y divide-[#1e222d] p-1 bg-[#13151c]">
      {currentBinary.sections.map((sec, idx) => {
        const isHighEntropy = sec.entropy > 7.0;
        return (
          <div
            key={idx}
            onClick={() => onNavigateAddress(sec.virtualAddress)}
            className="p-2 cursor-pointer hover:bg-[#181b24] rounded transition-colors text-xs font-mono"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">{sec.name}</span>
              <span className="text-[9px] text-slate-400 px-1 py-0.2 bg-[#202430] rounded">
                {sec.permissions}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span className="tabular-nums">0x{sec.virtualAddress.toString(16)}</span>
              <span className="tabular-nums">{(sec.size / 1024).toFixed(1)} KB</span>
            </div>
            {/* Entropy bar */}
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[9px] mb-0.5">
                <span className="text-slate-400">Entropy</span>
                <span className={`font-semibold tabular-nums ${isHighEntropy ? 'text-rose-400' : 'text-slate-300'}`}>
                  {sec.entropy.toFixed(2)}/8.0
                </span>
              </div>
              <div className="w-full bg-[#20232d] h-1 rounded overflow-hidden">
                <div
                  className={`h-full rounded ${
                    isHighEntropy ? 'bg-rose-500' : sec.entropy > 5.5 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(sec.entropy / 8.0) * 100}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render XREFs List Component
  const renderXrefsList = () => (
    <div className="flex flex-col flex-1 min-h-0 bg-[#13151c]">
      <div className="p-1.5 border-b border-[#232732] bg-[#161820] flex items-center justify-between text-xs shrink-0">
        <span className="text-slate-400 font-medium text-[11px]">XREFs @ 0x{selectedAddress.toString(16)}</span>
        <div className="flex gap-1 text-[9px]">
          {['All', 'CALL', 'READ', 'JUMP'].map((t) => (
            <button
              key={t}
              onClick={() => setXrefTypeFilter(t)}
              className={`px-1 py-0.2 rounded ${
                xrefTypeFilter === t ? 'bg-cyan-900/80 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[#1e222d]/70">
        {currentXrefs.length === 0 ? (
          <div className="p-4 text-xs text-slate-500 text-center">
            No cross references for 0x{selectedAddress.toString(16)}.
          </div>
        ) : (
          currentXrefs.map((xref, idx) => (
            <div
              key={idx}
              onClick={() => onNavigateAddress(xref.sourceAddress)}
              className="px-2.5 py-1.5 cursor-pointer hover:bg-[#181b24] transition-colors text-xs font-mono"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-300 text-[11px]">
                  {xref.sourceFunction || `loc_${xref.sourceAddress.toString(16)}`}
                </span>
                <span className="text-[9px] px-1 py-0.2 bg-[#202430] text-amber-300 rounded">
                  {xref.type}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {xref.instructionPreview}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Map tab name to component
  const renderContentForTab = (tab: SidebarTab) => {
    switch (tab) {
      case 'functions':
        return renderFunctionsList();
      case 'symbols':
        return renderSymbolsList();
      case 'strings':
        return renderStringsList();
      case 'sections':
        return renderSectionsList();
      case 'xrefs':
        return renderXrefsList();
      default:
        return renderFunctionsList();
    }
  };

  // If collapsed to mini rail
  if (isCollapsed) {
    return (
      <aside className="w-10 bg-[#12141a] border-r border-[#262a35] flex flex-col items-center py-2 text-slate-400 select-none shrink-0 z-20">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 hover:text-cyan-400 hover:bg-[#1b1f2c] rounded transition-colors"
          title="Expand Explorer Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="mt-4 flex flex-col gap-3 text-xs">
          <button
            onClick={() => {
              setIsCollapsed(false);
              setLayoutMode('split');
            }}
            className="p-1 hover:text-cyan-400"
            title="Open Split View (Functions & Strings)"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false);
              setBottomTab('strings');
            }}
            className="p-1 hover:text-amber-400"
            title="Open Strings"
          >
            <span className="font-bold text-[10px]">STR</span>
          </button>
        </div>
      </aside>
    );
  }

  // Active top and bottom tabs (respecting swap if enabled)
  const currentTopView = isSwapped ? bottomTab : topTab;
  const currentBottomView = isSwapped ? topTab : bottomTab;

  return (
    <aside
      ref={sidebarContainerRef}
      style={{ width: sidebarWidth }}
      className="bg-[#12141a] border-r border-[#262a35] flex flex-col h-full select-none shrink-0 text-slate-300 relative z-20 transition-[width] duration-75"
    >
      {/* Sidebar Master Header Bar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0f1116] border-b border-[#232732] text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-white tracking-tight flex items-center gap-1">
            <span>Explorer</span>
          </span>

          {/* Mode Switcher: Split vs Tabbed */}
          <div className="flex items-center bg-[#181b24] p-0.5 rounded border border-[#272b38] ml-1">
            <button
              onClick={() => setLayoutMode('split')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                layoutMode === 'split' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split View: Functions & Strings visible simultaneously"
            >
              Split
            </button>
            <button
              onClick={() => setLayoutMode('tabs')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                layoutMode === 'tabs' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tabbed View: Single full-height tab"
            >
              Tabs
            </button>
          </div>
        </div>

        {/* Toolbar Affordances: Density, Swap, Collapse */}
        <div className="flex items-center gap-1">
          {/* Density button: Compact vs Normal ("smaller" option) */}
          <button
            onClick={() => setDensity((d) => (d === 'compact' ? 'normal' : 'compact'))}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors ${
              density === 'compact'
                ? 'bg-[#1e2535] text-cyan-300 border-cyan-700/50'
                : 'bg-[#161820] text-slate-400 border-[#262a36] hover:text-slate-200'
            }`}
            title={density === 'compact' ? 'Switch to Normal density' : 'Switch to Compact density ("smaller" rows)'}
          >
            {density === 'compact' ? 'Compact' : 'Normal'}
          </button>

          {layoutMode === 'split' && (
            <button
              onClick={() => setIsSwapped(!isSwapped)}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#1b1f2b] rounded transition-colors"
              title="Swap Top and Bottom Panes (put Strings on top)"
            >
              <ArrowRightLeft className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#1b1f2b] rounded transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MODE 1: TABBED MODE (Single full-height window) */}
      {layoutMode === 'tabs' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Tabs selector */}
          <div className="flex border-b border-[#232732] bg-[#14161f] text-[11px] font-medium text-slate-400 shrink-0">
            <button
              onClick={() => setActiveSingleTab('functions')}
              className={`flex-1 py-1.5 px-1 text-center transition-colors border-b-2 ${
                activeSingleTab === 'functions'
                  ? 'border-cyan-500 text-cyan-400 bg-[#171a24]'
                  : 'border-transparent hover:text-slate-200'
              }`}
            >
              Functions ({currentBinary.functions.length})
            </button>

            <button
              onClick={() => setActiveSingleTab('strings')}
              className={`flex-1 py-1.5 px-1 text-center transition-colors border-b-2 ${
                activeSingleTab === 'strings'
                  ? 'border-amber-500 text-amber-300 bg-[#171a24]'
                  : 'border-transparent hover:text-slate-200'
              }`}
            >
              Strings ({currentBinary.strings.length})
            </button>

            <button
              onClick={() => setActiveSingleTab('symbols')}
              className={`flex-1 py-1.5 px-1 text-center transition-colors border-b-2 ${
                activeSingleTab === 'symbols'
                  ? 'border-cyan-500 text-cyan-400 bg-[#171a24]'
                  : 'border-transparent hover:text-slate-200'
              }`}
            >
              Symbols
            </button>

            <button
              onClick={() => setActiveSingleTab('xrefs')}
              className={`flex-1 py-1.5 px-1 text-center transition-colors border-b-2 ${
                activeSingleTab === 'xrefs'
                  ? 'border-purple-500 text-purple-300 bg-[#171a24]'
                  : 'border-transparent hover:text-slate-200'
              }`}
            >
              XREFs
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 min-h-0 flex flex-col">
            {renderContentForTab(activeSingleTab)}
          </div>
        </div>
      )}

      {/* MODE 2: SPLIT VIEW MODE (Adjustable Upper & Lower Windows) */}
      {layoutMode === 'split' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* TOP PANE */}
          <div
            style={{ height: `${splitPercent}%` }}
            className="flex flex-col min-h-[90px] overflow-hidden"
          >
            {/* Top Pane Header / Subtabs */}
            <div className="flex items-center justify-between px-2 py-1 bg-[#151720] border-b border-[#232732] text-[11px] font-medium text-slate-400 shrink-0">
              <div className="flex items-center gap-1">
                {isSwapped ? (
                  <>
                    <button
                      onClick={() => setBottomTab('strings')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        bottomTab === 'strings' ? 'bg-[#202533] text-amber-300 font-semibold' : 'hover:text-slate-200'
                      }`}
                    >
                      Strings ({currentBinary.strings.length})
                    </button>
                    <button
                      onClick={() => setBottomTab('xrefs')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        bottomTab === 'xrefs' ? 'bg-[#202533] text-purple-300 font-semibold' : 'hover:text-slate-200'
                      }`}
                    >
                      XREFs
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setTopTab('functions')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        topTab === 'functions' ? 'bg-[#202533] text-cyan-300 font-semibold' : 'hover:text-slate-200'
                      }`}
                    >
                      Functions ({currentBinary.functions.length})
                    </button>
                    <button
                      onClick={() => setTopTab('symbols')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        topTab === 'symbols' ? 'bg-[#202533] text-slate-200 font-semibold' : 'hover:text-slate-200'
                      }`}
                    >
                      Symbols ({currentBinary.symbols.length})
                    </button>
                  </>
                )}
              </div>

              {/* Quick Split Ratio Preset: 30% Top (Makes Functions Smaller!) */}
              <button
                onClick={() => setSplitPercent(30)}
                className="text-[9px] text-slate-500 hover:text-cyan-300 px-1 rounded hover:bg-[#1f2330]"
                title="Make Top Pane smaller (30% height)"
              >
                Compact (30%)
              </button>
            </div>

            {/* Top Pane Content */}
            <div className="flex-1 min-h-0 flex flex-col">
              {renderContentForTab(currentTopView as SidebarTab)}
            </div>
          </div>

          {/* INTERACTIVE DRAGGABLE HORIZONTAL SPLITTER BAR */}
          <div
            onMouseDown={handleSplitMouseDown}
            className="h-2.5 bg-[#171a24] hover:bg-cyan-600/40 active:bg-cyan-500 cursor-row-resize border-y border-[#262b3a] flex items-center justify-between px-2 shrink-0 transition-colors group select-none"
            title="Drag up or down to adjust window heights"
          >
            {/* Quick preset 30/70 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSplitPercent(30);
              }}
              className="text-[9px] text-slate-500 hover:text-amber-300 transition-colors px-1 rounded hover:bg-[#202636]"
              title="Strings Focus (30% Functions / 70% Strings)"
            >
              30/70
            </button>

            {/* Grip handle in center */}
            <div className="flex items-center gap-1 text-[9px] text-slate-500 group-hover:text-cyan-300">
              <GripHorizontal className="w-3.5 h-3.5" />
              <span className="tabular-nums font-mono text-[9px]">
                {splitPercent}% / {100 - splitPercent}%
              </span>
            </div>

            {/* Quick preset 50/50 & 70/30 */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSplitPercent(50);
                }}
                className="text-[9px] text-slate-500 hover:text-cyan-300 transition-colors px-1 rounded hover:bg-[#202636]"
                title="Equal 50/50 Split"
              >
                50/50
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSplitPercent(70);
                }}
                className="text-[9px] text-slate-500 hover:text-cyan-300 transition-colors px-1 rounded hover:bg-[#202636]"
                title="Functions Focus (70% Functions / 30% Strings)"
              >
                70/30
              </button>
            </div>
          </div>

          {/* BOTTOM PANE */}
          <div
            style={{ height: `${100 - splitPercent}%` }}
            className="flex flex-col min-h-[90px] overflow-hidden"
          >
            {/* Bottom Pane Header / Subtabs */}
            <div className="flex items-center justify-between px-2 py-1 bg-[#151720] border-b border-[#232732] text-[11px] font-medium text-slate-400 shrink-0">
              <div className="flex items-center gap-1">
                {isSwapped ? (
                  <>
                    <button
                      onClick={() => setTopTab('functions')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        topTab === 'functions' ? 'bg-[#202533] text-cyan-300 font-semibold' : 'hover:text-slate-200'
                      }`}
                    >
                      Functions ({currentBinary.functions.length})
                    </button>
                    <button
                      onClick={() => setTopTab('symbols')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        topTab === 'symbols' ? 'bg-[#202533] text-slate-200 font-semibold' : 'hover:text-slate-200'
                      }`}
                    >
                      Symbols
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setBottomTab('strings')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        bottomTab === 'strings'
                          ? 'bg-[#202533] text-amber-300 font-semibold'
                          : 'hover:text-slate-200'
                      }`}
                    >
                      Strings ({currentBinary.strings.length})
                    </button>

                    <button
                      onClick={() => setBottomTab('xrefs')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        bottomTab === 'xrefs'
                          ? 'bg-[#202533] text-purple-300 font-semibold'
                          : 'hover:text-slate-200'
                      }`}
                    >
                      XREFs
                    </button>

                    <button
                      onClick={() => setBottomTab('sections')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        bottomTab === 'sections'
                          ? 'bg-[#202533] text-emerald-300 font-semibold'
                          : 'hover:text-slate-200'
                      }`}
                    >
                      Sections
                    </button>
                  </>
                )}
              </div>

              {/* Quick Split Ratio Preset: 70% Bottom (Makes Strings Big!) */}
              <button
                onClick={() => setSplitPercent(25)}
                className="text-[9px] text-amber-400/80 hover:text-amber-300 px-1 rounded hover:bg-[#1f2330]"
                title="Expand Bottom Pane (give Strings 75% height)"
              >
                Expand Strings
              </button>
            </div>

            {/* Bottom Pane Content */}
            <div className="flex-1 min-h-0 flex flex-col">
              {renderContentForTab(currentBottomView as SidebarTab)}
            </div>
          </div>
        </div>
      )}

      {/* DRAGGABLE RIGHT BORDER FOR SIDEBAR WIDTH RESIZING */}
      <div
        onMouseDown={handleWidthMouseDown}
        className="absolute top-0 right-0 w-1.5 h-full hover:bg-cyan-500/50 active:bg-cyan-500 cursor-col-resize z-30 transition-colors group"
        title="Drag left or right to resize sidebar width"
      >
        <div className="w-full h-full" />
      </div>
    </aside>
  );
};
