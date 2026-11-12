/**
 * VectorRE - Core Binary Analysis & RE Types
 * Unified model supporting Binary Ninja IL tiers & IDA Pro engine concepts
 */

export type BinaryFormat = 'Mach-O 64' | 'ELF64' | 'PE64' | 'Raw Binary';
export type Architecture = 'ARM64 (Apple Silicon)' | 'x86_64 (AMD64)' | 'ARM32' | 'MIPS32';

export type ViewTier = 'disasm' | 'llil' | 'mlil' | 'hlil' | 'pseudo_c' | 'graph';

export interface Section {
  name: string;
  virtualAddress: number;
  size: number;
  rawOffset: number;
  permissions: 'r-x' | 'rw-' | 'r--' | 'rwx';
  entropy: number; // 0.0 - 8.0 (Shannon entropy)
}

export type SymbolType = 'Function' | 'Import' | 'Export' | 'Data' | 'String' | 'Thunk';

export interface BinarySymbol {
  name: string;
  demangledName?: string;
  address: number;
  type: SymbolType;
  size?: number;
  section?: string;
  source?: 'Native' | 'FLIRT' | 'Lumina' | 'User';
}

export interface BinaryString {
  address: number;
  value: string;
  length: number;
  section: string;
  type: 'ASCII' | 'UTF-8' | 'UTF-16';
  xrefCount: number;
}

export type XrefType = 'CALL' | 'JUMP' | 'READ' | 'WRITE' | 'OFFSET' | 'DATA';

export interface Xref {
  sourceAddress: number;
  targetAddress: number;
  type: XrefType;
  sourceFunction?: string;
  instructionPreview: string;
}

export interface Instruction {
  address: number;
  bytes: string; // e.g. "55 48 89 e5"
  mnemonic: string;
  operands: string;
  comment?: string;
  isJump?: boolean;
  isCall?: boolean;
  isRet?: boolean;
  targetAddress?: number;
  xrefsCount?: number;
}

export interface ILInstruction {
  index: number;
  address: number;
  ilText: string;
  ssaVariables?: string[];
  operation?: string;
}

export interface BasicBlock {
  id: string;
  startAddress: number;
  endAddress: number;
  instructions: Instruction[];
  trueTarget?: number;
  falseTarget?: number;
  unconditionalTarget?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface FunctionItem {
  address: number;
  name: string;
  demangledName?: string;
  size: number;
  returnType: string;
  parameters: string[];
  callingConvention: 'cdecl' | 'stdcall' | 'fastcall' | 'arm64_aapcs' | 'system_v';
  instructions: Instruction[];
  blocks: BasicBlock[];
  llil: ILInstruction[];
  mlil: ILInstruction[];
  hlil: string[];
  pseudoC: string[];
  flirtMatch?: {
    library: string;
    signatureName: string;
    confidence: number;
  };
  luminaMatch?: {
    hash: string;
    canonicalName: string;
    popularity: number;
    author: string;
  };
}

export interface FlirtSignature {
  id: string;
  libraryName: string;
  pattern: string; // hex pattern with wildcard '..'
  functionName: string;
  version: string;
  targetArch: Architecture;
  enabled: boolean;
}

export interface LuminaRecord {
  hash: string;
  name: string;
  author: string;
  comment: string;
  prototype: string;
  popularity: number;
  timestamp: string;
}

export interface PluginItem {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  category: 'Analysis' | 'Decompiler' | 'Signatures' | 'UI' | 'Utility';
  enabled: boolean;
  code: string;
}

export type ThemeName = 'binja-charcoal' | 'ida-slate' | 'ida-classic' | 'monokai' | 'macos-midnight';

export interface WorkbenchSettings {
  theme: ThemeName;
  fontSize: number; // 11 - 16
  syntaxStyle: 'intel' | 'att';
  showHexBytes: boolean;
  showAddresses: boolean;
  showOpcodesInGraph: boolean;
  demangleSymbols: boolean;
  graphLayout: 'hierarchical' | 'orthogonal';
  graphSmoothTransitions: boolean;
  autoRunFlirt: boolean;
  luminaServerUrl: string;
  luminaMinConfidence: number;
}

export interface BinaryFile {
  id: string;
  filename: string;
  fileSize: number;
  format: BinaryFormat;
  architecture: Architecture;
  entryPoint: number;
  baseAddress: number;
  sections: Section[];
  symbols: BinarySymbol[];
  strings: BinaryString[];
  functions: FunctionItem[];
  xrefs: Xref[];
  rawBytes?: Uint8Array;
}
