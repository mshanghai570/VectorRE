/**
 * VectorRE - High-Fidelity Pseudo-C Decompiler View
 * Combines IDA Pro Hex-Rays style decompilation with Binary Ninja's clean syntax highlighting,
 * variable renaming, and synchronized line mapping.
 */

import React, { useState } from 'react';
import { Copy, Check, Tag, Code, ArrowLeft } from 'lucide-react';
import { FunctionItem } from '../../types/binary';

interface PseudoCViewProps {
  selectedFunction: FunctionItem | null;
  onToggleDisasm: () => void;
  onOpenRename: (addr: number, name: string) => void;
}

export const PseudoCView: React.FC<PseudoCViewProps> = ({
  selectedFunction,
  onToggleDisasm,
  onOpenRename
}) => {
  const [copied, setCopied] = useState(false);

  if (!selectedFunction) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs">
        No function selected for decompilation. Choose a function from the sidebar.
      </div>
    );
  }

  const codeLines = selectedFunction.pseudoC || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(codeLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Syntax highlight C tokens
  const renderLine = (line: string) => {
    // Keywords regex
    const kwRegex = /\b(return|if|else|for|while|do|switch|case|break|continue|typedef|struct|union|enum|sizeof|const|static|volatile|signed|unsigned|uint8_t|uint16_t|uint32_t|uint64_t|int8_t|int16_t|int32_t|int64_t|int|char|void|bool|size_t|__cdecl|__fastcall)\b/g;

    return line.split(/([a-zA-Z0-9_]+|"[^"]*"|\/\*.*?\*\/|\/\/.*|0x[0-9a-fA-F]+|[0-9]+)/g).map((token, idx) => {
      if (kwRegex.test(token)) {
        return <span key={idx} className="text-purple-400 font-medium">{token}</span>;
      }
      if (/^0x[0-9a-fA-F]+|^[0-9]+LL?$/.test(token)) {
        return <span key={idx} className="text-amber-400">{token}</span>;
      }
      if (token.startsWith('"') && token.endsWith('"')) {
        return <span key={idx} className="text-emerald-400">{token}</span>;
      }
      if (token.startsWith('//') || token.startsWith('/*') || token.startsWith(' *')) {
        return <span key={idx} className="text-slate-500 italic">{token}</span>;
      }
      if (token === selectedFunction.name || token.includes('_')) {
        return (
          <span
            key={idx}
            onClick={() => onOpenRename(selectedFunction.address, token)}
            className="text-cyan-300 font-semibold cursor-pointer hover:underline"
            title="Click to rename symbol (N)"
          >
            {token}
          </span>
        );
      }
      return <span key={idx} className="text-slate-200">{token}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#111317] font-mono text-xs text-slate-300 select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#171921] border-b border-[#252936] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDisasm}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs font-sans"
            title="Return to Disassembly (Tab)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Disassembly</span>
          </button>
          <div className="h-4 w-[1px] bg-[#2a2e3d]" />
          <span className="font-bold text-slate-100">
            {selectedFunction.demangledName || selectedFunction.name}
          </span>
          <span className="text-[11px] text-slate-500">
            Hex-Rays / Binary Ninja Pseudo-C Engine
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-[#202532] hover:bg-[#282f40] rounded border border-[#303648] transition-colors font-sans"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy C Code'}</span>
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="flex-1 overflow-y-auto p-4 leading-relaxed bg-[#101217]">
        {codeLines.map((line, idx) => (
          <div key={idx} className="flex items-start gap-4 hover:bg-[#181b24] px-2 py-0.5 rounded transition-colors group">
            <span className="text-slate-600 w-8 text-right select-none text-[11px] tabular-nums group-hover:text-slate-400">
              {idx + 1}
            </span>
            <pre className="text-slate-200 font-mono whitespace-pre flex-1">
              {renderLine(line)}
            </pre>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-[#14161f] border-t border-[#252936] text-[11px] text-slate-500 flex items-center justify-between font-sans">
        <span>Click any function or variable name to rename (N)</span>
        <span>Calling Convention: {selectedFunction.callingConvention} · Return: {selectedFunction.returnType}</span>
      </div>
    </div>
  );
};
