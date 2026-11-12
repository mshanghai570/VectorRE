/**
 * VectorRE - Hex Editor & Binary Patcher
 * Enables direct byte editing, NOP sled insertion, and exporting patched binaries.
 */

import React, { useState } from 'react';
import { Download, Edit3, ShieldAlert, Check } from 'lucide-react';
import { BinaryFile } from '../../types/binary';

interface HexEditorViewProps {
  currentBinary: BinaryFile;
  onUpdateBinary: (updater: (prev: BinaryFile) => BinaryFile) => void;
}

export const HexEditorView: React.FC<HexEditorViewProps> = ({ currentBinary, onUpdateBinary }) => {
  // Generate sample hex bytes if rawBytes not supplied
  const [bytes, setBytes] = useState<number[]>(() => {
    if (currentBinary.rawBytes) {
      return Array.from(currentBinary.rawBytes.slice(0, 1024));
    }
    const sample: number[] = [];
    for (let i = 0; i < 512; i++) {
      sample.push(Math.floor(Math.sin(i * 1.5) * 128 + 128));
    }
    return sample;
  });

  const [selectedOffset, setSelectedOffset] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const bytesPerRow = 16;
  const numRows = Math.ceil(bytes.length / bytesPerRow);

  const handleEditByte = (offset: number) => {
    setSelectedOffset(offset);
    setEditValue(bytes[offset].toString(16).padStart(2, '0'));
  };

  const handleSaveByte = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOffset === null) return;

    const val = parseInt(editValue, 16);
    if (!isNaN(val) && val >= 0 && val <= 255) {
      const nextBytes = [...bytes];
      nextBytes[selectedOffset] = val;
      setBytes(nextBytes);
      setStatusMsg(`Patched byte at offset +0x${selectedOffset.toString(16)} to 0x${editValue.toUpperCase()}`);
      setTimeout(() => setStatusMsg(null), 3000);
      setSelectedOffset(null);
    }
  };

  const fillNops = () => {
    if (selectedOffset === null) return;
    const isArm = currentBinary.architecture.includes('ARM');
    const nopByte = isArm ? 0x1f : 0x90; // x86 NOP is 0x90
    const nextBytes = [...bytes];
    for (let i = 0; i < (isArm ? 4 : 2); i++) {
      if (selectedOffset + i < nextBytes.length) {
        nextBytes[selectedOffset + i] = nopByte;
      }
    }
    setBytes(nextBytes);
    setStatusMsg(`Injected NOP sequence at offset +0x${selectedOffset.toString(16)}`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleExportPatched = () => {
    const uint8 = new Uint8Array(bytes);
    const blob = new Blob([uint8], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patched_${currentBinary.filename}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#101217] font-mono text-xs text-slate-300 select-none p-4 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#242836]">
        <div>
          <h3 className="font-bold text-white text-sm">Hex Editor & Byte Patcher</h3>
          <p className="text-slate-400 font-sans text-xs">
            Directly edit machine opcodes and export modified binary ({bytes.length} bytes loaded).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedOffset !== null && (
            <button
              onClick={fillNops}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-sans font-medium transition-colors"
            >
              Fill NOPs at +0x{selectedOffset.toString(16)}
            </button>
          )}

          <button
            onClick={handleExportPatched}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-sans font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Patched Binary</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-2 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded flex items-center gap-2 font-sans">
          <Check className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Hex Table Display */}
      <div className="flex-1 overflow-y-auto bg-[#0b0c10] border border-[#222634] rounded-lg p-3">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-[11px] text-slate-500 border-b border-[#1f2230] pb-1">
              <th className="w-24 pb-1">Offset</th>
              <th className="pb-1" colSpan={16}>
                Hex Dump (00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F)
              </th>
              <th className="w-44 pb-1">ASCII</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: numRows }).map((_, rIdx) => {
              const startOffset = rIdx * bytesPerRow;
              const rowBytes = bytes.slice(startOffset, startOffset + bytesPerRow);

              return (
                <tr key={rIdx} className="hover:bg-[#141722] transition-colors leading-6">
                  {/* Offset */}
                  <td className="text-slate-500 tabular-nums">
                    0x{startOffset.toString(16).padStart(6, '0')}
                  </td>

                  {/* 16 Hex Bytes */}
                  <td className="font-mono">
                    <div className="flex items-center gap-2">
                      {rowBytes.map((b, bIdx) => {
                        const curOffset = startOffset + bIdx;
                        const isCurSelected = selectedOffset === curOffset;
                        return (
                          <span
                            key={bIdx}
                            onClick={() => handleEditByte(curOffset)}
                            className={`px-1 rounded cursor-pointer tabular-nums uppercase text-xs transition-colors ${
                              isCurSelected
                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                : 'hover:bg-[#202534] text-slate-300'
                            }`}
                          >
                            {b.toString(16).padStart(2, '0')}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  {/* ASCII Representation */}
                  <td className="text-slate-400 font-mono text-[11px]">
                    {rowBytes.map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Byte Inline Popup */}
      {selectedOffset !== null && (
        <form onSubmit={handleSaveByte} className="flex items-center gap-3 p-3 bg-[#171a23] border border-[#2b3040] rounded-lg">
          <span className="font-sans text-xs text-slate-300">
            Edit Byte @ <span className="text-cyan-400 font-mono">+0x{selectedOffset.toString(16)}</span>:
          </span>
          <input
            type="text"
            maxLength={2}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value.toUpperCase())}
            className="w-16 px-2 py-1 bg-[#0d0e13] border border-[#2d3345] rounded text-center text-white font-mono uppercase focus:outline-none focus:border-cyan-500 text-xs"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-sans font-medium"
          >
            Apply Byte
          </button>
          <button
            type="button"
            onClick={() => setSelectedOffset(null)}
            className="text-xs text-slate-400 hover:text-white font-sans"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};
