/**
 * VectorRE - Rikugan AI Service
 * Supports OpenAI-compatible endpoints (OpenAI, Ollama, OpenRouter, LM Studio, Groq),
 * model introspection, binary context serialization, smart patch extraction, and SDK automation.
 */

import { BinaryFile, FunctionItem } from '../types/binary';
import { RikuganConfig, RikuganMessage, ProposedPatch, ProposedScript, ProposedRename } from '../types/rikugan';

/**
 * Normalizes user-entered API endpoint URL
 */
export function normalizeEndpoint(url: string): string {
  let cleaned = url.trim().replace(/\/+$/, '');
  if (cleaned.endsWith('/chat/completions')) {
    cleaned = cleaned.replace(/\/chat\/completions$/, '');
  }
  return cleaned;
}

/**
 * Fetches available models from any OpenAI-compatible `/models` endpoint
 */
export async function fetchAvailableModels(endpoint: string, apiKey: string): Promise<string[]> {
  const base = normalizeEndpoint(endpoint);
  const modelsUrl = `${base}/models`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const response = await fetch(modelsUrl, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown network error');
    throw new Error(`HTTP ${response.status} from ${modelsUrl}: ${errorText.slice(0, 150)}`);
  }

  const data = await response.json();

  // Support standard OpenAI { data: [{ id: "..." }] }
  if (data && Array.isArray(data.data)) {
    const modelIds = data.data
      .map((m: any) => (typeof m === 'string' ? m : m.id || m.name))
      .filter(Boolean);
    if (modelIds.length > 0) return modelIds.sort();
  }

  // Support Ollama native { models: [{ name: "..." }] }
  if (data && Array.isArray(data.models)) {
    const modelIds = data.models
      .map((m: any) => m.name || m.id)
      .filter(Boolean);
    if (modelIds.length > 0) return modelIds.sort();
  }

  // Support array format [{ id: "..." }]
  if (Array.isArray(data)) {
    return data.map((m: any) => (typeof m === 'string' ? m : m.id || m.name)).filter(Boolean).sort();
  }

  return ['gpt-4o', 'gpt-4o-mini', 'deepseek-chat', 'llama3'];
}

/**
 * Constructs comprehensive binary context for Rikugan AI
 */
function serializeBinaryContext(binary: BinaryFile, currentFunction: FunctionItem | null, selectedAddress: number): string {
  let context = `TARGET BINARY CONTEXT:
File: ${binary.filename}
Format: ${binary.format}
Architecture: ${binary.architecture}
Base Address: 0x${binary.baseAddress.toString(16)}
Entry Point: 0x${binary.entryPoint.toString(16)}
Sections: ${binary.sections.map((s) => `${s.name} (VA: 0x${s.virtualAddress.toString(16)}, Entropy: ${s.entropy})`).join(', ')}
Total Functions: ${binary.functions.length}
Total Strings: ${binary.strings.length}
Active Address Focus: 0x${selectedAddress.toString(16)}
`;

  if (currentFunction) {
    context += `
ACTIVE FUNCTION FOCUS:
Name: ${currentFunction.demangledName || currentFunction.name}
Address: 0x${currentFunction.address.toString(16)}
Size: ${currentFunction.size} bytes
Calling Convention: ${currentFunction.callingConvention}
Parameters: (${currentFunction.parameters.join(', ')})
Returns: ${currentFunction.returnType}

DISASSEMBLY INSTRUCTIONS:
${currentFunction.instructions
  .map(
    (ins) =>
      `  0x${ins.address.toString(16)}: ${ins.bytes.padEnd(16, ' ')} ${ins.mnemonic.padEnd(8, ' ')} ${ins.operands} ${ins.comment ? `// ${ins.comment}` : ''}`
  )
  .join('\n')}

PSEUDO-C DECOMPILATION:
${currentFunction.pseudoC.join('\n')}
`;
  }

  return context;
}

/**
 * Main query function for Rikugan AI
 */
export async function queryRikugan(
  prompt: string,
  chatHistory: RikuganMessage[],
  config: RikuganConfig,
  binary: BinaryFile,
  currentFunction: FunctionItem | null,
  selectedAddress: number
): Promise<RikuganMessage> {
  const base = normalizeEndpoint(config.endpoint);
  const binaryContext = serializeBinaryContext(binary, currentFunction, selectedAddress);

  // If user configured endpoint and key, call real OpenAI-compatible endpoint
  if (config.apiKey.trim() || base.includes('localhost') || base.includes('127.0.0.1')) {
    try {
      const messagesPayload = [
        { role: 'system', content: `${config.systemPrompt}\n\n${binaryContext}` },
        ...chatHistory.slice(-6).map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        })),
        { role: 'user', content: prompt }
      ];

      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey.trim() ? { Authorization: `Bearer ${config.apiKey.trim()}` } : {})
        },
        body: JSON.stringify({
          model: config.selectedModel || 'gpt-4o',
          messages: messagesPayload,
          temperature: config.temperature ?? 0.2
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`API error ${res.status}: ${errText.slice(0, 180)}`);
      }

      const json = await res.json();
      const reply = json.choices?.[0]?.message?.content || 'No response generated by model.';

      return parseRikuganResponse(reply, binary, currentFunction);
    } catch (apiError: any) {
      console.warn('Rikugan live endpoint error, falling back to local analysis engine:', apiError);
      return generateOfflineAnalysis(prompt, binary, currentFunction, selectedAddress, `[Notice: Live endpoint error (${apiError.message}). Operating in offline analytical mode.]\n\n`);
    }
  }

  // Built-in intelligent offline engine (tailored to current binary)
  return generateOfflineAnalysis(prompt, binary, currentFunction, selectedAddress);
}

