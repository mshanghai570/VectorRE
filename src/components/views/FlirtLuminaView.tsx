/**
 * VectorRE - FLIRT Signatures & IDA Pro Lumina Cloud Console
 * Full management suite for automated library function identification and cloud metadata synchronization.
 */

import React, { useState } from 'react';
import { ShieldCheck, Sparkles, RefreshCw, UploadCloud, CheckCircle2, AlertCircle, Database, Search, ArrowRight } from 'lucide-react';
import { BinaryFile, FlirtSignature, FunctionItem } from '../../types/binary';
import { DEFAULT_FLIRT_SIGNATURES, runFlirtScan, FlirtMatchResult } from '../../services/flirtEngine';
import { queryLuminaForBinary, pushLuminaMetadata, LuminaQueryResult, generateLuminaHash } from '../../services/luminaService';

interface FlirtLuminaViewProps {
  currentBinary: BinaryFile;
  selectedFunction: FunctionItem | null;
  onUpdateBinary: (updater: (prev: BinaryFile) => BinaryFile) => void;
  onNavigateAddress: (addr: number) => void;
}

export const FlirtLuminaView: React.FC<FlirtLuminaViewProps> = ({
  currentBinary,
  selectedFunction,
  onUpdateBinary,
  onNavigateAddress
}) => {
  const [signatures, setSignatures] = useState<FlirtSignature[]>(DEFAULT_FLIRT_SIGNATURES);
  const [isScanningFlirt, setIsScanningFlirt] = useState(false);
  const [flirtMatches, setFlirtMatches] = useState<FlirtMatchResult[]>([]);
  const [isQueryingLumina, setIsQueryingLumina] = useState(false);
  const [luminaResults, setLuminaResults] = useState<LuminaQueryResult[]>([]);
  const [pushName, setPushName] = useState('');
  const [pushComment, setPushComment] = useState('');
  const [pushSuccess, setPushSuccess] = useState(false);

  // Toggle signature
  const toggleSignature = (id: string) => {
    setSignatures((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Run FLIRT scan
  const handleRunFlirt = () => {
    setIsScanningFlirt(true);
    setTimeout(() => {
      const { matches, updatedFunctions } = runFlirtScan(currentBinary, signatures);
      setFlirtMatches(matches);
      onUpdateBinary((prev) => ({
        ...prev,
        functions: updatedFunctions
      }));
      setIsScanningFlirt(false);
    }, 450);
  };

  // Query Lumina server
  const handleQueryLumina = async () => {
    setIsQueryingLumina(true);
    const { results, updatedFunctions } = await queryLuminaForBinary(currentBinary);
    setLuminaResults(results);
    onUpdateBinary((prev) => ({
      ...prev,
      functions: updatedFunctions
    }));
    setIsQueryingLumina(false);
  };

  // Push metadata to Lumina
  const handlePushLumina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFunction || !pushName.trim()) return;

    await pushLuminaMetadata(selectedFunction, pushName.trim(), pushComment.trim());
    setPushSuccess(true);
    setTimeout(() => setPushSuccess(false), 3000);
    setPushName('');
    setPushComment('');
  };

  return (
    <div className="flex flex-col h-full bg-[#111317] font-mono text-xs text-slate-300 overflow-y-auto p-5 select-none space-y-6">
      {/* Top Banner Overview */}
      <div className="flex items-center justify-between pb-4 border-b border-[#242835]">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span>FLIRT Signatures & IDA Lumina Metadata Suite</span>
          </h2>
          <p className="text-slate-400 font-sans text-xs mt-1">
            Automatically recognize standard compiler and runtime functions using byte masks and crowd-sourced AST hashes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunFlirt}
            disabled={isScanningFlirt}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-sans text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanningFlirt ? 'animate-spin' : ''}`} />
            <span>{isScanningFlirt ? 'Matching FLIRT...' : 'Run FLIRT Match'}</span>
          </button>

          <button
            onClick={handleQueryLumina}
            disabled={isQueryingLumina}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-sans text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isQueryingLumina ? 'animate-spin' : ''}`} />
            <span>{isQueryingLumina ? 'Querying Lumina...' : 'Query Lumina Server'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: FLIRT ENGINE */}
        <div className="bg-[#161821] border border-[#272b38] rounded-lg p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-slate-200">FLIRT Signature Database</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-sans">
              {signatures.filter((s) => s.enabled).length} of {signatures.length} active
            </span>
          </div>

          <p className="text-slate-400 font-sans text-xs leading-relaxed">
            Fast Library Identification and Recognition Technology tests candidate function bytes against wild-carded patterns and CRC16 checksums.
          </p>

          {/* Signature list */}
          <div className="divide-y divide-[#202432] max-h-64 overflow-y-auto rounded bg-[#101217] border border-[#242836]">
            {signatures.map((sig) => (
              <div key={sig.id} className="p-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex-1 truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-purple-300">{sig.functionName}</span>
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.2 bg-[#1c1f2b] rounded">
                      {sig.targetArch.split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">{sig.libraryName}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                    Pattern: {sig.pattern}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={sig.enabled}
                    onChange={() => toggleSignature(sig.id)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            ))}
          </div>

          {/* FLIRT Scan Results */}
          {flirtMatches.length > 0 && (
            <div className="mt-2 bg-[#1a1d29] p-3 rounded border border-purple-800/40">
              <div className="flex items-center gap-2 text-purple-300 font-semibold mb-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>FLIRT Scan Results ({flirtMatches.length} Matches Found)</span>
              </div>
              <div className="space-y-1.5">
                {flirtMatches.map((m, idx) => (
                  <div
                    key={idx}
                    onClick={() => onNavigateAddress(m.functionAddress)}
                    className="flex items-center justify-between p-1.5 bg-[#12141c] hover:bg-[#202434] rounded cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-white font-semibold">{m.identifiedName}</span>
                      <span className="text-slate-400 text-[11px] ml-2">@ 0x{m.functionAddress.toString(16)}</span>
                    </div>
                    <span className="text-[10px] text-purple-400">
                      {(m.confidence * 100).toFixed(0)}% match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: IDA LUMINA METADATA SERVER */}
        <div className="bg-[#161821] border border-[#272b38] rounded-lg p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-slate-200">IDA Lumina Cloud Resolver</h3>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>TLS 1.3 Online</span>
            </div>
          </div>

          <p className="text-slate-400 font-sans text-xs leading-relaxed">
            Lumina identifies code using AST and opcode hashing against an online knowledge repository, allowing teams to share recovered symbol names and prototypes.
          </p>

          {/* Current Function Hash */}
          <div className="p-3 bg-[#101217] rounded border border-[#242836] space-y-1.5">
            <div className="text-[11px] text-slate-400 font-sans">Current Function AST Fingerprint:</div>
            <div className="text-xs text-cyan-400 font-mono break-all bg-[#0b0c10] p-2 rounded">
              {selectedFunction ? generateLuminaHash(selectedFunction) : 'Select a function in sidebar'}
            </div>
          </div>

          {/* Push Metadata Form */}
          <form onSubmit={handlePushLumina} className="p-3 bg-[#101217] rounded border border-[#242836] space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-2 text-xs font-sans">
              <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>Contribute Metadata to Lumina</span>
            </div>
            <input
              type="text"
              placeholder="Canonical Function Name (e.g. aes_cbc_decrypt)"
              value={pushName}
              onChange={(e) => setPushName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#171922] border border-[#2a2f3e] rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <input
              type="text"
              placeholder="Function Comment / Documentation"
              value={pushComment}
              onChange={(e) => setPushComment(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#171922] border border-[#2a2f3e] rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <div className="flex items-center justify-between pt-1">
              {pushSuccess && (
                <span className="text-emerald-400 text-[11px] font-sans flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Published to Lumina!
                </span>
              )}
              <button
                type="submit"
                disabled={!selectedFunction || !pushName.trim()}
                className="ml-auto px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-sans font-medium transition-colors disabled:opacity-40"
              >
                Push to Server
              </button>
            </div>
          </form>

          {/* Lumina Query Results */}
          {luminaResults.length > 0 && (
            <div className="bg-[#1a1d29] p-3 rounded border border-cyan-800/40">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold mb-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Lumina Query Results</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {luminaResults.map((r, idx) => (
                  <div
                    key={idx}
                    onClick={() => onNavigateAddress(r.functionAddress)}
                    className="p-2 bg-[#12141c] hover:bg-[#202434] rounded cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {r.record?.name || r.originalName}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded ${
                          r.status === 'FOUND'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    {r.record && (
                      <div className="text-[11px] text-slate-400 mt-1 italic font-sans">
                        "{r.record.comment}" · by {r.record.author} (pop: {r.record.popularity})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
