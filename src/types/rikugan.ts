/**
 * VectorRE - Rikugan AI Assistant Types
 * Configuration and message schemas for OpenAI-compatible binary analysis assistant.
 */

export interface RikuganConfig {
  endpoint: string;
  apiKey: string;
  selectedModel: string;
  availableModels: string[];
  temperature: number;
  systemPrompt: string;
}

export interface ProposedPatch {
  address: number;
  oldBytes: string;
  newBytes: string;
  description: string;
  mnemonic: string;
  operands: string;
}

export interface ProposedScript {
  language: 'javascript' | 'swift' | 'python';
  code: string;
  title: string;
}

export interface ProposedRename {
  address: number;
  oldName: string;
  newName: string;
}

export interface RikuganMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  proposedPatches?: ProposedPatch[];
  proposedScript?: ProposedScript;
  proposedRenames?: ProposedRename[];
}

export const DEFAULT_RIKUGAN_CONFIG: RikuganConfig = {
  endpoint: 'https://api.openai.com/v1',
  apiKey: '',
  selectedModel: 'gpt-4o',
  availableModels: [
    'gpt-4o',
    'gpt-4o-mini',
    'o1-mini',
    'gpt-4-turbo',
    'deepseek-chat',
    'deepseek-coder',
    'claude-3-5-sonnet',
    'llama3:70b'
  ],
  temperature: 0.2,
  systemPrompt: `You are Rikugan AI, an expert software reverse engineering assistant combining the capabilities of Binary Ninja and IDA Pro.
You analyze disassembly, Low-Level IL (LLIL), Medium-Level IL (MLIL SSA), High-Level IL (HLIL), and Pseudo-C decompilation.
When requested, you explore binary architecture, explain algorithms, identify security guards (such as anti-debug checks, license checks, or cryptographic hashing), propose safe byte-level patches, and generate automation scripts.`
};