/**
 * Parses raw text from AI model into structured patches and scripts if present
 */
function parseRikuganResponse(replyText: string, binary: BinaryFile, currentFunction: FunctionItem | null): RikuganMessage {
  const proposedPatches: ProposedPatch[] = [];
  let proposedScript: ProposedScript | undefined = undefined;

  // Detect patch proposals like: "PATCH 0x100003a10: OLD(61 01 00 54) NEW(1f 20 03 d5)"
  const patchRegex = /(?:patch|modify)\s+(?:at\s+)?(0x[0-9a-fA-F]+)[^:\n]*:\s*(?:replace\s+)?(?:old:?\s*)?([0-9a-fA-F\s]{2,})\s*(?:with|new:?)\s*([0-9a-fA-F\s]{2,})/gi;
  let match;
  while ((match = patchRegex.exec(replyText)) !== null) {
    const addr = parseInt(match[1], 16);
    const oldBytes = match[2].trim();
    const newBytes = match[3].trim();
    proposedPatches.push({
      address: addr,
      oldBytes,
      newBytes,
      description: `Patch at 0x${addr.toString(16)}`,
      mnemonic: 'nop',
      operands: ''
    });
  }

  // Detect code blocks for scripts
  const jsCodeMatch = replyText.match(/```(?:javascript|js)\n([\s\S]*?)```/);
  if (jsCodeMatch) {
    proposedScript = {
      language: 'javascript',
      code: jsCodeMatch[1].trim(),
      title: 'VectorRE Automation Script'
    };
  }

  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    text: replyText,
    timestamp: new Date().toLocaleTimeString(),
    proposedPatches: proposedPatches.length > 0 ? proposedPatches : undefined,
    proposedScript
  };
}

/**
 * Built-in reverse engineering analysis engine for offline or pre-key testing
 */
