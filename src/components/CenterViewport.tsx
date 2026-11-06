import React, { useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Hand,
  Columns,
  SplitSquareVertical,
  Eye,
  Image as ImageIcon,
  Cpu,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { renderParticlesToCanvas } from '../engine/CanvasRenderer';
import {
  AnalyzedImageBuffer,
  ParticleGenerationResult,
  PreviewViewMode,
  ProcessingQuality,
  SourceImageMetadata,
  StudioConfig,
} from '../types/studio';

interface CenterViewportProps {
  config: StudioConfig;
  particleResult: ParticleGenerationResult | null;
  analyzedBuffer: AnalyzedImageBuffer | null;
  sourceImage: SourceImageMetadata | null;
  sourceImageElement: HTMLImageElement | null;
  isGenerating: boolean;
  activeQuality: ProcessingQuality;
  lockFinalQuality: boolean;
  onToggleLockFinalQuality: (locked: boolean) => void;
  onCancelGeneration: () => void;
}

export const CenterViewport: React.FC<CenterViewportProps> = ({
  config,
  particleResult,
  analyzedBuffer,
  sourceImage,
  sourceImageElement,
  isGenerating,
  activeQuality,
  lockFinalQuality,
  onToggleLockFinalQuality,
  onCancelGeneration,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [viewMode, setViewMode] = useState<PreviewViewMode>('particles');
  const [zoom, setZoom] = useState<number>(0.22);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [splitPosition, setSplitPosition] = useState<number>(50); // 0 to 100%
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [previewBackdrop, setPreviewBackdrop] = useState<'checker' | 'dark' | 'light'>('checker');

  const artW = particleResult?.artboardWidthPx || 3000;
  const artH = particleResult?.artboardHeightPx || 3000;

  // Render preview at a responsive display canvas resolution (up to 1400px on longest side for 60fps zoom/pan)
  const maxPreviewDim = 1400;
  const previewScale = Math.min(1, maxPreviewDim / Math.max(artW, artH));
  const canvasW = Math.max(128, Math.round(artW * previewScale));
  const canvasH = Math.max(128, Math.round(artH * previewScale));

  // Fit artboard neatly inside viewport container
  const fitToScreen = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 72;
    const availW = Math.max(200, rect.width - pad);
    const availH = Math.max(200, rect.height - pad);
    const divisorW = viewMode === 'side-by-side' ? canvasW * 2 + 24 : canvasW;
    const nextZoom = Math.min(availW / divisorW, availH / canvasH);
    setZoom(Number(Math.max(0.05, Math.min(4, nextZoom)).toFixed(3)));
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    fitToScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasW, canvasH, viewMode]);

  // Draw Particle Canvas whenever particleResult or visual settings change
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas || !particleResult) return;
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderParticlesToCanvas(ctx, particleResult, config, {
      includeBackground: config.background.type !== 'transparent',
      includeGlow: true,
      sourceImageElement,
      targetWidth: canvasW,
      targetHeight: canvasH,
    });
  }, [particleResult, config, sourceImageElement, canvasW, canvasH]);

  // Draw Original / Preprocessed Canvas for comparison modes
  useEffect(() => {
    if (viewMode === 'particles') return;
    const canvas = originalCanvasRef.current;
    if (!canvas) return;
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasW, canvasH);

    if (viewMode === 'preprocessed' && analyzedBuffer) {
      const off = document.createElement('canvas');
      off.width = analyzedBuffer.width;
      off.height = analyzedBuffer.height;
      const offCtx = off.getContext('2d');
      if (offCtx) {
        const imgData = offCtx.createImageData(analyzedBuffer.width, analyzedBuffer.height);
        for (let i = 0; i < analyzedBuffer.luminance.length; i++) {
          const p = i * 4;
          const edge = Math.round(analyzedBuffer.edgeMap[i] * 255);
          imgData.data[p] = Math.min(255, analyzedBuffer.rgba[p] + edge * 0.65);
          imgData.data[p + 1] = Math.min(255, analyzedBuffer.rgba[p + 1] + edge * 0.45);
          imgData.data[p + 2] = analyzedBuffer.rgba[p + 2];
          imgData.data[p + 3] = analyzedBuffer.rgba[p + 3];
        }
        offCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(off, 0, 0, canvasW, canvasH);
      }
    } else if (sourceImageElement) {
      ctx.fillStyle = '#07080C';
      ctx.fillRect(0, 0, canvasW, canvasH);
      const srcAspect = sourceImageElement.naturalWidth / sourceImageElement.naturalHeight;
      const dstAspect = canvasW / canvasH;
      let dw = canvasW;
      let dh = canvasH;
      if (srcAspect > dstAspect) {
        dh = canvasW / srcAspect;
      } else {
        dw = canvasH * srcAspect;
      }
      ctx.drawImage(
        sourceImageElement,
        (canvasW - dw) * 0.5,
        (canvasH - dh) * 0.5,
        dw,
        dh
      );
    }
  }, [viewMode, analyzedBuffer, sourceImageElement, canvasW, canvasH]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoom((z) => Number(Math.max(0.08, Math.min(6, z * factor)).toFixed(3)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingSplit) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingSplit && containerRef.current) {
      const rect = particleCanvasRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0) {
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setSplitPosition(Math.max(2, Math.min(98, pct)));
      }
      return;
    }
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const stopDragging = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  // Actual size sets zoom so 1 artboard pixel = 1 screen pixel
  const setActualSize = () => {
    setZoom(Number((1 / previewScale).toFixed(3)));
    setPan({ x: 0, y: 0 });
  };

  const actualArtboardZoomPct = Math.round(zoom * previewScale * 100);

  return (
    <main className="flex-1 flex flex-col bg-[#0D0E11] h-full min-w-0 relative overflow-hidden select-none">
      {/* Top Floating Viewport Toolbar */}
      <div className="h-10 bg-[#14161B] border-b border-[#262932] px-3 flex items-center justify-between gap-2 z-20 shrink-0">
        {/* View / Comparison Mode Selector */}
        <div className="flex items-center gap-1 bg-[#0D0E11] p-0.5 rounded border border-[#262932]">
          {(
            [
              {
                id: 'particles',
                label: 'Particle Preview',
                icon: <Sparkles className="w-3 h-3" />,
              },
              {
                id: 'original',
                label: 'Original',
                icon: <ImageIcon className="w-3 h-3" />,
              },
              {
                id: 'preprocessed',
                label: 'Edge Analysis',
                icon: <Eye className="w-3 h-3" />,
              },
              {
                id: 'split-compare',
                label: 'Before/After Split',
                icon: <SplitSquareVertical className="w-3 h-3" />,
              },
              {
                id: 'side-by-side',
                label: 'Side-by-Side',
                icon: <Columns className="w-3 h-3" />,
              },
            ] as Array<{ id: PreviewViewMode; label: string; icon: React.ReactNode }>
          ).map((vm) => (
            <button
              key={vm.id}
              type="button"
              onClick={() => setViewMode(vm.id)}
              className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                viewMode === vm.id
                  ? 'bg-[#F59E0B] text-[#0D0E11] font-semibold'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E2028]'
              }`}
            >
              {vm.icon}
              <span className="hidden xl:inline">{vm.label}</span>
            </button>
          ))}
        </div>

        {/* Zoom & Navigation Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-[#0D0E11] border border-[#262932] rounded p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.08, z * 0.82))}
              title="Zoom Out"
              className="p-1 text-[#9CA3AF] hover:text-white hover:bg-[#1E2028] rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-13 text-center text-[11px] font-mono text-[#E5E7EB]">
              {actualArtboardZoomPct}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(6, z * 1.22))}
              title="Zoom In"
              className="p-1 text-[#9CA3AF] hover:text-white hover:bg-[#1E2028] rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="h-3.5 w-[1px] bg-[#262932] mx-0.5" />
            <button
              type="button"
              onClick={fitToScreen}
              title="Fit Artboard to Screen"
              className="px-2 py-0.5 text-[10px] font-medium text-[#D1D5DB] hover:text-white hover:bg-[#1E2028] rounded flex items-center gap-1"
            >
              <Maximize className="w-3 h-3" />
              <span>Fit</span>
            </button>
            <button
              type="button"
              onClick={setActualSize}
              title="Actual Pixel Size (100%)"
              className="px-2 py-0.5 text-[10px] font-mono text-[#D1D5DB] hover:text-white hover:bg-[#1E2028] rounded"
            >
              1:1
            </button>
          </div>

          {/* Preview Backdrop Matting */}
          <div className="hidden md:flex items-center bg-[#0D0E11] border border-[#262932] rounded p-0.5 gap-0.5">
            {(
              [
                { id: 'checker', label: 'Grid' },
                { id: 'dark', label: 'Dark' },
                { id: 'light', label: 'Light' },
              ] as const
            ).map((bd) => (
              <button
                key={bd.id}
                type="button"
                onClick={() => setPreviewBackdrop(bd.id)}
                className={`px-2 py-0.5 text-[10px] rounded ${
                  previewBackdrop === bd.id
                    ? 'bg-[#262932] text-[#FBBF24] font-medium'
                    : 'text-[#6B7280] hover:text-[#D1D5DB]'
                }`}
              >
                {bd.label}
              </button>
            ))}
          </div>

          {/* Preview Quality Selector */}
          <button
            type="button"
            onClick={() => onToggleLockFinalQuality(!lockFinalQuality)}
            title="Toggle between Adaptive Preview Quality while dragging sliders vs Locked Final Quality"
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-mono transition-colors ${
              lockFinalQuality
                ? 'bg-[#10B981]/15 border-[#10B981]/50 text-[#34D399]'
                : 'bg-[#0D0E11] border-[#262932] text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>{lockFinalQuality ? 'Quality: Final' : `Auto (${activeQuality})`}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Stage */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        className={`flex-1 relative overflow-hidden flex items-center justify-center ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Subtle studio dot grid backdrop */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: 'radial-gradient(#374151 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Transformed Artboard Container */}
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.06s ease-out',
          }}
          className="flex items-center gap-6"
        >
          {/* Side-by-Side Original Panel */}
          {viewMode === 'side-by-side' && (
            <div className="relative shadow-2xl border border-[#2E323E] rounded-sm overflow-hidden bg-[#07080C]">
              <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded bg-black/75 border border-white/15 text-[11px] font-mono text-[#E5E7EB]">
                ORIGINAL SOURCE ({sourceImage?.width || artW}×{sourceImage?.height || artH})
              </div>
              <canvas
                ref={originalCanvasRef}
                width={canvasW}
                height={canvasH}
                className="block"
              />
            </div>
          )}

          {/* Primary Artboard Frame */}
          <div
            style={{ width: canvasW, height: canvasH }}
            className={`relative shadow-[0_20px_70px_rgba(0,0,0,0.85)] border border-[#2E323E] rounded-sm overflow-hidden ${
              previewBackdrop === 'checker'
                ? 'bg-checkerboard'
                : previewBackdrop === 'light'
                ? 'bg-[#E5E7EB]'
                : 'bg-[#07080C]'
            }`}
          >
            {/* Particle Canvas (visible in particles, split-compare, side-by-side) */}
            <canvas
              ref={particleCanvasRef}
              width={canvasW}
              height={canvasH}
              className={`block w-full h-full ${
                viewMode === 'original' || viewMode === 'preprocessed' ? 'hidden' : 'block'
              }`}
            />

            {/* Single Original or Preprocessed View */}
            {(viewMode === 'original' || viewMode === 'preprocessed') && (
              <canvas
                ref={originalCanvasRef}
                width={canvasW}
                height={canvasH}
                className="block w-full h-full"
              />
            )}

            {/* Split Before/After Overlay */}
            {viewMode === 'split-compare' && (
              <>
                <div
                  style={{
                    width: `${splitPosition}%`,
                  }}
                  className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-[#F59E0B]"
                >
                  <canvas
                    ref={originalCanvasRef}
                    width={canvasW}
                    height={canvasH}
                    style={{ width: canvasW, height: canvasH, maxWidth: 'none' }}
                    className="block"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white border border-white/15">
                    BEFORE (ORIGINAL)
                  </div>
                </div>
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-[#FBBF24] border border-[#F59E0B]/40">
                  AFTER (PARTICLES)
                </div>

                {/* Split Drag Handle */}
                <div
                  style={{ left: `${splitPosition}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDraggingSplit(true);
                  }}
                  className="absolute inset-y-0 -ml-3 w-6 flex items-center justify-center cursor-ew-resize z-20"
                >
                  <div className="w-6 h-10 rounded-full bg-[#F59E0B] text-[#0D0E11] shadow-lg flex items-center justify-center border border-[#FEF3C7]">
                    <SplitSquareVertical className="w-3.5 h-3.5" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Active Processing Progress Pill + Cancel Button */}
        {isGenerating && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#181A20]/95 border border-[#38BDF8]/50 shadow-xl backdrop-blur-md">
            <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-ping" />
            <span className="text-[11px] font-mono text-[#E5E7EB]">
              Computing Particles ({activeQuality.toUpperCase()})...
            </span>
            <button
              type="button"
              onClick={onCancelGeneration}
              className="flex items-center gap-1 text-[10px] font-medium text-red-400 hover:text-red-300 ml-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        )}

        {/* Bottom Status HUD Bar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#14161B]/90 border border-[#262932] backdrop-blur-md text-[11px] font-mono text-[#9CA3AF] pointer-events-auto">
            <Hand className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Drag to Pan • Scroll to Zoom</span>
            <span className="text-[#374151]">|</span>
            <span>
              Artboard:{' '}
              <strong className="text-[#E5E7EB]">
                {artW} × {artH} px
              </strong>{' '}
              ({config.artboard.dpi} DPI)
            </span>
          </div>

          {particleResult && (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-[#14161B]/90 border border-[#262932] backdrop-blur-md text-[11px] font-mono pointer-events-auto">
              <div>
                <span className="text-[#9CA3AF]">Active Vectors: </span>
                <span className="text-[#FBBF24] font-semibold">
                  {particleResult.stats.totalCount.toLocaleString()}
                </span>
              </div>
              <span className="text-[#374151]">|</span>
              <div className="hidden sm:block">
                <span className="text-[#9CA3AF]">Shape: </span>
                <span className="text-[#E5E7EB] uppercase">{config.shape.shape}</span>
              </div>
              <span className="text-[#374151] hidden sm:inline">|</span>
              <div>
                <span className="text-[#9CA3AF]">Engine: </span>
                <span className="text-[#10B981]">
                  {particleResult.stats.generationTimeMs} ms
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
