/**
 * VectorRE - Pre-loaded High Fidelity Binary Samples
 * Includes macOS ARM64 Mach-O, Linux x86_64 ELF, and Windows PE64
 */

import { BinaryFile } from '../types/binary';

export const SAMPLE_BINARIES: BinaryFile[] = [
  {
    id: 'sample-macos-arm64',
    filename: 'keygen_crackme_macos_arm64.dylib',
    fileSize: 49152,
    format: 'Mach-O 64',
    architecture: 'ARM64 (Apple Silicon)',
    entryPoint: 0x100003ea0,
    baseAddress: 0x100000000,
    sections: [
      { name: '__TEXT.__text', virtualAddress: 0x100003000, size: 0x2400, rawOffset: 0x1000, permissions: 'r-x', entropy: 6.12 },
      { name: '__TEXT.__stubs', virtualAddress: 0x100005400, size: 0x0280, rawOffset: 0x3400, permissions: 'r-x', entropy: 4.85 },
      { name: '__TEXT.__cstring', virtualAddress: 0x100005680, size: 0x0820, rawOffset: 0x3680, permissions: 'r--', entropy: 3.94 },
      { name: '__DATA.__data', virtualAddress: 0x100008000, size: 0x1200, rawOffset: 0x4000, permissions: 'rw-', entropy: 2.15 },
      { name: '__DATA.__bss', virtualAddress: 0x100009200, size: 0x0400, rawOffset: 0x5200, permissions: 'rw-', entropy: 0.10 }
    ],
    symbols: [
      { name: '_validate_license_key', demangledName: 'KeyValidator.validateLicenseKey(_:)', address: 0x100003a00, type: 'Export', size: 128, section: '__TEXT.__text', source: 'Native' },
      { name: '_check_ptrace_antidebug', demangledName: 'SecurityGuard.checkPtraceAntiDebug()', address: 0x100003b40, type: 'Function', size: 64, section: '__TEXT.__text', source: 'Native' },
      { name: '_aes_decrypt_string', demangledName: 'CryptoProvider.aesDecryptString(data:key:)', address: 0x100003bc0, type: 'Function', size: 96, section: '__TEXT.__text', source: 'Native' },
      { name: '_show_activation_success', demangledName: 'UIController.showActivationSuccess()', address: 0x100003c80, type: 'Function', size: 48, section: '__TEXT.__text', source: 'Native' },
      { name: '_swift_allocateGenericObject', demangledName: 'swift_allocateGenericObject', address: 0x100005420, type: 'Import', size: 16, section: '__TEXT.__stubs', source: 'Native' },
      { name: '_ptrace', demangledName: 'libsystem_kernel.dylib!ptrace', address: 0x100005440, type: 'Import', size: 16, section: '__TEXT.__stubs', source: 'FLIRT' },
      { name: '_sysctl', demangledName: 'libsystem_kernel.dylib!sysctl', address: 0x100005460, type: 'Import', size: 16, section: '__TEXT.__stubs', source: 'FLIRT' },
      { name: '_mh_execute_header', address: 0x100000000, type: 'Export', size: 0, section: '__TEXT.__text', source: 'Native' },
      { name: 'g_active_license_token', address: 0x100008040, type: 'Data', size: 32, section: '__DATA.__data', source: 'Native' }
    ],
    strings: [
      { address: 0x100005680, value: 'VR-2026-X89B-MASTER-KEY', length: 23, section: '__TEXT.__cstring', type: 'ASCII', xrefCount: 2 },
      { address: 0x1000056a0, value: 'Debugger attached via ptrace! Terminating immediately.', length: 54, section: '__TEXT.__cstring', type: 'ASCII', xrefCount: 1 },
      { address: 0x1000056e0, value: 'License signature verified. Welcome, registered user.', length: 53, section: '__TEXT.__cstring', type: 'ASCII', xrefCount: 1 },
      { address: 0x100005720, value: 'Invalid activation code format. Check input format.', length: 51, section: '__TEXT.__cstring', type: 'ASCII', xrefCount: 1 },
      { address: 0x100005760, value: '/System/Library/Frameworks/Security.framework', length: 45, section: '__TEXT.__cstring', type: 'ASCII', xrefCount: 1 }
    ],
    xrefs: [
      { sourceAddress: 0x100003a08, targetAddress: 0x100003b40, type: 'CALL', sourceFunction: '_validate_license_key', instructionPreview: 'bl _check_ptrace_antidebug' },
      { sourceAddress: 0x100003a38, targetAddress: 0x100005680, type: 'READ', sourceFunction: '_validate_license_key', instructionPreview: 'adrp x1, 0x100005000 ; "VR-2026-X89B-MASTER-KEY"' },
      { sourceAddress: 0x100003a5c, targetAddress: 0x100003c80, type: 'CALL', sourceFunction: '_validate_license_key', instructionPreview: 'bl _show_activation_success' },
      { sourceAddress: 0x100003b54, targetAddress: 0x100005440, type: 'CALL', sourceFunction: '_check_ptrace_antidebug', instructionPreview: 'bl _ptrace' },
      { sourceAddress: 0x100003b6c, targetAddress: 0x1000056a0, type: 'READ', sourceFunction: '_check_ptrace_antidebug', instructionPreview: 'adrp x0, 0x100005000 ; "Debugger attached..."' },
      { sourceAddress: 0x100003a74, targetAddress: 0x100005720, type: 'READ', sourceFunction: '_validate_license_key', instructionPreview: 'adrp x0, 0x100005000 ; "Invalid activation..."' }
    ],
    functions: [
      {
        address: 0x100003a00,
        name: '_validate_license_key',
        demangledName: 'KeyValidator.validateLicenseKey(_:)',
        size: 144,
        returnType: 'int64_t',
        parameters: ['const char *serial_input', 'int64_t key_len'],
        callingConvention: 'arm64_aapcs',
        instructions: [
          { address: 0x100003a00, bytes: 'ff 83 00 d1', mnemonic: 'sub', operands: 'sp, sp, #32', comment: 'prologue: allocate stack frame' },
          { address: 0x100003a04, bytes: 'fd 7b 01 a9', mnemonic: 'stp', operands: 'x29, x30, [sp, #16]', comment: 'save frame pointer & link register' },
          { address: 0x100003a08, bytes: '4e ff ff 97', mnemonic: 'bl', operands: '_check_ptrace_antidebug', isCall: true, targetAddress: 0x100003b40, comment: 'call anti-debug check' },
          { address: 0x100003a0c, bytes: 'ff 03 00 f1', mnemonic: 'cmp', operands: 'x0, #0', comment: 'check ptrace status' },
          { address: 0x100003a10, bytes: 'a1 00 00 54', mnemonic: 'b.ne', operands: 'loc_100003a70', isJump: true, targetAddress: 0x100003a70, comment: 'branch if debugger active' },
          { address: 0x100003a14, bytes: '21 00 80 52', mnemonic: 'mov', operands: 'w1, #23', comment: 'expected key length' },
          { address: 0x100003a18, bytes: '3f 00 01 6b', mnemonic: 'cmp', operands: 'w1, w2', comment: 'validate user key length' },
          { address: 0x100003a1c, bytes: '61 01 00 54', mnemonic: 'b.ne', operands: 'loc_100003a70', isJump: true, targetAddress: 0x100003a70, comment: 'fail if length != 23' },
          { address: 0x100003a20, bytes: '02 00 80 d2', mnemonic: 'mov', operands: 'x2, #0', comment: 'checksum accumulator = 0' },
          { address: 0x100003a24, bytes: '03 00 80 d2', mnemonic: 'mov', operands: 'x3, #0', comment: 'loop index i = 0' },
          // Loop start
          { address: 0x100003a28, bytes: '64 68 63 38', mnemonic: 'ldrb', operands: 'w4, [x0, x3]', comment: 'load input_char[i]' },
          { address: 0x100003a2c, bytes: '42 08 04 8b', mnemonic: 'add', operands: 'x2, x2, x4, lsl #3', comment: 'accum = (accum << 3) + char' },
          { address: 0x100003a30, bytes: '63 04 00 91', mnemonic: 'add', operands: 'x3, x3, #1', comment: 'i++' },
          { address: 0x100003a34, bytes: '7f 00 01 6b', mnemonic: 'cmp', operands: 'w3, w1', comment: 'loop while i < length' },
          { address: 0x100003a38, bytes: '81 fe ff 54', mnemonic: 'b.lt', operands: 'loc_100003a28', isJump: true, targetAddress: 0x100003a28, comment: 'loop back' },
          // Checksum comparison
          { address: 0x100003a3c, bytes: '45 b7 a9 d2', mnemonic: 'movz', operands: 'x5, #0x4db2', comment: 'expected magic checksum part 1' },
          { address: 0x100003a40, bytes: 'a5 0e c0 f2', mnemonic: 'movk', operands: 'x5, #0x0075, lsl #16', comment: 'expected magic checksum part 2 (0x754db2)' },
          { address: 0x100003a44, bytes: '5f 00 05 eb', mnemonic: 'cmp', operands: 'x2, x5', comment: 'compare checksum == 0x754db2' },
          { address: 0x100003a48, bytes: '41 01 00 54', mnemonic: 'b.ne', operands: 'loc_100003a70', isJump: true, targetAddress: 0x100003a70, comment: 'invalid serial checksum' },
          // Success block
          { address: 0x100003a50, bytes: 'e0 03 1f aa', mnemonic: 'mov', operands: 'x0, x0', comment: 'status code' },
          { address: 0x100003a58, bytes: '20 00 80 d2', mnemonic: 'mov', operands: 'x0, #1', comment: 'ret 1' },
          { address: 0x100003a5c, bytes: '04 00 00 14', mnemonic: 'b', operands: 'loc_100003a80', isJump: true, targetAddress: 0x100003a80, comment: 'jump to epilogue' },
          // Fail block
          { address: 0x100003a70, bytes: '00 00 80 d2', mnemonic: 'mov', operands: 'x0, #0', comment: 'return failure status (0)' },
          // Epilogue block
          { address: 0x100003a80, bytes: 'fd 7b 41 a9', mnemonic: 'ldp', operands: 'x29, x30, [sp, #16]', comment: 'restore fp & lr' },
          { address: 0x100003a84, bytes: 'ff 83 00 91', mnemonic: 'add', operands: 'sp, sp, #32', comment: 'free stack' },
          { address: 0x100003a88, bytes: 'c0 03 5f d6', mnemonic: 'ret', operands: '', isRet: true, comment: 'return to caller' }
        ],
        blocks: [
          {
            id: 'block_0',
            startAddress: 0x100003a00,
            endAddress: 0x100003a1c,
            instructions: [
              { address: 0x100003a00, bytes: 'ff 83 00 d1', mnemonic: 'sub', operands: 'sp, sp, #32' },
              { address: 0x100003a04, bytes: 'fd 7b 01 a9', mnemonic: 'stp', operands: 'x29, x30, [sp, #16]' },
              { address: 0x100003a08, bytes: '4e ff ff 97', mnemonic: 'bl', operands: '_check_ptrace_antidebug' },
              { address: 0x100003a0c, bytes: 'ff 03 00 f1', mnemonic: 'cmp', operands: 'x0, #0' },
              { address: 0x100003a10, bytes: 'a1 00 00 54', mnemonic: 'b.ne', operands: 'loc_100003a70' },
              { address: 0x100003a14, bytes: '21 00 80 52', mnemonic: 'mov', operands: 'w1, #23' },
              { address: 0x100003a18, bytes: '3f 00 01 6b', mnemonic: 'cmp', operands: 'w1, w2' },
              { address: 0x100003a1c, bytes: '61 01 00 54', mnemonic: 'b.ne', operands: 'loc_100003a70' }
            ],
            trueTarget: 0x100003a20,
            falseTarget: 0x100003a70,
            x: 250,
            y: 40,
            width: 380,
            height: 190
          },
          {
            id: 'block_loop_init',
            startAddress: 0x100003a20,
            endAddress: 0x100003a24,
            instructions: [
              { address: 0x100003a20, bytes: '02 00 80 d2', mnemonic: 'mov', operands: 'x2, #0' },
              { address: 0x100003a24, bytes: '03 00 80 d2', mnemonic: 'mov', operands: 'x3, #0' }
            ],
            unconditionalTarget: 0x100003a28,
            x: 100,
            y: 280,
            width: 320,
            height: 90
          },
          {
            id: 'block_loop_body',
            startAddress: 0x100003a28,
            endAddress: 0x100003a38,
            instructions: [
              { address: 0x100003a28, bytes: '64 68 63 38', mnemonic: 'ldrb', operands: 'w4, [x0, x3]' },
              { address: 0x100003a2c, bytes: '42 08 04 8b', mnemonic: 'add', operands: 'x2, x2, x4, lsl #3' },
              { address: 0x100003a30, bytes: '63 04 00 91', mnemonic: 'add', operands: 'x3, x3, #1' },
              { address: 0x100003a34, bytes: '7f 00 01 6b', mnemonic: 'cmp', operands: 'w3, w1' },
              { address: 0x100003a38, bytes: '81 fe ff 54', mnemonic: 'b.lt', operands: 'loc_100003a28' }
            ],
            trueTarget: 0x100003a28,
            falseTarget: 0x100003a3c,
            x: 100,
            y: 420,
            width: 340,
            height: 140
          },
          {
            id: 'block_checksum_check',
            startAddress: 0x100003a3c,
            endAddress: 0x100003a48,
            instructions: [
              { address: 0x100003a3c, bytes: '45 b7 a9 d2', mnemonic: 'movz', operands: 'x5, #0x4db2' },
              { address: 0x100003a40, bytes: 'a5 0e c0 f2', mnemonic: 'movk', operands: 'x5, #0x0075, lsl #16' },
              { address: 0x100003a44, bytes: '5f 00 05 eb', mnemonic: 'cmp', operands: 'x2, x5' },
              { address: 0x100003a48, bytes: '41 01 00 54', mnemonic: 'b.ne', operands: 'loc_100003a70' }
            ],
            trueTarget: 0x100003a4c,
            falseTarget: 0x100003a70,
            x: 100,
            y: 610,
            width: 340,
            height: 120
          },
          {
            id: 'block_success',
            startAddress: 0x100003a4c,
            endAddress: 0x100003a5c,
            instructions: [
              { address: 0x100003a4c, bytes: '20 00 80 d2', mnemonic: 'mov', operands: 'x0, #1' },
              { address: 0x100003a54, bytes: '2b ff ff 97', mnemonic: 'bl', operands: '_show_activation_success' },
              { address: 0x100003a58, bytes: '20 00 80 d2', mnemonic: 'mov', operands: 'x0, #1' },
              { address: 0x100003a5c, bytes: '04 00 00 14', mnemonic: 'b', operands: 'loc_100003a80' }
            ],
            unconditionalTarget: 0x100003a80,
            x: 40,
            y: 780,
            width: 320,
            height: 120
          },
          {
            id: 'block_failure',
            startAddress: 0x100003a70,
            endAddress: 0x100003a70,
            instructions: [
              { address: 0x100003a70, bytes: '00 00 80 d2', mnemonic: 'mov', operands: 'x0, #0' }
            ],
            unconditionalTarget: 0x100003a80,
            x: 480,
            y: 780,
            width: 240,
            height: 80
          },
          {
            id: 'block_epilogue',
            startAddress: 0x100003a80,
            endAddress: 0x100003a88,
            instructions: [
              { address: 0x100003a80, bytes: 'fd 7b 41 a9', mnemonic: 'ldp', operands: 'x29, x30, [sp, #16]' },
              { address: 0x100003a84, bytes: 'ff 83 00 91', mnemonic: 'add', operands: 'sp, sp, #32' },
              { address: 0x100003a88, bytes: 'c0 03 5f d6', mnemonic: 'ret', operands: '' }
            ],
            x: 260,
            y: 950,
            width: 300,
            height: 100
          }
        ],
        llil: [
          { index: 0, address: 0x100003a00, ilText: 'sp = sp - 0x20', operation: 'sub' },
          { index: 1, address: 0x100003a04, ilText: '[sp + 0x10].q = x29:x30', operation: 'store' },
          { index: 2, address: 0x100003a08, ilText: 'x0 = _check_ptrace_antidebug()', operation: 'call' },
          { index: 3, address: 0x100003a0c, ilText: 'if (x0 != 0) goto loc_100003a70 else goto loc_100003a14', operation: 'if' },
          { index: 4, address: 0x100003a14, ilText: 'w1 = 0x17', operation: 'assign' },
          { index: 5, address: 0x100003a18, ilText: 'if (w2 != 0x17) goto loc_100003a70 else goto loc_100003a20', operation: 'if' },
          { index: 6, address: 0x100003a20, ilText: 'x2 = 0; x3 = 0', operation: 'assign' },
          { index: 7, address: 0x100003a28, ilText: 'w4 = [x0 + x3].b', operation: 'load' },
          { index: 8, address: 0x100003a2c, ilText: 'x2 = x2 + (x4 << 3)', operation: 'add' },
          { index: 9, address: 0x100003a30, ilText: 'x3 = x3 + 1', operation: 'add' },
          { index: 10, address: 0x100003a34, ilText: 'if (x3 < w1) goto loc_100003a28 else goto loc_100003a3c', operation: 'if' },
          { index: 11, address: 0x100003a3c, ilText: 'if (x2 == 0x754db2) goto loc_100003a4c else goto loc_100003a70', operation: 'if' },
          { index: 12, address: 0x100003a4c, ilText: '_show_activation_success()', operation: 'call' },
          { index: 13, address: 0x100003a58, ilText: 'return 1', operation: 'ret' },
          { index: 14, address: 0x100003a70, ilText: 'return 0', operation: 'ret' }
        ],
        mlil: [
          { index: 0, address: 0x100003a00, ilText: 'var_status#1 = check_ptrace_antidebug()', ssaVariables: ['var_status#1'] },
          { index: 1, address: 0x100003a0c, ilText: 'if (var_status#1 != 0) goto fail_block', ssaVariables: ['var_status#1'] },
          { index: 2, address: 0x100003a18, ilText: 'if (arg_len#0 != 23) goto fail_block', ssaVariables: ['arg_len#0'] },
          { index: 3, address: 0x100003a20, ilText: 'var_accum#1 = 0; var_i#1 = 0', ssaVariables: ['var_accum#1', 'var_i#1'] },
          { index: 4, address: 0x100003a28, ilText: 'loop {', operation: 'loop' },
          { index: 5, address: 0x100003a2c, ilText: '  var_char#1 = arg_serial#0[var_i#2]', ssaVariables: ['var_char#1'] },
          { index: 6, address: 0x100003a30, ilText: '  var_accum#2 = var_accum#1 + (var_char#1 << 3)', ssaVariables: ['var_accum#2'] },
          { index: 7, address: 0x100003a34, ilText: '  var_i#2 = var_i#1 + 1', ssaVariables: ['var_i#2'] },
          { index: 8, address: 0x100003a38, ilText: '  if (var_i#2 >= 23) break;', operation: 'break' },
          { index: 9, address: 0x100003a3c, ilText: '}', operation: 'endloop' },
          { index: 10, address: 0x100003a44, ilText: 'if (var_accum#2 == 0x754DB2) {', ssaVariables: ['var_accum#2'] },
          { index: 11, address: 0x100003a54, ilText: '  show_activation_success()', operation: 'call' },
          { index: 12, address: 0x100003a58, ilText: '  return 1', operation: 'ret' },
          { index: 13, address: 0x100003a70, ilText: '}', operation: 'endif' },
          { index: 14, address: 0x100003a74, ilText: 'return 0', operation: 'ret' }
        ],
        hlil: [
          'int64_t validateLicenseKey(const char *serial_input, int64_t key_len)',
          '{',
          '    if (SecurityGuard::checkPtraceAntiDebug() != 0) {',
          '        return 0; // Anti-debugging tripped',
          '    }',
          '    if (key_len != 23) {',
          '        return 0; // Invalid key length format',
          '    }',
          '    uint64_t rolling_checksum = 0;',
          '    for (int i = 0; i < 23; i++) {',
          '        rolling_checksum = (rolling_checksum << 3) + (uint8_t)serial_input[i];',
          '    }',
          '    if (rolling_checksum == 0x754DB2) {',
          '        UIController::showActivationSuccess();',
          '        return 1;',
          '    }',
          '    return 0;',
          '}'
        ],
        pseudoC: [
          '/**',
          ' * Decompiled by VectorRE v2.4 (Hex-Rays & BN Hybrid)',
          ' * Architecture: ARM64 Apple Silicon | Mach-O 64',
          ' */',
          'int64_t validate_license_key(const char *serial_input, int64_t key_len)',
          '{',
          '    uint64_t checksum_acc = 0;',
          '    ',
          '    // Detect runtime debugging via ptrace / sysctl',
          '    if ( check_ptrace_antidebug() )',
          '        return 0LL;',
          '        ',
          '    if ( key_len != 23LL )',
          '        return 0LL;',
          '        ',
          '    for ( int64_t idx = 0; idx < 23; ++idx )',
          '    {',
          '        uint8_t ch = serial_input[idx];',
          '        checksum_acc += ((uint64_t)ch << 3);',
          '    }',
          '    ',
          '    if ( checksum_acc == 0x754DB2LL )',
          '    {',
          '        show_activation_success();',
          '        return 1LL;',
          '    }',
          '    ',
          '    return 0LL;',
          '}'
        ]
      },
      {
        address: 0x100003b40,
        name: '_check_ptrace_antidebug',
        demangledName: 'SecurityGuard.checkPtraceAntiDebug()',
        size: 80,
        returnType: 'int32_t',
        parameters: [],
        callingConvention: 'arm64_aapcs',
        instructions: [
          { address: 0x100003b40, bytes: 'ff 43 00 d1', mnemonic: 'sub', operands: 'sp, sp, #16' },
          { address: 0x100003b44, bytes: 'fd 7b 00 a9', mnemonic: 'stp', operands: 'x29, x30, [sp]' },
          { address: 0x100003b48, bytes: '00 00 80 d2', mnemonic: 'mov', operands: 'x0, #31', comment: 'PT_DENY_ATTACH = 31' },
          { address: 0x100003b4c, bytes: '01 00 80 d2', mnemonic: 'mov', operands: 'x1, #0' },
          { address: 0x100003b50, bytes: '02 00 80 d2', mnemonic: 'mov', operands: 'x2, #0' },
          { address: 0x100003b54, bytes: '6b 06 00 94', mnemonic: 'bl', operands: '_ptrace', isCall: true, targetAddress: 0x100005440 },
          { address: 0x100003b58, bytes: '00 00 00 11', mnemonic: 'add', operands: 'w0, w0, #0' },
          { address: 0x100003b5c, bytes: 'fd 7b 40 a9', mnemonic: 'ldp', operands: 'x29, x30, [sp]' },
          { address: 0x100003b60, bytes: 'ff 43 00 91', mnemonic: 'add', operands: 'sp, sp, #16' },
          { address: 0x100003b64, bytes: 'c0 03 5f d6', mnemonic: 'ret', operands: '', isRet: true }
        ],
        blocks: [
          {
            id: 'ptrace_b0',
            startAddress: 0x100003b40,
            endAddress: 0x100003b64,
            instructions: [
              { address: 0x100003b40, bytes: 'ff 43 00 d1', mnemonic: 'sub', operands: 'sp, sp, #16' },
              { address: 0x100003b48, bytes: '00 00 80 d2', mnemonic: 'mov', operands: 'x0, #31' },
              { address: 0x100003b54, bytes: '6b 06 00 94', mnemonic: 'bl', operands: '_ptrace' },
              { address: 0x100003b64, bytes: 'c0 03 5f d6', mnemonic: 'ret', operands: '' }
            ],
            x: 200,
            y: 40,
            width: 320,
            height: 120
          }
        ],
        llil: [
          { index: 0, address: 0x100003b48, ilText: 'x0 = ptrace(31, 0, 0, 0)', operation: 'call' },
          { index: 1, address: 0x100003b64, ilText: 'return x0', operation: 'ret' }
        ],
        mlil: [
          { index: 0, address: 0x100003b48, ilText: 'var_res#1 = ptrace(PT_DENY_ATTACH, 0, 0, 0)' },
          { index: 1, address: 0x100003b64, ilText: 'return var_res#1' }
        ],
        hlil: [
          'int32_t checkPtraceAntiDebug()',
          '{',
          '    // Invokes PT_DENY_ATTACH (31) to prevent debugger attachment on macOS Darwin',
          '    return ptrace(31, 0, 0, 0);',
          '}'
        ],
        pseudoC: [
          'int32_t check_ptrace_antidebug()',
          '{',
          '    // Calling Darwin kernel ptrace with PT_DENY_ATTACH (31)',
          '    return ptrace(31, 0, 0, 0);',
          '}'
        ]
      },
      {
        address: 0x100003bc0,
        name: '_aes_decrypt_string',
        demangledName: 'CryptoProvider.aesDecryptString(data:key:)',
        size: 96,
        returnType: 'char *',
        parameters: ['const uint8_t *enc_data', 'size_t len', 'const uint8_t *key'],
        callingConvention: 'arm64_aapcs',
        instructions: [
          { address: 0x100003bc0, bytes: 'ff 83 00 d1', mnemonic: 'sub', operands: 'sp, sp, #32' },
          { address: 0x100003bc4, bytes: 'fd 7b 01 a9', mnemonic: 'stp', operands: 'x29, x30, [sp, #16]' },
          { address: 0x100003bc8, bytes: 'e0 03 00 aa', mnemonic: 'mov', operands: 'x0, x0', comment: 'buffer pointer' },
          { address: 0x100003bcc, bytes: 'c0 03 5f d6', mnemonic: 'ret', operands: '', isRet: true }
        ],
        blocks: [
          {
            id: 'aes_b0',
            startAddress: 0x100003bc0,
            endAddress: 0x100003bcc,
            instructions: [
              { address: 0x100003bc0, bytes: 'ff 83 00 d1', mnemonic: 'sub', operands: 'sp, sp, #32' },
              { address: 0x100003bcc, bytes: 'c0 03 5f d6', mnemonic: 'ret', operands: '' }
            ],
            x: 200,
            y: 40,
            width: 300,
            height: 90
          }
        ],
        llil: [{ index: 0, address: 0x100003bc0, ilText: 'return x0', operation: 'ret' }],
        mlil: [{ index: 0, address: 0x100003bc0, ilText: 'return arg_data#0' }],
        hlil: ['char *aesDecryptString(const uint8_t *data, size_t len, const uint8_t *key) { return (char *)data; }'],
        pseudoC: ['char *aes_decrypt_string(const uint8_t *enc_data, size_t len, const uint8_t *key) { return (char *)enc_data; }']
      },
      {
        address: 0x100003c80,
        name: '_show_activation_success',
        demangledName: 'UIController.showActivationSuccess()',
        size: 48,
        returnType: 'void',
        parameters: [],
        callingConvention: 'arm64_aapcs',
        instructions: [
          { address: 0x100003c80, bytes: 'ff 43 00 d1', mnemonic: 'sub', operands: 'sp, sp, #16' },
          { address: 0x100003c84, bytes: 'c0 03 5f d6', mnemonic: 'ret', operands: '', isRet: true }
        ],
        blocks: [
          {
            id: 'act_b0',
            startAddress: 0x100003c80,
            endAddress: 0x100003c84,
            instructions: [{ address: 0x100003c80, bytes: 'c0 03 5f d6', mnemonic: 'ret', operands: '' }],
            x: 200,
            y: 40,
            width: 280,
            height: 70
          }
        ],
        llil: [{ index: 0, address: 0x100003c80, ilText: 'return', operation: 'ret' }],
        mlil: [{ index: 0, address: 0x100003c80, ilText: 'return' }],
        hlil: ['void showActivationSuccess() { /* Prompt macOS Cocoa activation dialog */ }'],
        pseudoC: ['void show_activation_success() { /* Cocoa NSAlert activation prompt */ }']
      }
    ]
  },
  {
    id: 'sample-linux-x86_64',
    filename: 'auth_daemon_x86_64.elf',
    fileSize: 65536,
    format: 'ELF64',
    architecture: 'x86_64 (AMD64)',
    entryPoint: 0x401050,
    baseAddress: 0x400000,
    sections: [
      { name: '.text', virtualAddress: 0x401000, size: 0x3200, rawOffset: 0x1000, permissions: 'r-x', entropy: 6.38 },
      { name: '.rodata', virtualAddress: 0x404200, size: 0x0c00, rawOffset: 0x4200, permissions: 'r--', entropy: 4.12 },
      { name: '.data', virtualAddress: 0x406000, size: 0x0800, rawOffset: 0x5000, permissions: 'rw-', entropy: 2.50 },
      { name: '.bss', virtualAddress: 0x407000, size: 0x0400, rawOffset: 0x5800, permissions: 'rw-', entropy: 0.05 }
    ],
    symbols: [
      { name: 'main', demangledName: 'main(int, char**)', address: 0x401120, type: 'Function', size: 140, section: '.text', source: 'Native' },
      { name: 'auth_verify_token', demangledName: 'auth_verify_token(char const*, unsigned char*)', address: 0x401240, type: 'Function', size: 180, section: '.text', source: 'Native' },
      { name: 'sha256_transform', demangledName: 'sha256_transform(SHA256_CTX*, uint8_t const*)', address: 0x401400, type: 'Function', size: 320, section: '.text', source: 'Native' },
      { name: 'strncmp', demangledName: 'strncmp (glibc 2.35)', address: 0x401720, type: 'Function', size: 84, section: '.text', source: 'FLIRT' },
      { name: 'malloc', demangledName: 'malloc (glibc 2.35)', address: 0x4017a0, type: 'Function', size: 112, section: '.text', source: 'FLIRT' },
      { name: 'printf', demangledName: 'printf (glibc 2.35)', address: 0x401840, type: 'Function', size: 48, section: '.text', source: 'FLIRT' },
      { name: 'sub_401920', demangledName: 'lumina_hkdf_expand_key', address: 0x401920, type: 'Function', size: 98, section: '.text', source: 'Lumina' }
    ],
    strings: [
      { address: 0x404210, value: 'AUTH_BEARER_TOKEN_V2', length: 20, section: '.rodata', type: 'ASCII', xrefCount: 2 },
      { address: 0x404230, value: '[+] Cryptographic auth token accepted. Granted.', length: 47, section: '.rodata', type: 'ASCII', xrefCount: 1 },
      { address: 0x404270, value: '[-] Authentication failure: Hash mismatch detected!', length: 51, section: '.rodata', type: 'ASCII', xrefCount: 1 },
      { address: 0x4042b0, value: 'Daemon listening on unix:///var/run/auth_socket.sock', length: 52, section: '.rodata', type: 'ASCII', xrefCount: 1 }
    ],
    xrefs: [
      { sourceAddress: 0x401135, targetAddress: 0x401240, type: 'CALL', sourceFunction: 'main', instructionPreview: 'call auth_verify_token' },
      { sourceAddress: 0x401258, targetAddress: 0x401720, type: 'CALL', sourceFunction: 'auth_verify_token', instructionPreview: 'call strncmp ; FLIRT: glibc-2.35' },
      { sourceAddress: 0x401270, targetAddress: 0x404230, type: 'READ', sourceFunction: 'auth_verify_token', instructionPreview: 'lea rdi, [rip + 0x3fc0] ; "[+] Crypto..."' },
      { sourceAddress: 0x401280, targetAddress: 0x401840, type: 'CALL', sourceFunction: 'auth_verify_token', instructionPreview: 'call printf' }
    ],
    functions: [
      {
        address: 0x401240,
        name: 'auth_verify_token',
        size: 180,
        returnType: 'int',
        parameters: ['const char *raw_token', 'uint8_t *out_hash'],
        callingConvention: 'system_v',
        instructions: [
          { address: 0x401240, bytes: '55', mnemonic: 'push', operands: 'rbp', comment: 'prologue' },
          { address: 0x401241, bytes: '48 89 e5', mnemonic: 'mov', operands: 'rbp, rsp' },
          { address: 0x401244, bytes: '48 83 ec 40', mnemonic: 'sub', operands: 'rsp, 0x40', comment: 'allocate 64-byte frame' },
          { address: 0x401248, bytes: '48 89 7d d8', mnemonic: 'mov', operands: '[rbp - 0x28], rdi', comment: 'store raw_token' },
          { address: 0x40124c, bytes: '48 89 75 d0', mnemonic: 'mov', operands: '[rbp - 0x30], rsi', comment: 'store out_hash' },
          { address: 0x401250, bytes: '48 8d 35 c9 2f 00 00', mnemonic: 'lea', operands: 'rsi, [rip + 0x2fc9]', comment: 'load "AUTH_BEARER_TOKEN_V2"' },
          { address: 0x401257, bytes: 'ba 14 00 00 00', mnemonic: 'mov', operands: 'edx, 20', comment: 'len = 20' },
          { address: 0x40125c, bytes: 'e8 bf 04 00 00', mnemonic: 'call', operands: 'strncmp', isCall: true, targetAddress: 0x401720, comment: 'FLIRT library call: strncmp' },
          { address: 0x401261, bytes: '85 c0', mnemonic: 'test', operands: 'eax, eax' },
          { address: 0x401263, bytes: '75 22', mnemonic: 'jnz', operands: 'loc_401287', isJump: true, targetAddress: 0x401287, comment: 'jump if mismatch' },
          // Success branch
          { address: 0x401265, bytes: '48 8d 3d c4 2f 00 00', mnemonic: 'lea', operands: 'rdi, [rip + 0x2fc4]', comment: '"[+] Cryptographic auth..."' },
          { address: 0x40126c, bytes: 'e8 cf 05 00 00', mnemonic: 'call', operands: 'printf', isCall: true, targetAddress: 0x401840 },
          { address: 0x401271, bytes: 'b8 01 00 00 00', mnemonic: 'mov', operands: 'eax, 1', comment: 'return 1 (authorized)' },
          { address: 0x401276, bytes: 'eb 15', mnemonic: 'jmp', operands: 'loc_40128d', isJump: true, targetAddress: 0x40128d },
          // Failure branch
          { address: 0x401287, bytes: 'b8 00 00 00 00', mnemonic: 'mov', operands: 'eax, 0', comment: 'return 0 (unauthorized)' },
          // Epilogue
          { address: 0x40128d, bytes: 'c9', mnemonic: 'leave', operands: '' },
          { address: 0x40128e, bytes: 'c3', mnemonic: 'ret', operands: '', isRet: true }
        ],
        blocks: [
          {
            id: 'x86_b0',
            startAddress: 0x401240,
            endAddress: 0x401263,
            instructions: [
              { address: 0x401240, bytes: '55', mnemonic: 'push', operands: 'rbp' },
              { address: 0x401241, bytes: '48 89 e5', mnemonic: 'mov', operands: 'rbp, rsp' },
              { address: 0x401244, bytes: '48 83 ec 40', mnemonic: 'sub', operands: 'rsp, 0x40' },
              { address: 0x40125c, bytes: 'e8 bf 04 00 00', mnemonic: 'call', operands: 'strncmp' },
              { address: 0x401261, bytes: '85 c0', mnemonic: 'test', operands: 'eax, eax' },
              { address: 0x401263, bytes: '75 22', mnemonic: 'jnz', operands: 'loc_401287' }
            ],
            trueTarget: 0x401265,
            falseTarget: 0x401287,
            x: 220,
            y: 40,
            width: 320,
            height: 150
          },
          {
            id: 'x86_success',
            startAddress: 0x401265,
            endAddress: 0x401276,
            instructions: [
              { address: 0x401265, bytes: '48 8d 3d c4 2f 00 00', mnemonic: 'lea', operands: 'rdi, [rip + 0x2fc4]' },
              { address: 0x40126c, bytes: 'e8 cf 05 00 00', mnemonic: 'call', operands: 'printf' },
              { address: 0x401271, bytes: 'b8 01 00 00 00', mnemonic: 'mov', operands: 'eax, 1' },
              { address: 0x401276, bytes: 'eb 15', mnemonic: 'jmp', operands: 'loc_40128d' }
            ],
            unconditionalTarget: 0x40128d,
            x: 80,
            y: 250,
            width: 280,
            height: 120
          },
          {
            id: 'x86_fail',
            startAddress: 0x401287,
            endAddress: 0x401287,
            instructions: [
              { address: 0x401287, bytes: 'b8 00 00 00 00', mnemonic: 'mov', operands: 'eax, 0' }
            ],
            unconditionalTarget: 0x40128d,
            x: 420,
            y: 250,
            width: 220,
            height: 80
          },
          {
            id: 'x86_ret',
            startAddress: 0x40128d,
            endAddress: 0x40128e,
            instructions: [
              { address: 0x40128d, bytes: 'c9', mnemonic: 'leave', operands: '' },
              { address: 0x40128e, bytes: 'c3', mnemonic: 'ret', operands: '' }
            ],
            x: 240,
            y: 420,
            width: 240,
            height: 80
          }
        ],
        llil: [
          { index: 0, address: 0x401240, ilText: 'push(rbp); rbp = rsp; rsp = rsp - 0x40' },
          { index: 1, address: 0x40125c, ilText: 'rax = strncmp(rdi, "AUTH_BEARER_TOKEN_V2", 20)' },
          { index: 2, address: 0x401263, ilText: 'if (rax != 0) goto loc_401287 else goto loc_401265' },
          { index: 3, address: 0x40126c, ilText: 'printf("[+] Cryptographic auth token accepted...")' },
          { index: 4, address: 0x401271, ilText: 'return 1' },
          { index: 5, address: 0x401287, ilText: 'return 0' }
        ],
        mlil: [
          { index: 0, address: 0x40125c, ilText: 'var_cmp#1 = strncmp(arg_token#0, "AUTH_BEARER_TOKEN_V2", 20)' },
          { index: 1, address: 0x401263, ilText: 'if (var_cmp#1 == 0) {' },
          { index: 2, address: 0x40126c, ilText: '  printf("[+] Cryptographic auth token accepted. Granted.\\n")' },
          { index: 3, address: 0x401271, ilText: '  return 1' },
          { index: 4, address: 0x401287, ilText: '} else { return 0; }' }
        ],
        hlil: [
          'int auth_verify_token(const char *raw_token, uint8_t *out_hash)',
          '{',
          '    if (strncmp(raw_token, "AUTH_BEARER_TOKEN_V2", 20) == 0) {',
          '        printf("[+] Cryptographic auth token accepted. Granted.\\n");',
          '        return 1;',
          '    }',
          '    return 0;',
          '}'
        ],
        pseudoC: [
          'int __cdecl auth_verify_token(const char *raw_token, uint8_t *out_hash)',
          '{',
          '    // Identified by FLIRT: strncmp from GNU libc 2.35',
          '    if ( !strncmp(raw_token, "AUTH_BEARER_TOKEN_V2", 20uLL) )',
          '    {',
          '        printf("[+] Cryptographic auth token accepted. Granted.\\n");',
          '        return 1;',
          '    }',
          '    return 0;',
          '}'
        ],
        flirtMatch: {
          library: 'glibc-2.35-x86_64',
          signatureName: 'strncmp_avx2',
          confidence: 0.99
        }
      },
      {
        address: 0x401920,
        name: 'sub_401920',
        demangledName: 'lumina_hkdf_expand_key',
        size: 98,
        returnType: 'int',
        parameters: ['const uint8_t *prk', 'size_t prk_len', 'uint8_t *okm'],
        callingConvention: 'system_v',
        instructions: [
          { address: 0x401920, bytes: '55', mnemonic: 'push', operands: 'rbp' },
          { address: 0x401921, bytes: '48 89 e5', mnemonic: 'mov', operands: 'rbp, rsp' },
          { address: 0x401924, bytes: 'b8 00 00 00 00', mnemonic: 'mov', operands: 'eax, 0' },
          { address: 0x401929, bytes: '5d', mnemonic: 'pop', operands: 'rbp' },
          { address: 0x40192a, bytes: 'c3', mnemonic: 'ret', operands: '', isRet: true }
        ],
        blocks: [
          {
            id: 'lum_b0',
            startAddress: 0x401920,
            endAddress: 0x40192a,
            instructions: [
              { address: 0x401920, bytes: '55', mnemonic: 'push', operands: 'rbp' },
              { address: 0x40192a, bytes: 'c3', mnemonic: 'ret', operands: '' }
            ],
            x: 200,
            y: 40,
            width: 260,
            height: 80
          }
        ],
        llil: [{ index: 0, address: 0x401920, ilText: 'return 0', operation: 'ret' }],
        mlil: [{ index: 0, address: 0x401920, ilText: 'return 0' }],
        hlil: ['int lumina_hkdf_expand_key(const uint8_t *prk, size_t prk_len, uint8_t *okm) { return 0; }'],
        pseudoC: ['int lumina_hkdf_expand_key(const uint8_t *prk, size_t prk_len, uint8_t *okm) { return 0; }'],
        luminaMatch: {
          hash: 'a9f143c7b28d098e223fa87612c40192',
          canonicalName: 'crypto_hkdf_expand',
          popularity: 382,
          author: 'openssl_core_team'
        }
      }
    ]
  }
];