function generateOfflineAnalysis(
  prompt: string,
  binary: BinaryFile,
  currentFunction: FunctionItem | null,
  selectedAddress: number,
  prefix = ''
): RikuganMessage {
  const q = prompt.toLowerCase();
  const fnName = currentFunction ? (currentFunction.demangledName || currentFunction.name) : '';

  // Case 1: Smart Patch or License / Anti-debug Bypass
  if (q.includes('patch') || q.includes('bypass') || q.includes('crack') || q.includes('license') || q.includes('debug')) {
    if (fnName.includes('validate') || fnName.includes('license') || currentFunction?.name.includes('validate')) {
      const patches: ProposedPatch[] = [
        {
          address: 0x100003a10,
          oldBytes: 'a1 00 00 54',
          newBytes: '1f 20 03 d5',
          description: 'NOP out branch to failure when ptrace debugger check trips',
          mnemonic: 'nop',
          operands: ''
        },
        {
          address: 0x100003a48,
          oldBytes: '41 01 00 54',
          newBytes: '1f 20 03 d5',
          description: 'NOP out conditional check on rolling checksum == 0x754DB2',
          mnemonic: 'nop',
          operands: ''
        }
      ];

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `${prefix}### Rikugan AI Smart Patch Analysis: \`${fnName}\`

I analyzed the control flow graph and instructions of \`${fnName}\` in **${binary.format} (${binary.architecture})**.

#### Critical Logic Flow:
1. **Anti-Debug Verification (@ 0x100003a08)**: Invokes \`_check_ptrace_antidebug\`. If \`x0 != 0\`, \`b.ne loc_100003a70\` aborts validation.
2. **Serial Length Check (@ 0x100003a18)**: Verifies input key length equals \`23\` characters.
3. **Rolling Checksum Accumulator (@ 0x100003a20–0x100003a38)**:
   Computes \`rolling_checksum = (rolling_checksum << 3) + input[i]\` across all 23 bytes.
4. **Target Constant Check (@ 0x100003a44)**:
   Compares accumulator with magic constant **\`0x754DB2\`** (\`7,687,602\`).
5. **Activation Trigger (@ 0x100003a54)**: Calls \`_show_activation_success\` and returns \`1\`.

#### Proposed Smart Patches:
- **Patch A**: Overwrite \`b.ne loc_100003a48\` with ARM64 \`NOP\` (\`1f 20 03 d5\`) to bypass the serial checksum validation.
- **Patch B**: NOP out the anti-debug conditional jump at \`0x100003a10\`.

Click **Apply Smart Patch** below to write the changes directly into the binary memory image.`,
        timestamp: new Date().toLocaleTimeString(),
        proposedPatches: patches
      };
    }

    if (fnName.includes('ptrace') || fnName.includes('debug')) {
      const patches: ProposedPatch[] = [
        {
          address: 0x100003b54,
          oldBytes: '6b 06 00 94',
          newBytes: '1f 20 03 d5',
          description: 'NOP out bl _ptrace call (PT_DENY_ATTACH = 31)',
          mnemonic: 'nop',
          operands: ''
        }
      ];

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `${prefix}### Rikugan Anti-Debug Disarm: \`_check_ptrace_antidebug\`

This function prepares arguments \`x0 = 31\` (\`PT_DENY_ATTACH\` in Darwin \`<sys/ptrace.h>\`) and invokes \`bl _ptrace\`. When attached under LLDB or GDB, the Darwin kernel immediately issues a \`SIGKILL\` signal.

#### Proposed Smart Patch:
We replace \`bl _ptrace\` at \`0x100003b54\` with an ARM64 \`NOP\` (\`0x1F 0x20 0x03 0xD5\`) and force return status \`0\`.`,
        timestamp: new Date().toLocaleTimeString(),
        proposedPatches: patches
      };
    }
  }

  // Case 2: Automation Script Request
  if (q.includes('script') || q.includes('javascript') || q.includes('automate') || q.includes('sdk')) {
    const script: ProposedScript = {
      language: 'javascript',
      title: 'Scan Binary Strings & Trace Cross-References',
      code: `// Rikugan Automation Script for VectorRE SDK
console.log("[Rikugan] Auditing binary: " + bv.filename);

const authStrings = bv.get_strings().filter(s => 
  /key|token|auth|secret|license/i.test(s.value)
);

console.log(\`[+] Found \${authStrings.length} candidate security strings:\`);
authStrings.forEach(s => {
  console.log(\`    [0x\${s.address.toString(16)}] "\${s.value}" (\${s.xrefCount} xrefs)\`);
  const xrefs = bv.get_xrefs_to(s.address);
  xrefs.forEach(x => {
    console.log(\`       <- from 0x\${x.sourceAddress.toString(16)} (\${x.sourceFunction})\`);
  });
});

console.log("[+] Audit complete.");`
    };

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `${prefix}### Rikugan Automation Script Generator

Here is an automated JavaScript script leveraging the **VectorRE SDK API** to scan the loaded binary (\`${binary.filename}\`) for sensitive string tokens and follow cross-references directly into calling functions:

\`\`\`javascript
${script.code}
\`\`\`

You can click **Run Script in Console** below to immediately execute this inside the VectorRE automation runtime.`,
      timestamp: new Date().toLocaleTimeString(),
      proposedScript: script
    };
  }

  // Case 3: Explain Decompilation or Current Function
  if (q.includes('explain') || q.includes('decompile') || q.includes('analyze') || q.includes('what does')) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `${prefix}### Architectural Breakdown of \`${fnName || 'Selected Routine'}\`

**Binary:** ${binary.filename} (${binary.architecture} / ${binary.format})  
**Address:** \`0x${(currentFunction?.address || selectedAddress).toString(16)}\`

#### Key Insights:
1. **Calling Convention:** \`${currentFunction?.callingConvention || 'arm64_aapcs'}\` passing arguments via registers.
2. **Control Flow Graph:** Contains ${currentFunction?.blocks.length || 4} basic blocks linked by conditional branches and fall-through edges.
3. **Decompiled Logic:**
   - Evaluates input state against security preconditions.
   - Computes state transformations using bitwise shifts and arithmetic masks.
   - Dispatches status to caller or invokes activation handlers.

Would you like me to **propose a smart patch** for this routine, or **generate an automation script**?`,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // Default general response
  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    text: `${prefix}Hello! I am **Rikugan AI**, your autonomous reverse engineering assistant for **VectorRE**.

I can assist you with:
- 🔍 **Binary Exploration**: Query symbols, sections, strings, and cross-references.
- ⚡ **Smart Patching**: Propose and apply byte patches (NOP anti-debug, invert conditionals, bypass validation checks).
- 🧬 **Decompiler Explanation**: Analyze Medium-Level IL (MLIL SSA) and Pseudo-C code.
- ⚙️ **Automation Scripts**: Write and execute JavaScript / Python automation via the VectorRE SDK.

Configure your OpenAI-compatible endpoint (OpenAI, Ollama, LM Studio, OpenRouter, Groq) in settings above, or click one of the quick actions below!`,
    timestamp: new Date().toLocaleTimeString()
  };
}
