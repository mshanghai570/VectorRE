/**
 * VectorRE - High-Performance Binary Ninja & IDA Pro Hybrid Reverse Engineering Studio
 * Complete web workbench featuring multi-tier IL (LLIL/MLIL/HLIL), interactive CFG graph,
 * FLIRT signature engine, IDA Lumina cloud metadata resolver, XREFs, and SDK scripting.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BinaryFile, FunctionItem, ViewTier, WorkbenchSettings } from './types/binary';
import { SAMPLE_BINARIES } from './services/sampleBinaries';
import { runFlirtScan } from './services/flirtEngine';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { DisassemblyView } from './components/views/DisassemblyView';
import { CFGGraphView } from './components/views/CFGGraphView';
import { ILView } from './components/views/ILView';
import { PseudoCView } from './components/views/PseudoCView';
import { FlirtLuminaView } from './components/views/FlirtLuminaView';
import { ScriptingConsoleView } from './components/views/ScriptingConsoleView';
import { PluginManagerView } from './components/views/PluginManagerView';
import { HexEditorView } from './components/views/HexEditorView';
import { RikuganView } from './components/views/RikuganView';
import { XrefModal } from './components/modals/XrefModal';
import { CommandPalette } from './components/modals/CommandPalette';
import { SettingsModal } from './components/modals/SettingsModal';
import { UploadModal } from './components/modals/UploadModal';
import { RenameModal } from './components/modals/RenameModal';
import { CommentModal } from './components/modals/CommentModal';
import { StringsDock } from './components/dock/StringsDock';

const DEFAULT_SETTINGS: WorkbenchSettings = {
  theme: 'binja-charcoal',
  fontSize: 12,
  syntaxStyle: 'intel',
  showHexBytes: true,
  showAddresses: true,
  showOpcodesInGraph: true,
  demangleSymbols: true,
  graphLayout: 'hierarchical',
  graphSmoothTransitions: true,
  autoRunFlirt: true,
  luminaServerUrl: 'https://lumina.vector-re.internal:443',
  luminaMinConfidence: 85
};

export default function App() {
  const [currentBinary, setCurrentBinary] = useState<BinaryFile>(SAMPLE_BINARIES[0]);
  const [selectedFunction, setSelectedFunction] = useState<FunctionItem | null>(SAMPLE_BINARIES[0].functions[0]);
  const [selectedAddress, setSelectedAddress] = useState<number>(SAMPLE_BINARIES[0].functions[0]?.address || 0x100003a00);
  const [activeTier, setActiveTier] = useState<ViewTier | 'flirt_lumina' | 'scripting' | 'plugins' | 'hex' | 'rikugan'>('disasm');
  const [settings, setSettings] = useState<WorkbenchSettings>(DEFAULT_SETTINGS);

  // Modals state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showXrefs, setShowXrefs] = useState(false);
  const [xrefTargetAddress, setXrefTargetAddress] = useState<number>(0);
  const [renameTarget, setRenameTarget] = useState<{ address: number; name: string } | null>(null);
  const [commentTarget, setCommentTarget] = useState<{ address: number; comment?: string } | null>(null);
  const [isBottomStringsOpen, setIsBottomStringsOpen] = useState(false);
  const [bottomStringsHeight, setBottomStringsHeight] = useState(240);

  // Address Navigation History
  const [history, setHistory] = useState<number[]>([SAMPLE_BINARIES[0].functions[0]?.address || 0x100003a00]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Auto-run FLIRT on binary load if configured
  useEffect(() => {
    if (settings.autoRunFlirt) {
      const { updatedFunctions } = runFlirtScan(currentBinary);
      setCurrentBinary((prev) => ({
        ...prev,
        functions: updatedFunctions
      }));
    }
  }, [currentBinary.id, settings.autoRunFlirt]);

  // Navigate to an address and update history
  const navigateToAddress = useCallback((addr: number) => {
    setSelectedAddress(addr);

    // Look up if this address is inside any function
    const fn = currentBinary.functions.find(
      (f) =>
        addr >= f.address &&
        addr < f.address + f.size
    );
    if (fn) {
      setSelectedFunction(fn);
    }

    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, addr];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [currentBinary.functions, historyIndex]);

  const handleHistoryBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      const addr = history[newIdx];
      setHistoryIndex(newIdx);
      setSelectedAddress(addr);
      const fn = currentBinary.functions.find(
        (f) => addr >= f.address && addr < f.address + f.size
      );
      if (fn) setSelectedFunction(fn);
    }
  }, [history, historyIndex, currentBinary.functions]);

  const handleHistoryForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      const addr = history[newIdx];
      setHistoryIndex(newIdx);
      setSelectedAddress(addr);
      const fn = currentBinary.functions.find(
        (f) => addr >= f.address && addr < f.address + f.size
      );
      if (fn) setSelectedFunction(fn);
    }
  }, [history, historyIndex, currentBinary.functions]);

  // Global Keyboard Shortcuts (IDA Pro & Binary Ninja standards)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) return;

      // Command Palette (⌘K or Ctrl+P)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'p')) {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
        return;
      }

      // Jump to Address (⌘G or G)
      if (((e.metaKey || e.ctrlKey) && e.key === 'g') || e.key === 'g') {
        e.preventDefault();
        setShowCommandPalette(true);
        return;
      }

      // Toggle Graph View (Space)
      if (e.code === 'Space') {
        e.preventDefault();
        setActiveTier((prev) => (prev === 'graph' ? 'disasm' : 'graph'));
        return;
      }

      // Toggle Decompiler Pseudo-C (Tab)
      if (e.code === 'Tab') {
        e.preventDefault();
        setActiveTier((prev) => (prev === 'pseudo_c' ? 'disasm' : 'pseudo_c'));
        return;
      }

      // Cross References (X)
      if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        setXrefTargetAddress(selectedAddress);
        setShowXrefs(true);
        return;
      }

      // Strings Window (Shift+F12 or Shift+S)
      if ((e.shiftKey && e.key === 'F12') || (e.shiftKey && (e.key === 'S' || e.key === 's'))) {
        e.preventDefault();
        setIsBottomStringsOpen((prev) => !prev);
        return;
      }

      // Rename Symbol (N)
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        const curName = selectedFunction?.name || `sub_${selectedAddress.toString(16)}`;
        setRenameTarget({ address: selectedAddress, name: curName });
        return;
      }

      // Add / Edit Comment (;)
      if (e.key === ';') {
        e.preventDefault();
        const ins = selectedFunction?.instructions.find((i) => i.address === selectedAddress);
        setCommentTarget({ address: selectedAddress, comment: ins?.comment });
        return;
      }

      // History back (⌘[ or Alt+Left)
      if (((e.metaKey || e.altKey) && e.key === '[') || (e.altKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        handleHistoryBack();
        return;
      }

      // History forward (⌘] or Alt+Right)
      if (((e.metaKey || e.altKey) && e.key === ']') || (e.altKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        handleHistoryForward();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAddress, selectedFunction, handleHistoryBack, handleHistoryForward]);

  // Rename handler
  const handleApplyRename = (addr: number, newName: string) => {
    setCurrentBinary((prev) => {
      const updatedFns = prev.functions.map((fn) => {
        if (fn.address === addr || fn.name === newName) {
          return { ...fn, name: newName, demangledName: newName };
        }
        return fn;
      });

      const updatedSymbols = prev.symbols.map((sym) => {
        if (sym.address === addr) {
          return { ...sym, name: newName, demangledName: newName };
        }
        return sym;
      });

      return {
        ...prev,
        functions: updatedFns,
        symbols: updatedSymbols
      };
    });

    if (selectedFunction && selectedFunction.address === addr) {
      setSelectedFunction((prev) => (prev ? { ...prev, name: newName, demangledName: newName } : null));
    }
  };

  // Comment handler
  const handleApplyComment = (addr: number, comment: string) => {
    setCurrentBinary((prev) => {
      const updatedFns = prev.functions.map((fn) => {
        const hasIns = fn.instructions.some((i) => i.address === addr);
        if (hasIns) {
          const nextIns = fn.instructions.map((ins) =>
            ins.address === addr ? { ...ins, comment: comment || undefined } : ins
          );
          return { ...fn, instructions: nextIns };
        }
        return fn;
      });

      return { ...prev, functions: updatedFns };
    });

    if (selectedFunction) {
      setSelectedFunction((prev) => {
        if (!prev) return null;
        const nextIns = prev.instructions.map((ins) =>
          ins.address === addr ? { ...ins, comment: comment || undefined } : ins
        );
        return { ...prev, instructions: nextIns };
      });
    }
  };

  // Change binary file
  const handleSelectBinary = (binary: BinaryFile) => {
    setCurrentBinary(binary);
    setSelectedFunction(binary.functions[0] || null);
    setSelectedAddress(binary.functions[0]?.address || binary.entryPoint);
    setHistory([binary.functions[0]?.address || binary.entryPoint]);
    setHistoryIndex(0);
  };

  return (
    <div className={`flex flex-col h-screen w-screen bg-[#111317] text-slate-200 overflow-hidden font-sans ${settings.theme}`}>
      {/* 1-Row, 3-Zone Top Bar Navigation */}
      <TopBar
        currentBinary={currentBinary}
        activeTier={activeTier}
        setActiveTier={setActiveTier}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenUpload={() => setShowUpload(true)}
        onToggleStringsDock={() => setIsBottomStringsOpen((prev) => !prev)}
        isStringsDockOpen={isBottomStringsOpen}
      />

      {/* Main Workspace Split (Sidebar + Central Canvas) */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Explorer Sidebar */}
        <Sidebar
          currentBinary={currentBinary}
          selectedFunction={selectedFunction}
          onSelectFunction={(fn) => {
            setSelectedFunction(fn);
            setSelectedAddress(fn.address);
          }}
          onNavigateAddress={navigateToAddress}
          selectedAddress={selectedAddress}
          onToggleBottomStringsDock={() => setIsBottomStringsOpen((prev) => !prev)}
          isBottomStringsDockOpen={isBottomStringsOpen}
        />

        {/* Central Viewport Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0e1015] relative overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
          {activeTier === 'disasm' && (
            <DisassemblyView
              currentBinary={currentBinary}
              selectedFunction={selectedFunction}
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
              onNavigateAddress={navigateToAddress}
              onToggleGraph={() => setActiveTier('graph')}
              onTogglePseudoC={() => setActiveTier('pseudo_c')}
              onOpenXrefs={(addr) => {
                setXrefTargetAddress(addr);
                setShowXrefs(true);
              }}
              onOpenRename={(addr, name) => setRenameTarget({ address: addr, name })}
              onOpenComment={(addr, comment) => setCommentTarget({ address: addr, comment })}
              settings={settings}
              canGoBack={historyIndex > 0}
              canGoForward={historyIndex < history.length - 1}
              onHistoryBack={handleHistoryBack}
              onHistoryForward={handleHistoryForward}
            />
          )}

          {activeTier === 'graph' && (
            <CFGGraphView
              selectedFunction={selectedFunction}
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
              onToggleLinear={() => setActiveTier('disasm')}
              settings={settings}
            />
          )}

          {(activeTier === 'llil' || activeTier === 'mlil' || activeTier === 'hlil') && (
            <ILView
              selectedFunction={selectedFunction}
              onNavigateAddress={navigateToAddress}
            />
          )}

          {activeTier === 'pseudo_c' && (
            <PseudoCView
              selectedFunction={selectedFunction}
              onToggleDisasm={() => setActiveTier('disasm')}
              onOpenRename={(addr, name) => setRenameTarget({ address: addr, name })}
            />
          )}

          {activeTier === 'flirt_lumina' && (
            <FlirtLuminaView
              currentBinary={currentBinary}
              selectedFunction={selectedFunction}
              onUpdateBinary={setCurrentBinary}
              onNavigateAddress={navigateToAddress}
            />
          )}

          {activeTier === 'scripting' && (
            <ScriptingConsoleView
              currentBinary={currentBinary}
              onUpdateBinary={setCurrentBinary}
            />
          )}

          {activeTier === 'plugins' && (
            <PluginManagerView
              currentBinary={currentBinary}
              onOpenRikugan={() => setActiveTier('rikugan')}
            />
          )}

          {activeTier === 'hex' && (
            <HexEditorView
              currentBinary={currentBinary}
              onUpdateBinary={setCurrentBinary}
            />
          )}

          {activeTier === 'rikugan' && (
            <RikuganView
              currentBinary={currentBinary}
              selectedFunction={selectedFunction}
              selectedAddress={selectedAddress}
              onUpdateBinary={setCurrentBinary}
              onNavigateAddress={navigateToAddress}
              onExecuteScript={(code, lang) => {
                setActiveTier('scripting');
              }}
            />
          )}
          </div>

          {/* Bottom Dockable Strings Window (IDA Pro Shift+F12) */}
          {isBottomStringsOpen && (
            <StringsDock
              currentBinary={currentBinary}
              onNavigateAddress={navigateToAddress}
              onOpenXrefs={(addr) => {
                setXrefTargetAddress(addr);
                setShowXrefs(true);
              }}
              onClose={() => setIsBottomStringsOpen(false)}
              height={bottomStringsHeight}
              onHeightChange={setBottomStringsHeight}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      {showCommandPalette && (
        <CommandPalette
          currentBinary={currentBinary}
          onNavigateAddress={navigateToAddress}
          onSelectFunction={(fn) => {
            setSelectedFunction(fn);
            setSelectedAddress(fn.address);
          }}
          onSelectTier={(tier) => setActiveTier(tier)}
          onClose={() => setShowCommandPalette(false)}
          onToggleStringsDock={() => setIsBottomStringsOpen((prev) => !prev)}
        />
      )}

      {showXrefs && (
        <XrefModal
          targetAddress={xrefTargetAddress}
          currentBinary={currentBinary}
          onNavigateAddress={navigateToAddress}
          onClose={() => setShowXrefs(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showUpload && (
        <UploadModal
          currentBinary={currentBinary}
          onSelectBinary={handleSelectBinary}
          onClose={() => setShowUpload(false)}
        />
      )}

      {renameTarget && (
        <RenameModal
          address={renameTarget.address}
          currentName={renameTarget.name}
          onApplyRename={handleApplyRename}
          onClose={() => setRenameTarget(null)}
        />
      )}

      {commentTarget && (
        <CommentModal
          address={commentTarget.address}
          currentComment={commentTarget.comment}
          onApplyComment={handleApplyComment}
          onClose={() => setCommentTarget(null)}
        />
      )}
    </div>
  );
}
