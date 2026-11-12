/**
 * VectorRE - Scripting & Automation SDK Console
 * Supports macOS Swift Automation SDK, Binary Ninja Python API, and IDA Pro Python compatibility.
 */

import React, { useState } from 'react';
import { Terminal, Play, Trash2, Code2, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { BinaryFile } from '../../types/binary';
import { ConsoleOutput, PRESET_SCRIPTS, PresetScript, ScriptEngine, executeConsoleScript } from '../../services/sdkEngine';

interface ScriptingConsoleViewProps {
  currentBinary: BinaryFile;
  onUpdateBinary: (updater: (prev: BinaryFile) => BinaryFile) => void;
}

export const ScriptingConsoleView: React.FC<ScriptingConsoleViewProps> = ({
  currentBinary,
  onUpdateBinary
}) => {
  const [engine, setEngine] = useState<ScriptEngine>('swift');
  const [scriptCode, setScriptCode] = useState(PRESET_SCRIPTS[0].code);
  const [cliInput, setCliInput] = useState('');
  const [logs, setLogs] = useState<ConsoleOutput[]>([
    {
      id: 'init-1',
      type: 'info',
      text: `VectorRE Automation SDK initialized. Target binary: ${currentBinary.filename} (${currentBinary.architecture})`,
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 'init-2',
      type: 'info',
      text: 'macOS Swift SDK, Python (ida_*/binaryninja), and JavaScript runtimes ready.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isRunning, setIsRunning] = useState(false);

  // Apply preset script
  const handleSelectPreset = (preset: PresetScript) => {
    setEngine(preset.engine);
    setScriptCode(preset.code);
  };

  // Run full script
  const handleRunScript = async () => {
    if (!scriptCode.trim()) return;
    setIsRunning(true);
    const newLogs = await executeConsoleScript(scriptCode, engine, currentBinary, onUpdateBinary);
    setLogs((prev) => [...prev, ...newLogs]);
    setIsRunning(false);
  };

  // Run single line from interactive REPL
  const handleRunCli = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;
    const command = cliInput;
    setCliInput('');

    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        type: 'info',
        text: `>>> ${command}`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    const newLogs = await executeConsoleScript(command, engine, currentBinary, onUpdateBinary);
    setLogs((prev) => [...prev, ...newLogs]);
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="flex flex-col h-full bg-[#101217] font-mono text-xs text-slate-300 select-none">
      {/* Top Console Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#171922] border-b border-[#252936] shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100">Automation & Scripting Console</span>

          {/* Engine Selector */}
          <div className="flex items-center gap-1 bg-[#101217] p-0.5 rounded border border-[#292e3c] font-sans text-xs">
            <button
              onClick={() => setEngine('swift')}
              className={`px-2.5 py-1 rounded transition-colors ${
                engine === 'swift' ? 'bg-orange-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              macOS Swift SDK
            </button>
            <button
              onClick={() => setEngine('python')}
              className={`px-2.5 py-1 rounded transition-colors ${
                engine === 'python' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Python (IDA/Binja)
            </button>
            <button
              onClick={() => setEngine('javascript')}
              className={`px-2.5 py-1 rounded transition-colors ${
                engine === 'javascript' ? 'bg-yellow-600 text-slate-900 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JavaScript / TS
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <select
            onChange={(e) => {
              const selected = PRESET_SCRIPTS.find((p) => p.id === e.target.value);
              if (selected) handleSelectPreset(selected);
            }}
            className="px-2 py-1 bg-[#12141c] border border-[#2b3040] rounded text-slate-300 text-xs font-sans focus:outline-none"
          >
            <option value="">Load Preset Script...</option>
            {PRESET_SCRIPTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleRunScript}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-sans font-medium transition-colors disabled:opacity-50"
            title="Execute Script (⌘Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Running...' : 'Run Script'}</span>
          </button>

          <button
            onClick={clearLogs}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#202432] rounded transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split: Code Editor (Top/Left) & Console Output (Bottom/Right) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Code Input Area */}
        <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-[#242836]">
          <div className="px-3 py-1.5 bg-[#14161f] border-b border-[#242836] text-[11px] text-slate-400 flex items-center justify-between font-sans">
            <span>Editor ({engine.toUpperCase()})</span>
            <span>API Docs: bv.functions, bv.get_strings(), bv.runFlirtScan()</span>
          </div>
          <textarea
            value={scriptCode}
            onChange={(e) => setScriptCode(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleRunScript();
              }
            }}
            className="flex-1 p-3 bg-[#0d0e13] text-slate-200 font-mono text-xs focus:outline-none resize-none leading-relaxed border-none selection:bg-cyan-500/30"
            placeholder="Write Python, Swift, or JavaScript automation scripts..."
            spellCheck={false}
          />
        </div>

        {/* Output Console Log */}
        <div className="w-full md:w-1/2 flex flex-col bg-[#0b0c10]">
          <div className="px-3 py-1.5 bg-[#14161f] border-b border-[#242836] text-[11px] text-slate-400 font-sans flex items-center justify-between">
            <span>Terminal Output</span>
            <span>{logs.length} lines</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-1 selection:bg-cyan-500/30">
            {logs.map((log) => {
              let color = 'text-slate-300';
              if (log.type === 'stderr') color = 'text-rose-400';
              if (log.type === 'return') color = 'text-emerald-400 font-semibold';
              if (log.type === 'info') color = 'text-cyan-400';

              return (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-600 text-[10px] select-none tabular-nums mt-0.5">
                    {log.timestamp}
                  </span>
                  <pre className={`font-mono text-xs whitespace-pre-wrap ${color}`}>
                    {log.text}
                  </pre>
                </div>
              );
            })}
          </div>

          {/* Interactive REPL Prompt */}
          <form onSubmit={handleRunCli} className="p-2 bg-[#12141c] border-t border-[#242836] flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              type="text"
              placeholder={`Evaluate one-line ${engine.toUpperCase()} expression...`}
              value={cliInput}
              onChange={(e) => setCliInput(e.target.value)}
              className="flex-1 bg-transparent text-slate-200 focus:outline-none font-mono text-xs placeholder-slate-600"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-[#1e2330] hover:bg-[#272d3e] text-slate-300 hover:text-white rounded text-[11px] font-sans"
            >
              Exec
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
