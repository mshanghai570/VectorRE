/**
 * VectorRE - Strings Dock Window (IDA Pro Shift+F12 Standard)
 * Full-width dockable, resizable bottom panel for analyzing string literals,
 * referencing functions, and immediate address navigation.
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, X, Copy, Check, ExternalLink, ArrowUpDown, SlidersHorizontal, Download, Minimize2, Maximize2 } from 'lucide-react';
import { BinaryFile, BinaryString } from '../../types/binary';

interface StringsDockProps {
  currentBinary: BinaryFile;
  onNavigateAddress: (address: number) => void;
  onOpenXrefs: (address: number) => void;
  onClose: () => void;
  height: number;
  onHeightChange: (newHeight: number) => void;
}

export const StringsDock: React.FC<StringsDockProps> = ({
  currentBinary,
  onNavigateAddress,
  onOpenXrefs,
  onClose,
  height,
  onHeightChange
}) => {
  const [query, setQuery] = useState('');
  const [minLength, setMinLength] = useState(4);
  const [selectedSection, setSelectedSection] = useState('All');
  const [copiedAddress, setCopiedAddress] = useState<number | null>(null);
  const [sortField, setSortField] = useState<'address' | 'length' | 'xrefCount'>('address');
  const [sortAsc, setSortAsc] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);

  const resizeDragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  // Available unique sections in binary strings
  const sections = useMemo(() => {
    const set = new Set<string>();
    currentBinary.strings.forEach((s) => {
      if (s.section) set.add(s.section);
    });
    return ['All', ...Array.from(set)];
  }, [currentBinary.strings]);

  // Filter and sort strings
  const filteredStrings = useMemo(() => {
    return currentBinary.strings
      .filter((s) => {
        const matchesQuery =
          !query ||
          s.value.toLowerCase().includes(query.toLowerCase()) ||
          `0x${s.address.toString(16)}`.includes(query.toLowerCase());
        const matchesLength = s.length >= minLength;
        const matchesSection = selectedSection === 'All' || s.section === selectedSection;
        return matchesQuery && matchesLength && matchesSection;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'address') diff = a.address - b.address;
        else if (sortField === 'length') diff = a.length - b.length;
        else if (sortField === 'xrefCount') diff = a.xrefCount - b.xrefCount;
        return sortAsc ? diff : -diff;
      });
  }, [currentBinary.strings, query, minLength, selectedSection, sortField, sortAsc]);

  // Resize drag handle handlers
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeDragRef.current = {
      startY: e.clientY,
      startHeight: height
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeDragRef.current) return;
      const delta = resizeDragRef.current.startY - moveEvent.clientY;
      const nextHeight = Math.min(Math.max(resizeDragRef.current.startHeight + delta, 130), 520);
      onHeightChange(nextHeight);
    };

    const handleMouseUp = () => {
      resizeDragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleCopyString = (str: BinaryString, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(str.value);
    setCopiedAddress(str.address);
    setTimeout(() => setCopiedAddress(null), 1500);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Address', 'Length', 'Section', 'Type', 'XREFs', 'Value'],
      ...filteredStrings.map((s) => [
        `0x${s.address.toString(16)}`,
        s.length.toString(),
        s.section,
        s.type,
        s.xrefCount.toString(),
        `"${s.value.replace(/"/g, '""')}"`
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentBinary.filename}_strings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const effectiveHeight = isMaximized ? 480 : height;

  return (
    <div
      style={{ height: effectiveHeight }}
      className="border-t border-[#2a2f3d] bg-[#12141a] flex flex-col z-20 shrink-0 font-mono text-xs select-none shadow-lg transition-all"
    >
      {/* Draggable Top Handle */}
      <div
        onMouseDown={handleMouseDownResize}
        className="h-1.5 w-full bg-[#1b1f2b] hover:bg-cyan-500/60 active:bg-cyan-500 cursor-row-resize flex items-center justify-center transition-colors group relative"
        title="Drag up or down to resize Strings Window"
      >
        <div className="w-16 h-1 rounded-full bg-slate-600 group-hover:bg-cyan-300 transition-colors" />
      </div>

      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[#171a23] border-b border-[#262b38] shrink-0 text-slate-300">
        {/* Left: Title & Quick Counts */}
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Strings Window</span>
          </span>
          <span className="text-[11px] px-1.5 py-0.2 rounded bg-[#202533] text-amber-300 border border-amber-500/20">
            {filteredStrings.length} of {currentBinary.strings.length}
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            (Shift+F12)
          </span>
        </div>

        {/* Center: Search & Filters */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter strings (text or 0xaddr)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-7 pr-6 py-1 bg-[#0f1117] border border-[#262b3a] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-1.5 top-1.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap">
            <span>Min:</span>
            <select
              value={minLength}
              onChange={(e) => setMinLength(Number(e.target.value))}
              className="bg-[#0f1117] border border-[#262b3a] rounded px-1.5 py-0.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value={3}>≥ 3</option>
              <option value={4}>≥ 4</option>
              <option value={6}>≥ 6</option>
              <option value={8}>≥ 8</option>
              <option value={16}>≥ 16</option>
            </select>
          </div>

          {sections.length > 2 && (
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-[#0f1117] border border-[#262b3a] rounded px-1.5 py-0.5 text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
            >
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Actions (Export, Maximize, Close) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-white bg-[#202533] hover:bg-[#282f42] rounded border border-[#2c3345] transition-colors"
            title="Export filtered strings to CSV"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={() => setIsMaximized((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#222735] rounded transition-colors"
            title={isMaximized ? 'Restore height' : 'Maximize dock'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-[#222735] rounded transition-colors"
            title="Close Strings Window"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Strings Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-[#151821] text-[11px] text-slate-400 border-b border-[#232836] select-none z-10">
            <tr>
              <th
                onClick={() => {
                  if (sortField === 'address') setSortAsc(!sortAsc);
                  else {
                    setSortField('address');
                    setSortAsc(true);
                  }
                }}
                className="py-1 px-3 w-36 cursor-pointer hover:text-cyan-300"
              >
                <div className="flex items-center gap-1">
                  <span>Address</span>
                  <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>

              <th className="py-1 px-3">String Literal</th>

              <th
                onClick={() => {
                  if (sortField === 'length') setSortAsc(!sortAsc);
                  else {
                    setSortField('length');
                    setSortAsc(false);
                  }
                }}
                className="py-1 px-3 w-20 cursor-pointer hover:text-cyan-300 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Length</span>
                  <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>

              <th className="py-1 px-3 w-28">Section</th>

              <th
                onClick={() => {
                  if (sortField === 'xrefCount') setSortAsc(!sortAsc);
                  else {
                    setSortField('xrefCount');
                    setSortAsc(false);
                  }
                }}
                className="py-1 px-3 w-24 cursor-pointer hover:text-cyan-300 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>XREFs</span>
                  <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>

              <th className="py-1 px-2 w-16 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b1f2b]">
            {filteredStrings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No strings matching current filters
                </td>
              </tr>
            ) : (
              filteredStrings.map((s) => {
                const isCopied = copiedAddress === s.address;
                return (
                  <tr
                    key={s.address}
                    onClick={() => onNavigateAddress(s.address)}
                    className="group cursor-pointer hover:bg-[#181c26] transition-colors"
                  >
                    {/* Address */}
                    <td className="py-1 px-3 text-cyan-400 tabular-nums font-mono text-[11px] whitespace-nowrap">
                      0x{s.address.toString(16).padStart(8, '0')}
                    </td>

                    {/* Value */}
                    <td className="py-1 px-3 text-amber-300 break-all select-text font-mono text-xs">
                      "{s.value}"
                    </td>

                    {/* Length */}
                    <td className="py-1 px-3 text-slate-400 tabular-nums text-right text-[11px]">
                      {s.length}B
                    </td>

                    {/* Section */}
                    <td className="py-1 px-3 text-slate-400 text-[11px] truncate">
                      {s.section}
                    </td>

                    {/* XREFs */}
                    <td className="py-1 px-3 text-center">
                      {s.xrefCount > 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenXrefs(s.address);
                          }}
                          className="px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 hover:bg-purple-900 border border-purple-800/40 text-[10px] inline-flex items-center gap-1"
                          title="View cross references"
                        >
                          <span>{s.xrefCount}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px]">0</span>
                      )}
                    </td>

                    {/* Copy action */}
                    <td className="py-1 px-2 text-right">
                      <button
                        onClick={(e) => handleCopyString(s, e)}
                        className="p-1 text-slate-500 hover:text-slate-200 transition-colors rounded hover:bg-[#232838]"
                        title="Copy string value"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
