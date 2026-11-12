/**
 * VectorRE - Rikugan AI Assistant View
 * Autonomous AI reverse engineering assistant capable of binary exploration,
 * smart patching, decompilation analysis, and SDK JavaScript automation with
 * dynamic OpenAI-compatible endpoint & model loading.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Settings, Sparkles, Shield, Code, Play, Check, AlertCircle, RefreshCw, Eye, EyeOff, Layers, ExternalLink, Zap } from 'lucide-react';
import { BinaryFile, FunctionItem } from '../../types/binary';
import { DEFAULT_RIKUGAN_CONFIG, ProposedPatch, ProposedScript, RikuganConfig, RikuganMessage } from '../../types/rikugan';
import { fetchAvailableModels, queryRikugan } from '../../services/rikuganService';

interface RikuganViewProps {
  currentBinary: BinaryFile;
  selectedFunction: FunctionItem | null;
  selectedAddress: number;
  onUpdateBinary: (updater: (prev: BinaryFile) => BinaryFile) => void;
  onNavigateAddress: (addr: number) => void;
  onExecuteScript?: (code: string, language: string) => void;
}

export const RikuganView: React.FC<RikuganViewProps> = ({
  currentBinary,
  selectedFunction,
  selectedAddress,
  onUpdateBinary,
  onNavigateAddress,
  onExecuteScript
}) => {
  const [config, setConfig] = useState<RikuganConfig>(() => {
    const saved = localStorage.getItem('rikugan_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_RIKUGAN_CONFIG;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appliedPatches, setAppliedPatches] = useState<Record<number, boolean>>({});
  const [messages, setMessages] = useState<RikuganMessage[]>([
    {
      id: 'init-rikugan',
      sender: 'assistant',
      text: `Hello, reverse engineer! I am **Rikugan AI**, your autonomous coding assistant for **VectorRE**.

I have indexed the active binary **${currentBinary.filename}** (${currentBinary.architecture} / ${currentBinary.format}) and selected routine **${selectedFunction?.demangledName || selectedFunction?.name || 'none'}**.

How can I assist you with this binary today?
- ⚡ **Smart Patching**: Propose byte patches (NOP anti-debugging, bypass checksums/license checks).
- 🔍 **Binary Exploration**: Dissect control flow graphs, strings, entropy, and cross-references.
- 🧬 **Decompiler Analysis**: Explain algorithms and improve decompiled Pseudo-C naming.
- ⚙️ **SDK Automation**: Write and run JavaScript automation tasks.`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Settings form state
  const [tempEndpoint, setTempEndpoint] = useState(config.endpoint);
  const [tempApiKey, setTempApiKey] = useState(config.apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsStatus, setModelsStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save config to state and localStorage
  const handleSaveConfig = (newCfg: RikuganConfig) => {
    setConfig(newCfg);
    localStorage.setItem('rikugan_config', JSON.stringify(newCfg));
    setShowSettings(false);
  };

  // Load available models button handler
  const handleLoadModels = async () => {
    if (!tempEndpoint.trim()) return;
    setIsLoadingModels(true);
    setModelsStatus(null);

    try {
      const models = await fetchAvailableModels(tempEndpoint, tempApiKey);
      if (models.length === 0) {
        throw new Error('No models found at endpoint.');
      }

      const updatedConfig = {
        ...config,
        endpoint: tempEndpoint,
        apiKey: tempApiKey,
        availableModels: models,
        selectedModel: models[0] || config.selectedModel
      };

      setConfig(updatedConfig);
      localStorage.setItem('rikugan_config', JSON.stringify(updatedConfig));
      setModelsStatus({
        type: 'success',
        message: `Successfully loaded ${models.length} model(s) from endpoint!`
      });
    } catch (err: any) {
      setModelsStatus({
        type: 'error',
        message: `Failed to load models: ${err.message}`
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Presets handler
  const handleSelectPreset = (name: string, ep: string, defaultModel: string) => {
    setTempEndpoint(ep);
    setConfig((prev) => ({
      ...prev,
      endpoint: ep,
      selectedModel: defaultModel
    }));
  };

  // Send message to Rikugan AI
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    const userMsg: RikuganMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await queryRikugan(
        text,
        [...messages, userMsg],
        config,
        currentBinary,
        selectedFunction,
        selectedAddress
      );
      setMessages((prev) => [...prev, response]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `Error analyzing with Rikugan AI: ${err.message}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply Smart Patch directly to binary instructions and byte array
  const handleApplyPatch = (patch: ProposedPatch) => {
    onUpdateBinary((prev) => {
      const updatedFunctions = prev.functions.map((fn) => {
        const hasIns = fn.instructions.some((ins) => ins.address === patch.address);
        if (hasIns) {
          const nextIns = fn.instructions.map((ins) => {
            if (ins.address === patch.address) {
              return {
                ...ins,
                bytes: patch.newBytes,
                mnemonic: patch.mnemonic,
                operands: patch.operands,
                comment: `[Rikugan Smart Patch] ${patch.description}`
              };
            }
            return ins;
          });

          // Also update basic blocks if present
          const nextBlocks = fn.blocks.map((b) => {
            const hasBlockIns = b.instructions.some((ins) => ins.address === patch.address);
            if (hasBlockIns) {
              return {
                ...b,
                instructions: b.instructions.map((ins) =>
                  ins.address === patch.address
                    ? {
                        ...ins,
                        bytes: patch.newBytes,
                        mnemonic: patch.mnemonic,
                        operands: patch.operands,
                        comment: `[Rikugan Patch] ${patch.description}`
                      }
                    : ins
                )
              };
            }
            return b;
          });

          return { ...fn, instructions: nextIns, blocks: nextBlocks };
        }
        return fn;
      });

      return {
        ...prev,
        functions: updatedFunctions
      };
    });

    setAppliedPatches((prev) => ({ ...prev, [patch.address]: true }));
    onNavigateAddress(patch.address);
  };

  return (
    <div className="flex flex-col h-full bg-[#101217] text-slate-200 font-sans text-xs select-none relative">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#161822] border-b border-[#252936] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs tracking-wide">Rikugan AI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                {config.selectedModel}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
              {config.endpoint}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white bg-[#1e2330] hover:bg-[#282f42] rounded border border-[#2d3345] transition-colors"
            title="Configure OpenAI endpoint, API key, and models"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Endpoint Settings</span>
          </button>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 max-w-3xl ${
                isUser ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="font-medium text-slate-400">
                  {isUser ? 'You (Analyst)' : 'Rikugan AI'}
                </span>
                <span>·</span>
                <span className="tabular-nums font-mono">{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-cyan-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-[#171a24] text-slate-200 border border-[#272b38] rounded-tl-none shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans selection:bg-cyan-500/40">
                  {msg.text}
                </div>

                {/* Proposed Smart Patches Card */}
                {msg.proposedPatches && msg.proposedPatches.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#2a2f3f] space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-300 text-[11px]">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Rikugan Actionable Smart Patches</span>
                    </div>

                    {msg.proposedPatches.map((patch, pIdx) => {
                      const isApplied = appliedPatches[patch.address];
                      return (
                        <div
                          key={pIdx}
                          className="p-2.5 bg-[#101218] border border-[#292e3e] rounded-lg flex flex-col gap-2 font-mono text-[11px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-400 font-bold">
                              0x{patch.address.toString(16)}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {patch.description}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-rose-400 line-through">
                              {patch.oldBytes}
                            </span>
                            <span>→</span>
                            <span className="text-emerald-400 font-bold">
                              {patch.newBytes}
                            </span>
                          </div>

                          <button
                            onClick={() => handleApplyPatch(patch)}
                            disabled={isApplied}
                            className={`flex items-center justify-center gap-1.5 py-1 px-3 rounded font-sans text-xs font-medium transition-colors ${
                              isApplied
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-600 hover:bg-amber-500 text-white'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Patch Applied to Binary</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5" />
                                <span>Apply Smart Patch</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Proposed Automation Script Card */}
                {msg.proposedScript && (
                  <div className="mt-3 pt-3 border-t border-[#2a2f3f] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-cyan-300 text-[11px]">
                        <Code className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{msg.proposedScript.title}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#202534] text-slate-300 rounded uppercase font-mono">
                        {msg.proposedScript.language}
                      </span>
                    </div>

                    <pre className="p-2.5 bg-[#0d0e14] border border-[#242938] rounded font-mono text-[11px] text-slate-200 overflow-x-auto">
                      {msg.proposedScript.code}
                    </pre>

                    {onExecuteScript && (
                      <button
                        onClick={() => onExecuteScript(msg.proposedScript!.code, msg.proposedScript!.language)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-sans font-medium transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Execute in SDK Console</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-[#171a24] border border-[#272b38] rounded-xl text-slate-400 max-w-xs">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-xs">Rikugan AI is analyzing binary context...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Recommendation Chips */}
      <div className="px-5 py-2 border-t border-[#232734] bg-[#12141c] flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-slate-500 font-medium shrink-0">Quick Prompts:</span>
        <button
          onClick={() => handleSendMessage('Explain the decompiled logic and control flow of the current function.')}
          className="px-2.5 py-1 bg-[#1a1e2b] hover:bg-[#23293a] text-slate-300 hover:text-white rounded whitespace-nowrap transition-colors"
        >
          🔍 Explain Logic
        </button>
        <button
          onClick={() => handleSendMessage('Propose a smart patch to bypass license key or checksum validation.')}
          className="px-2.5 py-1 bg-[#1a1e2b] hover:bg-[#23293a] text-amber-300 hover:text-amber-200 rounded whitespace-nowrap transition-colors"
        >
          ⚡ Smart Patch Check
        </button>
        <button
          onClick={() => handleSendMessage('Analyze anti-debugging ptrace mechanisms in this binary.')}
          className="px-2.5 py-1 bg-[#1a1e2b] hover:bg-[#23293a] text-slate-300 hover:text-white rounded whitespace-nowrap transition-colors"
        >
          🛡️ Disarm Anti-Debug
        </button>
        <button
          onClick={() => handleSendMessage('Generate a JavaScript automation script to audit all strings and XREFs.')}
          className="px-2.5 py-1 bg-[#1a1e2b] hover:bg-[#23293a] text-cyan-300 hover:text-cyan-200 rounded whitespace-nowrap transition-colors"
        >
          ⚙️ Generate Script
        </button>
      </div>

      {/* Message Input Bar */}
      <div className="p-4 bg-[#141620] border-t border-[#232734]">
        <div className="relative flex items-center">
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Ask Rikugan AI about ${currentBinary.filename} (Press Enter to send)...`}
            rows={2}
            className="w-full pl-3 pr-12 py-2 bg-[#0c0d12] border border-[#272b3a] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-sans"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isLoading}
            className="absolute right-2 top-2 p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md disabled:opacity-30 transition-colors"
            title="Send Message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Settings Modal: OpenAI Endpoint & Load Models */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171a24] border border-[#2d3345] rounded-xl w-full max-w-xl shadow-2xl p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#272b3a]">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Rikugan AI Endpoint Configuration</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Provider Quick Presets */}
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Quick Provider Presets</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('OpenAI', 'https://api.openai.com/v1', 'gpt-4o')}
                  className="px-2.5 py-1 rounded bg-[#202534] hover:bg-[#2a3144] text-slate-200 text-[11px]"
                >
                  OpenAI
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('Ollama', 'http://localhost:11434/v1', 'llama3')}
                  className="px-2.5 py-1 rounded bg-[#202534] hover:bg-[#2a3144] text-slate-200 text-[11px]"
                >
                  Ollama (Local)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('LM Studio', 'http://localhost:1234/v1', 'local-model')}
                  className="px-2.5 py-1 rounded bg-[#202534] hover:bg-[#2a3144] text-slate-200 text-[11px]"
                >
                  LM Studio
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('OpenRouter', 'https://openrouter.ai/api/v1', 'anthropic/claude-3.5-sonnet')}
                  className="px-2.5 py-1 rounded bg-[#202534] hover:bg-[#2a3144] text-slate-200 text-[11px]"
                >
                  OpenRouter
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('Groq', 'https://api.groq.com/openai/v1', 'llama-3.1-70b-versatile')}
                  className="px-2.5 py-1 rounded bg-[#202534] hover:bg-[#2a3144] text-slate-200 text-[11px]"
                >
                  Groq
                </button>
              </div>
            </div>

            {/* Endpoint Input */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                OpenAI-Compatible Endpoint URL
              </label>
              <input
                type="text"
                placeholder="e.g. https://api.openai.com/v1 or http://localhost:11434/v1"
                value={tempEndpoint}
                onChange={(e) => setTempEndpoint(e.target.value)}
                className="w-full px-3 py-2 bg-[#0e1016] border border-[#292f40] rounded text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Provider API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-... or provider token (optional for local Ollama / LM Studio)"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-[#0e1016] border border-[#292f40] rounded text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"
                  title={showApiKey ? 'Hide key' : 'Show key'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* "Load Available Models" Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleLoadModels}
                disabled={isLoadingModels || !tempEndpoint.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded font-medium transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
                <span>{isLoadingModels ? 'Querying /models...' : 'Load Available Models'}</span>
              </button>
            </div>

            {/* Model Loading Status Feedback */}
            {modelsStatus && (
              <div
                className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                  modelsStatus.type === 'success'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                }`}
              >
                {modelsStatus.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{modelsStatus.message}</span>
              </div>
            )}

            {/* Model Selection Dropdown */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Active Model ({config.availableModels.length} available)
              </label>
              <select
                value={config.selectedModel}
                onChange={(e) => setConfig({ ...config, selectedModel: e.target.value })}
                className="w-full px-3 py-2 bg-[#0e1016] border border-[#292f40] rounded text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              >
                {config.availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Temperature</span>
                <span className="font-mono text-cyan-400">{config.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1 bg-[#282d3b] rounded cursor-pointer"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#272b3a]">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-3 py-1.5 rounded text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSaveConfig({
                    ...config,
                    endpoint: tempEndpoint,
                    apiKey: tempApiKey
                  })
                }
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
