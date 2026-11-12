/**
 * VectorRE - Binary Loader & Sample Switcher Modal
 * Enables loading custom local binaries or pre-loaded real-world target samples.
 */

import React, { useRef, useState } from 'react';
import { Upload, FileCode, Check, X, Shield, Cpu } from 'lucide-react';
import { BinaryFile } from '../../types/binary';
import { SAMPLE_BINARIES } from '../../services/sampleBinaries';
import { parseUploadedBinary } from '../../services/binaryParser';

interface UploadModalProps {
  currentBinary: BinaryFile;
  onSelectBinary: (binary: BinaryFile) => void;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  currentBinary,
  onSelectBinary,
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const parsed = await parseUploadedBinary(file);
      onSelectBinary(parsed);
      onClose();
    } catch (err) {
      console.error('Failed to parse binary:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161822] border border-[#2b3040] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden font-sans text-xs select-none space-y-4 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#252936]">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Open or Switch Binary Target</span>
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-[#2c3142] hover:border-slate-500 bg-[#12141a]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
          <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
          <h4 className="font-semibold text-white text-xs">
            {isProcessing ? 'Parsing binary headers and disassembling...' : 'Drag & drop binary file, or browse'}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">
            Supports Mach-O 64 (macOS ARM64/x86), ELF64 (Linux), PE64 (Windows), or raw binary.
          </p>
        </div>

        {/* Pre-Loaded Target Samples */}
        <div className="space-y-2">
          <span className="text-slate-400 font-semibold text-[11px] block">
            Or load a verified target sample:
          </span>

          <div className="space-y-2">
            {SAMPLE_BINARIES.map((sample) => {
              const isActive = sample.id === currentBinary.id;
              return (
                <div
                  key={sample.id}
                  onClick={() => {
                    onSelectBinary(sample);
                    onClose();
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-[#1e2332] border-cyan-500 ring-1 ring-cyan-500/50'
                      : 'bg-[#12141c] border-[#252936] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white text-xs">{sample.filename}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{sample.format}</span>
                        <span>·</span>
                        <span>{sample.architecture}</span>
                        <span>·</span>
                        <span>{(sample.fileSize / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="text-cyan-400 text-xs font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : (
                    <span className="text-slate-400 hover:text-white text-xs">Load</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
