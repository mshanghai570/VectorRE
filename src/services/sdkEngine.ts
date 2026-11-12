/**
 * VectorRE - Scripting Console & Automation SDK Engine
 * Supports Binary Ninja Python API, IDA Pro IDC/Python API, and macOS Swift SDK.
 */

import { BinaryFile, FunctionItem } from '../types/binary';
import { runFlirtScan } from './flirtEngine';
import { queryLuminaForBinary } from './luminaService';

export type ScriptEngine = 'python' | 'swift' | 'javascript';

export interface ConsoleOutput {
  id: string;
  type: 'stdout' | 'stderr' | 'return' | 'info';
  text: string;
  timestamp: string;
}

export interface PresetScript {
  id: string;
  name: string;
  engine: ScriptEngine;
  description: string;
  code: string;
}

export const PRESET_SCRIPTS: PresetScript[] = [
  {
    id: 'script-swift-macho-scan',
    name: 'macOS Swift Mach-O Symbol & String Extractor',
    engine: 'swift',
    description: 'Inspects macOS Mach-O load commands, Swift demangled names, and critical security strings.',
    code: `// VectorRE Swift Automation SDK (macOS Compatible)
import Foundation
import BinaryViewKit

func auditBinary(bv: BinaryView) {
    print("[+] Loading Mach-O binary: \\(bv.filename)")
    print("[+] Format: \\(bv.format) | Architecture: \\(bv.architecture)")
    
    let criticalStrings = bv.getStrings().filter { $0.value.contains("KEY") || $0.value.contains("Debugger") }
    print("[+] Found \\(criticalStrings.count) security-sensitive strings:")
    for s in criticalStrings {
        print("    [0x\\(String(s.address, radix: 16))] \\(s.value) (xrefs: \\(s.xrefCount))")
    }
    
    print("[+] Enumerating functions:")
    for fn in bv.functions {
        let name = fn.demangledName ?? fn.name
        print("    Function @ 0x\\(String(fn.address, radix: 16)): \\(name) [\\(fn.size) bytes]")
    }
}

auditBinary(bv: currentBinary)`
  },
  {
    id: 'script-py-find-xrefs',
    name: 'IDA Pro / Binja XREF & String Hunter (Python)',
    engine: 'python',
    description: 'Finds all data cross-references to strings containing auth/license tokens.',
    code: `# Binary Ninja & IDA Pro Hybrid Python API
for s in bv.get_strings():
    if any(k in s.value.lower() for k in ["license", "token", "auth", "ptrace"]):
        print(f"[XREF SCAN] Found string at 0x{s.address:x}: '{s.value}'")
        xrefs = bv.get_xrefs_to(s.address)
        print(f"    Total references: {len(xrefs)}")
        for x in xrefs:
            print(f"    <- from 0x{x.sourceAddress:x} ({x.sourceFunction}): {x.instructionPreview}")
`
  },
  {
    id: 'script-py-auto-rename',
    name: 'Auto-Rename sub_* from String References (Python)',
    engine: 'python',
    description: 'Automatically annotates sub_ addresses with meaningful labels from string arguments.',
    code: `# IDA Pro Style Auto-Namer
renamed_count = 0
for fn in bv.functions:
    if fn.name.startswith("sub_"):
        for ins in fn.instructions:
            if "string ref:" in (ins.comment or ""):
                candidate = ins.comment.split('"')[1].strip()
                clean_name = "sub_ref_" + "".join(c if c.isalnum() else "_" for c in candidate[:16])
                print(f"[RENAME] 0x{fn.address:x}: {fn.name} -> {clean_name}")
                bv.set_name(fn.address, clean_name)
                renamed_count += 1
                break

print(f"[+] Total functions renamed: {renamed_count}")
`
  },
  {
    id: 'script-js-flirt-lumina-batch',
    name: 'Batch FLIRT + Lumina Metadata Resolver (JS)',
    engine: 'javascript',
    description: 'Applies library signatures and queries Lumina metadata for unidentified functions.',
    code: `// JavaScript Automation SDK
console.log("[*] Executing FLIRT signature pass...");
const flirtResult = bv.runFlirtScan();
console.log(\`[+] FLIRT matched \${flirtResult.matches.length} library functions.\`);

console.log("[*] Querying Lumina Cloud Metadata...");
const luminaResult = await bv.queryLuminaServer();
console.log(\`[+] Lumina identified \${luminaResult.results.filter(r => r.status === 'FOUND').length} functions.\`);
`
  }
];

