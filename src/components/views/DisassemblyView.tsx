/**
 * VectorRE - High-Performance Linear Disassembly View
 * Features:
 * - Intel / AT&T syntax styling
 * - Syntax highlighting (registers, immediates, mnemonics, symbols)
 * - Machine hex bytes toggle
 * - Interactive XREF tags and inline jump references
 * - Keyboard shortcuts: Space (Graph), Tab (Pseudo-C), N (Rename), ; (Comment), X (XREFs)
 */

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Code, FileText, Hash, MessageSquare, Tag } from 'lucide-react';
import { BinaryFile, FunctionItem, Instruction, WorkbenchSettings } from '../../types/binary';

interface DisassemblyViewProps {
  currentBinary: BinaryFile;
  selectedFunction: FunctionItem | null;
  selectedAddress: number;
  onSelectAddress: (addr: number) => void;
  onNavigateAddress: (addr: number) => void;
  onToggleGraph: () => void;
  onTogglePseudoC: () => void;
  onOpenXrefs: (addr: number) => void;
  onOpenRename: (addr: number, currentName: string) => void;
  onOpenComment: (addr: number, currentComment?: string) => void;
  settings: WorkbenchSettings;
  canGoBack: boolean;
  canGoForward: boolean;
  onHistoryBack: () => void;
  onHistoryForward: () => void;
}

