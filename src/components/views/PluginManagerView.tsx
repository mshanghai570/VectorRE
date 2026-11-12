/**
 * VectorRE - Plugin Manager & Custom Plugin Developer Suite
 * Manages active plugins and allows creating and testing custom reverse engineering extensions.
 */

import React, { useState } from 'react';
import { Layers, Play, Plus, CheckCircle2, Shield, Code, Cpu, ExternalLink, Sparkles } from 'lucide-react';
import { BinaryFile, PluginItem } from '../../types/binary';
import { INITIAL_PLUGINS, executePlugin, PluginExecutionResult } from '../../services/pluginSystem';

interface PluginManagerViewProps {
  currentBinary: BinaryFile;
  onOpenRikugan?: () => void;
}

export const PluginManagerView: React.FC<PluginManagerViewProps> = ({ currentBinary, onOpenRikugan }) => {
  const [plugins, setPlugins] = useState<PluginItem[]>(INITIAL_PLUGINS);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginItem>(INITIAL_PLUGINS[0]);
  const [lastResult, setLastResult] = useState<PluginExecutionResult | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // New plugin form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<PluginItem['category']>('Analysis');
  const [newDesc, setNewDesc] = useState('');
  const [newCode, setNewCode] = useState(`// Custom VectorRE Plugin
export function run(bv) {
  console.log("Analyzing binary: " + bv.filename);
  return { status: "OK", count: bv.functions.length };
}`);

  const togglePlugin = (id: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleRunPlugin = (plugin: PluginItem) => {
    const result = executePlugin(plugin, currentBinary);
    setLastResult(result);
  };

  const handleCreatePlugin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPlugin: PluginItem = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      author: 'User Analyst',
      version: '1.0.0',
      description: newDesc.trim() || 'Custom user created reverse engineering plugin.',
      category: newCategory,
      enabled: true,
      code: newCode
    };

    setPlugins((prev) => [newPlugin, ...prev]);
    setSelectedPlugin(newPlugin);
    setShowNewModal(false);
    setNewName('');
    setNewDesc('');
  };

  return (
    <div className="flex flex-col h-full bg-[#111317] font-mono text-xs text-slate-300 overflow-y-auto p-5 select-none space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#252936]">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Plugin Architecture & Extensions</span>
          </h2>
          <p className="text-slate-400 font-sans text-xs mt-1">
            Extend VectorRE with specialized analyzers, decompilation passes, and signature detectors.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-sans text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Plugin</span>
        </button>
      </div>

      {/* Execution Feedback Notification */}
      {lastResult && (
        <div
          className={`p-3 rounded-lg border flex items-center justify-between ${
            lastResult.success
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-sans">{lastResult.message}</span>
          </div>
          <button
            onClick={() => setLastResult(null)}
            className="text-xs hover:text-white underline font-sans"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Plugins List (Left) and Code Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Plugin Catalog */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-slate-400 font-sans font-semibold text-xs flex items-center justify-between">
            <span>Installed Extensions ({plugins.length})</span>
            <span>{plugins.filter((p) => p.enabled).length} active</span>
          </div>

          <div className="space-y-2">
            {plugins.map((plugin) => {
              const isSelected = selectedPlugin.id === plugin.id;
              return (
                <div
                  key={plugin.id}
                  onClick={() => setSelectedPlugin(plugin)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1a1e2a] border-cyan-500 shadow-md'
                      : 'bg-[#151720] border-[#252936] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-xs">{plugin.name}</h4>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                        by {plugin.author} · v{plugin.version}
                      </div>
                    </div>

                    {/* Enable Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plugin.enabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          togglePlugin(plugin.id);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans mt-2 line-clamp-2">
                    {plugin.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#232733]">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#202432] text-slate-300">
                      {plugin.category}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunPlugin(plugin);
                      }}
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-sans font-medium"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Execute</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code & Manifest Inspector */}
        <div className="lg:col-span-7 bg-[#151720] border border-[#252936] rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#252936]">
            <div>
              <h3 className="font-bold text-white">{selectedPlugin.name}</h3>
              <p className="text-slate-400 font-sans text-xs mt-0.5">
                Category: {selectedPlugin.category} · Status: {selectedPlugin.enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedPlugin.id === 'rikugan-ai-assistant' && onOpenRikugan && (
                <button
                  onClick={onOpenRikugan}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded font-sans text-xs font-medium transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Rikugan Assistant</span>
                </button>
              )}
              <button
                onClick={() => handleRunPlugin(selectedPlugin)}
                className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-sans text-xs font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run on {currentBinary.filename}</span>
              </button>
            </div>
          </div>

          <div className="mt-3 flex-1 flex flex-col min-h-[300px]">
            <div className="text-[11px] text-slate-400 font-sans mb-1 flex items-center justify-between">
              <span>Plugin Implementation (ES6 / SDK):</span>
              <span>Hooks: onBinaryLoaded, auditEntropy</span>
            </div>
            <textarea
              value={selectedPlugin.code}
              readOnly
              className="flex-1 p-3 bg-[#0c0d12] border border-[#232733] rounded text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Modal: Create Custom Plugin */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171a23] border border-[#2b3040] rounded-xl w-full max-w-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Create Custom Reverse Engineering Plugin</span>
            </h3>

            <form onSubmit={handleCreatePlugin} className="space-y-3 font-sans">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Plugin Name</label>
                <input
                  type="text"
                  placeholder="e.g. Firmware Register Extractor"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0f1117] border border-[#272b3a] rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-[#0f1117] border border-[#272b3a] rounded text-xs text-white focus:outline-none"
                  >
                    <option value="Analysis">Analysis</option>
                    <option value="Decompiler">Decompiler</option>
                    <option value="Signatures">Signatures</option>
                    <option value="Utility">Utility</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Short description..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0f1117] border border-[#272b3a] rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Plugin Code (JS/SDK)</label>
                <textarea
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  rows={6}
                  className="w-full p-2.5 bg-[#0f1117] border border-[#272b3a] rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium"
                >
                  Register Plugin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