export async function executeConsoleScript(
  code: string,
  engine: ScriptEngine,
  binary: BinaryFile,
  updateBinary: (updater: (prev: BinaryFile) => BinaryFile) => void
): Promise<ConsoleOutput[]> {
  const outputs: ConsoleOutput[] = [];
  const log = (text: string, type: ConsoleOutput['type'] = 'stdout') => {
    outputs.push({
      id: Math.random().toString(36).substring(2, 9),
      type,
      text,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  log(`[${engine.toUpperCase()}] Running script against ${binary.filename}...`, 'info');

  try {
    if (engine === 'swift') {
      log(`[Swift Runtime] Initializing BinaryViewKit environment (macOS ARM64 target)...`, 'info');
      // Simulate Swift execution
      log(`[+] Loading Mach-O binary: ${binary.filename}`);
      log(`[+] Format: ${binary.format} | Architecture: ${binary.architecture}`);
      
      const critical = binary.strings.filter((s) => /key|debugger|auth|license/i.test(s.value));
      log(`[+] Found ${critical.length} security-sensitive strings:`);
      critical.forEach((s) => {
        log(`    [0x${s.address.toString(16)}] "${s.value}" (xrefs: ${s.xrefCount})`);
      });

      log(`[+] Enumerated ${binary.functions.length} functions.`);
      binary.functions.forEach((fn) => {
        const name = fn.demangledName || fn.name;
        log(`    Function @ 0x${fn.address.toString(16)}: ${name} [${fn.size} bytes]`);
      });
      log(`Execution finished with exit code 0.`, 'return');
      return outputs;
    }

    if (engine === 'python') {
      log(`[Python 3.11] Loading BinaryNinja & IDA API wrappers...`, 'info');
      
      if (code.includes('get_xrefs_to') || code.includes('get_strings')) {
        binary.strings.forEach((s) => {
          if (/license|token|auth|ptrace/i.test(s.value)) {
            log(`[XREF SCAN] Found string at 0x${s.address.toString(16)}: '${s.value}'`);
            const refs = binary.xrefs.filter((x) => x.targetAddress === s.address);
            log(`    Total references: ${refs.length}`);
            refs.forEach((x) => {
              log(`    <- from 0x${x.sourceAddress.toString(16)} (${x.sourceFunction}): ${x.instructionPreview}`);
            });
          }
        });
      }

      if (code.includes('set_name') || code.includes('Auto-Namer')) {
        let renamed = 0;
        updateBinary((prev) => {
          const newFns = prev.functions.map((fn) => {
            if (fn.name.startsWith('sub_')) {
              const strIns = fn.instructions.find((i) => i.comment?.includes('string ref:'));
              if (strIns && strIns.comment) {
                const cand = strIns.comment.split('"')[1] || 'sub_annotated';
                const clean = `sub_ref_${cand.slice(0, 12).replace(/[^a-zA-Z0-9]/g, '_')}`;
                renamed++;
                log(`[RENAME] 0x${fn.address.toString(16)}: ${fn.name} -> ${clean}`);
                return { ...fn, name: clean };
              }
            }
            return fn;
          });
          return { ...prev, functions: newFns };
        });
        log(`[+] Total functions renamed: ${renamed}`);
      }

      log(`>>> Return value: None`, 'return');
      return outputs;
    }

    if (engine === 'javascript') {
      if (code.includes('runFlirtScan')) {
        log(`[*] Executing FLIRT signature pass...`);
        const flirtResult = runFlirtScan(binary);
        updateBinary((prev) => ({ ...prev, functions: flirtResult.updatedFunctions }));
        log(`[+] FLIRT matched ${flirtResult.matches.length} library functions.`);
      }

      if (code.includes('queryLumina')) {
        log(`[*] Querying Lumina Cloud Metadata...`);
        const luminaResult = await queryLuminaForBinary(binary);
        updateBinary((prev) => ({ ...prev, functions: luminaResult.updatedFunctions }));
        const found = luminaResult.results.filter((r) => r.status === 'FOUND').length;
        log(`[+] Lumina identified ${found} functions.`);
      }

      log(`Script completed successfully.`, 'return');
      return outputs;
    }

    log(`Executed script cleanly.`, 'return');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    log(`Script error: ${errorMsg}`, 'stderr');
  }

  return outputs;
}
