/**
 * VectorRE - Interactive Control Flow Graph (CFG)
 * Interactive basic block graph with pan/zoom, branch coloring, minimap,
 * and seamless Space-key toggle matching Binary Ninja & IDA Pro.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, List, Move } from 'lucide-react';
import { BasicBlock, FunctionItem, WorkbenchSettings } from '../../types/binary';

interface CFGGraphViewProps {
  selectedFunction: FunctionItem | null;
  selectedAddress: number;
  onSelectAddress: (addr: number) => void;
  onToggleLinear: () => void;
  settings: WorkbenchSettings;
}

export const CFGGraphView: React.FC<CFGGraphViewProps> = ({
  selectedFunction,
  selectedAddress,
  onSelectAddress,
  onToggleLinear,
  settings
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const blocks = selectedFunction?.blocks || [];

  // Reset viewport when function changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 60, y: 40 });
  }, [selectedFunction?.address]);

  // Handle Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 2.2));
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 0.15, 2.2));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.4));
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 60, y: 40 });
  };

  // Calculate bounding box for minimap
  const bounds = useMemo(() => {
    if (blocks.length === 0) return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    blocks.forEach((b) => {
      const bx = b.x ?? 100;
      const by = b.y ?? 100;
      const bw = b.width ?? 300;
      const bh = b.height ?? 120;
      minX = Math.min(minX, bx);
      minY = Math.min(minY, by);
      maxX = Math.max(maxX, bx + bw);
      maxY = Math.max(maxY, by + bh);
    });

    return {
      minX: minX - 40,
      minY: minY - 40,
      maxX: maxX + 60,
      maxY: maxY + 60,
      width: Math.max(800, maxX - minX + 100),
      height: Math.max(600, maxY - minY + 100)
    };
  }, [blocks]);

  // Edges rendering
  const renderEdges = () => {
    const blockMap = new Map<number, BasicBlock>();
    blocks.forEach((b) => blockMap.set(b.startAddress, b));

    const edgeElements: React.JSX.Element[] = [];

    blocks.forEach((srcBlock) => {
      const sx = (srcBlock.x ?? 100) + (srcBlock.width ?? 300) / 2;
      const sy = (srcBlock.y ?? 100) + (srcBlock.height ?? 120);

      // True branch (Green)
      if (srcBlock.trueTarget && blockMap.has(srcBlock.trueTarget)) {
        const dst = blockMap.get(srcBlock.trueTarget)!;
        const dx = (dst.x ?? 100) + (dst.width ?? 300) / 2;
        const dy = dst.y ?? 100;
        const midY = (sy + dy) / 2;
        const path = `M ${sx - 30} ${sy} C ${sx - 30} ${midY}, ${dx} ${midY}, ${dx} ${dy}`;

        edgeElements.push(
          <g key={`edge-true-${srcBlock.id}`}>
            <path d={path} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <polygon
              points={`${dx},${dy} ${dx - 5},${dy - 8} ${dx + 5},${dy - 8}`}
              fill="#10b981"
            />
          </g>
        );
      }

      // False branch (Red)
      if (srcBlock.falseTarget && blockMap.has(srcBlock.falseTarget)) {
        const dst = blockMap.get(srcBlock.falseTarget)!;
        const dx = (dst.x ?? 100) + (dst.width ?? 300) / 2;
        const dy = dst.y ?? 100;
        const midY = (sy + dy) / 2;
        const path = `M ${sx + 30} ${sy} C ${sx + 30} ${midY}, ${dx} ${midY}, ${dx} ${dy}`;

        edgeElements.push(
          <g key={`edge-false-${srcBlock.id}`}>
            <path d={path} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <polygon
              points={`${dx},${dy} ${dx - 5},${dy - 8} ${dx + 5},${dy - 8}`}
              fill="#ef4444"
            />
          </g>
        );
      }

      // Unconditional jump (Cyan)
      if (srcBlock.unconditionalTarget && blockMap.has(srcBlock.unconditionalTarget)) {
        const dst = blockMap.get(srcBlock.unconditionalTarget)!;
        const dx = (dst.x ?? 100) + (dst.width ?? 300) / 2;
        const dy = dst.y ?? 100;
        const midY = (sy + dy) / 2;
        const path = `M ${sx} ${sy} C ${sx} ${midY}, ${dx} ${midY}, ${dx} ${dy}`;

        edgeElements.push(
          <g key={`edge-uncond-${srcBlock.id}`}>
            <path d={path} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
            <polygon
              points={`${dx},${dy} ${dx - 5},${dy - 8} ${dx + 5},${dy - 8}`}
              fill="#06b6d4"
            />
          </g>
        );
      }
    });

    return edgeElements;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-full bg-[#0d0e12] overflow-hidden select-none cursor-grab active:cursor-grabbing font-mono text-xs"
    >
      {/* Viewport Control Bar */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 bg-[#171a22]/90 backdrop-blur border border-[#2a2f3d] p-1.5 rounded-lg shadow-lg">
        <button
          onClick={onToggleLinear}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-[#202532] hover:bg-[#282f40] rounded transition-colors font-sans"
          title="Switch to Linear Disassembly (Space)"
        >
          <List className="w-3.5 h-3.5" />
          <span>Linear View</span>
          <kbd className="text-[10px] bg-[#12141a] px-1 rounded text-slate-400">Space</kbd>
        </button>

        <div className="w-[1px] h-4 bg-[#2a2f3d] mx-1" />

        <button
          onClick={zoomIn}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-[#222735] rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={zoomOut}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-[#222735] rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={resetZoom}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-[#222735] rounded transition-colors"
          title="Reset Zoom (100%)"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <span className="text-[11px] text-slate-400 px-2 font-mono tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* SVG & HTML Graph Canvas */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${bounds.width}px`,
          height: `${bounds.height}px`
        }}
        className="transition-transform duration-75 ease-out"
      >
        {/* SVG Connector Lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: `${bounds.width}px`, height: `${bounds.height}px` }}
        >
          {renderEdges()}
        </svg>

        {/* Basic Block Nodes */}
        {blocks.map((block) => {
          const isBlockSelected = block.instructions.some((ins) => ins.address === selectedAddress);

          return (
            <div
              key={block.id}
              style={{
                position: 'absolute',
                left: `${block.x ?? 100}px`,
                top: `${block.y ?? 100}px`,
                width: `${block.width ?? 320}px`
              }}
              className={`bg-[#171922] border rounded-md shadow-2xl transition-all ${
                isBlockSelected
                  ? 'border-cyan-400 ring-2 ring-cyan-500/30'
                  : 'border-[#2d3242] hover:border-slate-500'
              }`}
            >
              {/* Block Header */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#1f2230] border-b border-[#2d3242] rounded-t-md text-[11px] font-semibold text-slate-300">
                <span className="text-cyan-400">loc_{block.startAddress.toString(16)}</span>
                <span className="text-slate-500 text-[10px]">
                  {block.instructions.length} ins
                </span>
              </div>

              {/* Block Instructions */}
              <div className="p-2 space-y-1">
                {block.instructions.map((ins, iIdx) => {
                  const isCurrent = selectedAddress === ins.address;
                  return (
                    <div
                      key={iIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAddress(ins.address);
                      }}
                      className={`px-2 py-0.5 rounded cursor-pointer flex items-center justify-between text-xs font-mono transition-colors ${
                        isCurrent
                          ? 'bg-cyan-950/70 text-cyan-200 font-bold'
                          : 'hover:bg-[#232737] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {settings.showAddresses && (
                          <span className="text-slate-500 text-[10px] tabular-nums">
                            {ins.address.toString(16)}:
                          </span>
                        )}
                        <span className="text-sky-400 font-semibold">{ins.mnemonic}</span>
                        <span className="text-slate-200 truncate">{ins.operands}</span>
                      </div>
                      {ins.comment && (
                        <span className="text-[10px] text-slate-500 italic ml-2 truncate max-w-[120px]">
                          ; {ins.comment}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Block Branch Target Indicator */}
              {(block.trueTarget || block.falseTarget || block.unconditionalTarget) && (
                <div className="flex items-center justify-between px-3 py-1 bg-[#13151c] border-t border-[#232734] text-[10px] rounded-b-md">
                  {block.trueTarget && (
                    <span className="text-emerald-400 font-medium">
                      True → 0x{block.trueTarget.toString(16)}
                    </span>
                  )}
                  {block.falseTarget && (
                    <span className="text-rose-400 font-medium">
                      False → 0x{block.falseTarget.toString(16)}
                    </span>
                  )}
                  {block.unconditionalTarget && (
                    <span className="text-cyan-400 font-medium">
                      Jump → 0x{block.unconditionalTarget.toString(16)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Minimap (Binary Ninja & IDA Pro Style) */}
      <div className="absolute bottom-4 right-4 z-20 w-48 h-36 bg-[#151720]/90 backdrop-blur border border-[#2b3040] rounded-lg shadow-xl overflow-hidden p-1 pointer-events-none">
        <div className="relative w-full h-full bg-[#0d0e14] rounded">
          {/* Mini blocks */}
          {blocks.map((b) => {
            const scaleX = 180 / bounds.width;
            const scaleY = 130 / bounds.height;
            return (
              <div
                key={`mini-${b.id}`}
                style={{
                  position: 'absolute',
                  left: `${(b.x ?? 100) * scaleX}px`,
                  top: `${(b.y ?? 100) * scaleY}px`,
                  width: `${(b.width ?? 300) * scaleX}px`,
                  height: `${(b.height ?? 120) * scaleY}px`
                }}
                className="bg-cyan-500/40 border border-cyan-400/60 rounded-[1px]"
              />
            );
          })}

          {/* Viewport Box */}
          <div
            style={{
              position: 'absolute',
              left: `${Math.max(0, -pan.x * (180 / (bounds.width * zoom)))}px`,
              top: `${Math.max(0, -pan.y * (130 / (bounds.height * zoom)))}px`,
              width: `${Math.min(180, (containerRef.current?.clientWidth || 800) * (180 / (bounds.width * zoom)))}px`,
              height: `${Math.min(130, (containerRef.current?.clientHeight || 600) * (130 / (bounds.height * zoom)))}px`
            }}
            className="border-2 border-amber-400/80 bg-amber-400/10 rounded pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};