export const DisassemblyView: React.FC<DisassemblyViewProps> = ({
  currentBinary,
  selectedFunction,
  selectedAddress,
  onSelectAddress,
  onNavigateAddress,
  onToggleGraph,
  onTogglePseudoC,
  onOpenXrefs,
  onOpenRename,
  onOpenComment,
  settings,
  canGoBack,
  canGoForward,
  onHistoryBack,
  onHistoryForward
}) => {
  const instructions = selectedFunction?.instructions || [];

  // Syntax highlight operands
  const renderOperands = (operands: string) => {
    // Registers regex
    const regRegex = /\b(rax|rbx|rcx|rdx|rsi|rdi|rbp|rsp|r8|r9|r10|r11|r12|r13|r14|r15|eax|ebx|ecx|edx|esi|edi|ebp|esp|x[0-9]{1,2}|w[0-9]{1,2}|sp|lr|pc|fp)\b/gi;
    // Immediate hex numbers regex
    const hexRegex = /\b(0x[0-9a-fA-F]+|#[0-9a-fA-Fx]+|\b[0-9]+\b)/g;

    const parts = operands.split(/([,\[\]\s+*#]+)/);

    return parts.map((part, idx) => {
      if (regRegex.test(part)) {
        return (
          <span key={idx} className="text-cyan-400 font-semibold">
            {part}
          </span>
        );
      }
      if (hexRegex.test(part)) {
        return (
          <span key={idx} className="text-amber-400">
            {part}
          </span>
        );
      }
      if (part.startsWith('"') || part.includes("'")) {
        return (
          <span key={idx} className="text-emerald-400">
            {part}
          </span>
        );
      }
      if (part.startsWith('_') || part.startsWith('loc_') || part.startsWith('sub_')) {
        return (
          <span
            key={idx}
            className="text-indigo-300 underline cursor-pointer hover:text-indigo-200"
            onClick={(e) => {
              e.stopPropagation();
              const match = part.match(/(?:0x)?([0-9a-fA-F]+)/);
              if (match) {
                const target = parseInt(match[1], 16);
                if (!isNaN(target)) onNavigateAddress(target);
              }
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={idx} className="text-slate-300">{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#121317] select-none text-slate-300 font-mono text-xs overflow-hidden">
      {/* Function Header Banner */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#171920] border-b border-[#262a36] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={onHistoryBack}
              disabled={!canGoBack}
              className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400"
              title="Back (Alt+Left or ⌘[)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onHistoryForward}
              disabled={!canGoForward}
              className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400"
              title="Forward (Alt+Right or ⌘])"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 text-sm">
              {selectedFunction ? (selectedFunction.demangledName || selectedFunction.name) : 'No function selected'}
            </span>
            {selectedFunction && (
              <span className="text-[11px] text-slate-500 tabular-nums">
                @ 0x{selectedFunction.address.toString(16)} ({selectedFunction.size} bytes)
              </span>
            )}
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-2 text-xs font-sans">
          <button
            onClick={onToggleGraph}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#222734] hover:bg-[#2c3242] text-cyan-300 rounded border border-[#333a4d] transition-colors"
            title="Switch to Graph Control Flow View (Space)"
          >
            <Code className="w-3 h-3" />
            <span>Graph View</span>
            <kbd className="px-1 text-[10px] bg-[#12141a] rounded text-slate-400 font-mono">Space</kbd>
          </button>

          <button
            onClick={onTogglePseudoC}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#222734] hover:bg-[#2c3242] text-emerald-300 rounded border border-[#333a4d] transition-colors"
            title="Decompile Function to Pseudo-C (Tab)"
          >
            <FileText className="w-3 h-3" />
            <span>Pseudo C</span>
            <kbd className="px-1 text-[10px] bg-[#12141a] rounded text-slate-400 font-mono">Tab</kbd>
          </button>
        </div>
      </div>

      {/* Disassembly Linear Instruction Table */}
      <div className="flex-1 overflow-y-auto p-2">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[11px] text-slate-500 border-b border-[#232733] pb-1">
              <th className="py-1 px-3 w-36">Address</th>
              {settings.showHexBytes && <th className="py-1 px-3 w-40">Hex Bytes</th>}
              <th className="py-1 px-3 w-28">Mnemonic</th>
              <th className="py-1 px-3">Operands</th>
              <th className="py-1 px-3 w-64">Comment / Annotations</th>
              <th className="py-1 px-2 w-20 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {instructions.map((ins, idx) => {
              const isSelected = selectedAddress === ins.address;
              const hasXrefs = (ins.xrefsCount || 0) > 0 || currentBinary.xrefs.some((x) => x.targetAddress === ins.address);

              return (
                <tr
                  key={idx}
                  onClick={() => onSelectAddress(ins.address)}
                  className={`group cursor-pointer transition-colors border-l-2 ${
                    isSelected
                      ? 'bg-[#1b2230] border-cyan-400 text-white'
                      : 'border-transparent hover:bg-[#161821]'
                  }`}
                >
                  {/* Address */}
                  <td className="py-1 px-3 text-slate-400 tabular-nums">
                    0x{ins.address.toString(16).padStart(8, '0')}
                  </td>

                  {/* Machine Bytes */}
                  {settings.showHexBytes && (
                    <td className="py-1 px-3 text-slate-500 tabular-nums uppercase text-[11px]">
                      {ins.bytes}
                    </td>
                  )}

                  {/* Mnemonic */}
                  <td className="py-1 px-3 font-semibold text-sky-400">
                    {ins.mnemonic}
                  </td>

                  {/* Operands */}
                  <td className="py-1 px-3 font-mono">
                    {renderOperands(ins.operands)}
                  </td>

                  {/* Comments / Annotations */}
                  <td className="py-1 px-3 text-slate-400 italic flex items-center justify-between">
                    <span className="truncate">
                      {ins.comment ? `; ${ins.comment}` : ''}
                    </span>
                    {hasXrefs && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenXrefs(ins.address);
                        }}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-sans px-1 py-0.2 bg-[#211a33] rounded ml-2 shrink-0 border border-purple-800/50"
                        title="Click to view cross-references (X)"
                      >
                        xrefs (X)
                      </button>
                    )}
                  </td>

                  {/* Row Context Actions (Rename / Comment) */}
                  <td className="py-1 px-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRename(ins.address, ins.mnemonic);
                        }}
                        className="p-1 hover:text-cyan-400"
                        title="Rename Symbol (N)"
                      >
                        <Tag className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenComment(ins.address, ins.comment);
                        }}
                        className="p-1 hover:text-amber-400"
                        title="Add/Edit Comment (;)"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Disassembly Status Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#14161c] border-t border-[#232733] text-[11px] text-slate-500 shrink-0">
        <div className="flex items-center gap-3">
          <span>Active: 0x{selectedAddress.toString(16)}</span>
          <span>·</span>
          <span>Syntax: {settings.syntaxStyle.toUpperCase()}</span>
          <span>·</span>
          <span>Architecture: {currentBinary.architecture}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Shortcuts:</span>
          <span className="text-slate-400">Space: Graph</span>
          <span className="text-slate-400">Tab: Decompile</span>
          <span className="text-slate-400">X: XREFs</span>
          <span className="text-slate-400">N: Rename</span>
          <span className="text-slate-400">;: Comment</span>
        </div>
      </div>
    </div>
  );
};
