import React from 'react';
import {
  Frame,
  Layers,
  BarChart3,
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  FileImage,
  Sparkles,
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  AlignCenter,
} from 'lucide-react';
import {
  estimateExportFileSizeBytes,
  formatBytes,
} from '../exporters/RasterExporter';
import {
  ARTBOARD_PRESETS,
  convertArtboardUnit,
  getArtboardPixelDimensions,
} from '../managers/ArtboardManager';
import {
  ArtboardPresetId,
  ArtboardUnit,
  ExportFormat,
  ParticleGenerationResult,
  StudioConfig,
  VectorGroupingMode,
} from '../types/studio';
import {
  AccordionSection,
  SliderNumericRow,
  ToggleSwitchRow,
} from './ui/StudioControls';

interface RightSidebarProps {
  config: StudioConfig;
  particleResult: ParticleGenerationResult | null;
  onUpdateConfig: (updater: (prev: StudioConfig) => StudioConfig, isDragging?: boolean) => void;
  onExportArtwork: () => void;
  onDownloadIllustratorJsxOnly: () => void;
  isExporting: boolean;
  exportStatus: { type: 'success' | 'error'; message: string } | null;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  config,
  particleResult,
  onUpdateConfig,
  onExportArtwork,
  onDownloadIllustratorJsxOnly,
  isExporting,
  exportStatus,
}) => {
  const art = config.artboard;
  const exp = config.export;
  const { widthPx, heightPx } = getArtboardPixelDimensions(art);

  const handlePresetChange = (presetId: ArtboardPresetId) => {
    const spec = ARTBOARD_PRESETS.find((p) => p.id === presetId);
    if (!spec) return;
    onUpdateConfig((prev) => ({
      ...prev,
      artboard: {
        ...prev.artboard,
        presetId,
        width: spec.width,
        height: spec.height,
        unit: spec.unit,
        dpi: spec.defaultDpi,
        orientation:
          spec.width === spec.height
            ? 'square'
            : spec.width > spec.height
            ? 'landscape'
            : 'portrait',
      },
    }));
  };

  const handleUnitChange = (newUnit: ArtboardUnit) => {
    onUpdateConfig((prev) => {
      const convertedW = convertArtboardUnit(
        prev.artboard.width,
        prev.artboard.unit,
        newUnit,
        prev.artboard.dpi
      );
      const convertedH = convertArtboardUnit(
        prev.artboard.height,
        prev.artboard.unit,
        newUnit,
        prev.artboard.dpi
      );
      return {
        ...prev,
        artboard: {
          ...prev.artboard,
          unit: newUnit,
          width: convertedW,
          height: convertedH,
        },
      };
    });
  };

  const handleSwapOrientation = () => {
    onUpdateConfig((prev) => ({
      ...prev,
      artboard: {
        ...prev.artboard,
        presetId: 'custom',
        width: prev.artboard.height,
        height: prev.artboard.width,
        orientation:
          prev.artboard.height === prev.artboard.width
            ? 'square'
            : prev.artboard.height > prev.artboard.width
            ? 'landscape'
            : 'portrait',
      },
    }));
  };

  const estimatedBytes = particleResult
    ? estimateExportFileSizeBytes(particleResult, config)
    : 0;

  return (
    <aside className="w-[335px] bg-[#16181D] border-l border-[#262932] flex flex-col h-full shrink-0 select-none overflow-hidden">
      {/* Sidebar Header */}
      <div className="px-3.5 py-2 bg-[#14161B] border-b border-[#262932] flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Artboard & Vector Export
        </span>
        <span className="text-[10px] font-mono text-[#6B7280]">R-EXPORT</span>
      </div>

      {/* Scrollable Sections */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#262932]">
        {/* 1. ARTBOARD SETTINGS */}
        <AccordionSection
          title="Artboard Setup"
          icon={<Frame className="w-3.5 h-3.5" />}
          badge={`${widthPx}×${heightPx}px`}
          defaultOpen={true}
        >
          {/* Preset Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[#9CA3AF]">
              Artboard Dimension Preset
            </label>
            <select
              value={art.presetId}
              onChange={(e) => handlePresetChange(e.target.value as ArtboardPresetId)}
              className="w-full px-2 py-1.5 text-[11px] bg-[#0D0E11] border border-[#262932] focus:border-[#F59E0B] focus:outline-none rounded text-[#F3F4F6]"
            >
              {ARTBOARD_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Width, Height, Swap & Units */}
          <div className="grid grid-cols-11 gap-1.5 items-end pt-1">
            <div className="col-span-4 space-y-1">
              <label className="text-[10px] text-[#9CA3AF]">Width ({art.unit})</label>
              <input
                type="number"
                min={1}
                max={12000}
                step={art.unit === 'px' ? 10 : 0.5}
                value={art.width}
                onChange={(e) => {
                  const raw = parseFloat(e.target.value);
                  if (!Number.isFinite(raw) || raw <= 0) return;
                  onUpdateConfig((prev) => {
                    const ratio = prev.artboard.height / prev.artboard.width;
                    const nextH = prev.artboard.maintainAspectRatio
                      ? Number((raw * ratio).toFixed(prev.artboard.unit === 'px' ? 0 : 2))
                      : prev.artboard.height;
                    return {
                      ...prev,
                      artboard: {
                        ...prev.artboard,
                        presetId: 'custom',
                        width: raw,
                        height: nextH,
                      },
                    };
                  });
                }}
                className="w-full px-2 py-1 text-[11px] font-mono bg-[#0D0E11] border border-[#262932] focus:border-[#F59E0B] rounded text-[#F3F4F6]"
              />
            </div>

            <div className="col-span-1 flex justify-center pb-1">
              <button
                type="button"
                onClick={handleSwapOrientation}
                title="Swap Portrait / Landscape Orientation"
                className="p-1 text-[#9CA3AF] hover:text-[#FBBF24] bg-[#0D0E11] border border-[#262932] rounded"
              >
                <ArrowLeftRight className="w-3 h-3" />
              </button>
            </div>

            <div className="col-span-4 space-y-1">
              <label className="text-[10px] text-[#9CA3AF]">Height ({art.unit})</label>
              <input
                type="number"
                min={1}
                max={12000}
                step={art.unit === 'px' ? 10 : 0.5}
                value={art.height}
                onChange={(e) => {
                  const raw = parseFloat(e.target.value);
                  if (!Number.isFinite(raw) || raw <= 0) return;
                  onUpdateConfig((prev) => {
                    const ratio = prev.artboard.width / prev.artboard.height;
                    const nextW = prev.artboard.maintainAspectRatio
                      ? Number((raw * ratio).toFixed(prev.artboard.unit === 'px' ? 0 : 2))
                      : prev.artboard.width;
                    return {
                      ...prev,
                      artboard: {
                        ...prev.artboard,
                        presetId: 'custom',
                        height: raw,
                        width: nextW,
                      },
                    };
                  });
                }}
                className="w-full px-2 py-1 text-[11px] font-mono bg-[#0D0E11] border border-[#262932] focus:border-[#F59E0B] rounded text-[#F3F4F6]"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-[10px] text-[#9CA3AF]">Unit</label>
              <select
                value={art.unit}
                onChange={(e) => handleUnitChange(e.target.value as ArtboardUnit)}
                className="w-full px-1 py-1 text-[11px] font-mono bg-[#0D0E11] border border-[#262932] rounded text-[#F3F4F6]"
              >
                <option value="px">px</option>
                <option value="in">in</option>
                <option value="mm">mm</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>

          {/* DPI Selector */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] font-medium text-[#9CA3AF]">Resolution (DPI)</span>
            <div className="flex items-center gap-1">
              {[72, 150, 300, 600].map((dpiVal) => (
                <button
                  key={dpiVal}
                  type="button"
                  onClick={() =>
                    onUpdateConfig((prev) => ({
                      ...prev,
                      artboard: { ...prev.artboard, dpi: dpiVal },
                      export: { ...prev.export, exportDpi: dpiVal },
                    }))
                  }
                  className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                    art.dpi === dpiVal
                      ? 'bg-[#F59E0B] text-[#0D0E11] border-[#FBBF24] font-semibold'
                      : 'bg-[#0D0E11] text-[#9CA3AF] border-[#262932] hover:text-white'
                  }`}
                >
                  {dpiVal}
                </button>
              ))}
            </div>
          </div>

          <ToggleSwitchRow
            label="Maintain Artboard Aspect Ratio"
            checked={art.maintainAspectRatio}
            onChange={(checked) =>
              onUpdateConfig((prev) => ({
                ...prev,
                artboard: { ...prev.artboard, maintainAspectRatio: checked },
              }))
            }
          />

          {/* Quick Center & Fit Artwork Buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  transform: {
                    ...prev.transform,
                    offsetX: 0,
                    offsetY: 0,
                  },
                }))
              }
              className="py-1 px-2 text-[10px] font-medium bg-[#22252E] hover:bg-[#2C303C] text-[#E5E7EB] rounded border border-[#323644] flex items-center justify-center gap-1"
            >
              <AlignCenter className="w-3 h-3 text-[#F59E0B]" />
              <span>Center Artwork</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  transform: {
                    ...prev.transform,
                    fitMode: 'contain',
                    scale: 1,
                    offsetX: 0,
                    offsetY: 0,
                    rotation: 0,
                  },
                }))
              }
              className="py-1 px-2 text-[10px] font-medium bg-[#22252E] hover:bg-[#2C303C] text-[#E5E7EB] rounded border border-[#323644] flex items-center justify-center gap-1"
            >
              <Frame className="w-3 h-3 text-[#F59E0B]" />
              <span>Fit to Artboard</span>
            </button>
          </div>
        </AccordionSection>

        {/* 2. PARTICLE STATISTICS & VECTOR LAYER STRUCTURE */}
        <AccordionSection
          title="Particle Statistics & Layers"
          icon={<BarChart3 className="w-3.5 h-3.5" />}
          badge={
            particleResult ? particleResult.stats.totalCount.toLocaleString() : '0'
          }
          defaultOpen={true}
        >
          {particleResult ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded bg-[#0D0E11] border border-[#262932] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9CA3AF]">Total Editable Vectors</span>
                  <span className="font-mono font-semibold text-[#FBBF24]">
                    {particleResult.stats.totalCount.toLocaleString()}
                  </span>
                </div>
                <div className="h-[1px] bg-[#262932]" />
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Main Layer:</span>
                    <span className="text-[#E5E7EB]">
                      {particleResult.stats.mainCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Edge Layer:</span>
                    <span className="text-[#38BDF8]">
                      {particleResult.stats.edgeCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Scatter Dust:</span>
                    <span className="text-[#A855F7]">
                      {particleResult.stats.scatterCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Highlights:</span>
                    <span className="text-[#FDE047]">
                      {particleResult.stats.highlightCount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-[1px] bg-[#262932]" />
                <div className="flex items-center justify-between text-[10px] font-mono text-[#9CA3AF]">
                  <span>Min R: {particleResult.stats.minRadius}px</span>
                  <span>Avg R: {particleResult.stats.avgRadius}px</span>
                  <span>Max R: {particleResult.stats.maxRadius}px</span>
                </div>
              </div>

              {/* Vector Grouping Structure Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#9CA3AF] flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-[#F59E0B]" />
                  <span>Vector Export Layer Structure</span>
                </label>
                <select
                  value={exp.groupingMode}
                  onChange={(e) =>
                    onUpdateConfig((prev) => ({
                      ...prev,
                      export: {
                        ...prev.export,
                        groupingMode: e.target.value as VectorGroupingMode,
                      },
                    }))
                  }
                  className="w-full px-2 py-1.5 text-[11px] bg-[#0D0E11] border border-[#262932] focus:border-[#F59E0B] rounded text-[#E5E7EB]"
                >
                  <option value="by-layer">
                    Logical Layers (Background, Main, Edge, Scatter, Glow)
                  </option>
                  <option value="all-grouped">Group All Particles Together</option>
                  <option value="by-color">Separate Vector Groups by Color</option>
                  <option value="by-size">Separate Vector Groups by Particle Size</option>
                  <option value="by-type">Separate Vector Groups by Particle Type</option>
                  <option value="ungrouped">Ungrouped Individual Vector Elements</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-[#6B7280] py-2">
              No particles generated yet.
            </div>
          )}
        </AccordionSection>

        {/* 3. PROFESSIONAL EXPORT SYSTEM */}
        <AccordionSection
          title="Export Artwork"
          icon={<Download className="w-3.5 h-3.5" />}
          badge={exp.format.toUpperCase()}
          defaultOpen={true}
        >
          {/* Filename Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[#9CA3AF]">Export Filename</label>
            <input
              type="text"
              value={exp.filename}
              onChange={(e) =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  export: { ...prev.export, filename: e.target.value },
                }))
              }
              placeholder="particleforge-artwork"
              className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-[#0D0E11] border border-[#262932] focus:border-[#F59E0B] focus:outline-none rounded text-[#F3F4F6]"
            />
          </div>

          {/* Format Selection Grid */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-medium text-[#9CA3AF]">
              Select Export Format
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  {
                    id: 'svg',
                    title: 'SVG Vector',
                    sub: 'Editable XML groups',
                    icon: <FileCode2 className="w-3.5 h-3.5" />,
                  },
                  {
                    id: 'eps',
                    title: 'EPS Vector',
                    sub: 'PostScript EPSF-3.0',
                    icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
                  },
                  {
                    id: 'ai-workflow',
                    title: 'Illustrator (.AI)',
                    sub: 'Vector + .JSX Bridge',
                    icon: <Sparkles className="w-3.5 h-3.5" />,
                  },
                  {
                    id: 'pdf',
                    title: 'PDF Vector',
                    sub: 'Editable PDF 1.4',
                    icon: <FileText className="w-3.5 h-3.5" />,
                  },
                  {
                    id: 'png',
                    title: 'PNG Raster',
                    sub: 'Lossless + Alpha',
                    icon: <FileImage className="w-3.5 h-3.5" />,
                  },
                  {
                    id: 'jpg',
                    title: 'JPG Raster',
                    sub: 'High-Res Print',
                    icon: <FileImage className="w-3.5 h-3.5" />,
                  },
                ] as Array<{
                  id: ExportFormat;
                  title: string;
                  sub: string;
                  icon: React.ReactNode;
                }>
              ).map((fmt) => {
                const active = exp.format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() =>
                      onUpdateConfig((prev) => ({
                        ...prev,
                        export: { ...prev.export, format: fmt.id },
                      }))
                    }
                    className={`p-2 rounded border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F3F4F6]'
                        : 'bg-[#0D0E11] border-[#262932] text-[#9CA3AF] hover:border-[#374151] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={active ? 'text-[#F59E0B]' : 'text-[#6B7280]'}>
                        {fmt.icon}
                      </span>
                      <span className="text-[11px] font-semibold">{fmt.title}</span>
                    </div>
                    <div className="text-[10px] text-[#6B7280] mt-0.5">{fmt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Adobe Illustrator Native .AI Workflow Explanation Box */}
          {exp.format === 'ai-workflow' && (
            <div className="p-2.5 rounded bg-[#0D0E11] border border-[#F59E0B]/40 space-y-2">
              <div className="text-[11px] font-semibold text-[#FBBF24] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Adobe Illustrator Native (.AI) Bridge</span>
              </div>
              <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
                Native binary <code className="text-[#E5E7EB]">.ai</code> saving requires Adobe
                Illustrator. Clicking Export downloads a layered editable{' '}
                <code className="text-[#E5E7EB]">.svg</code> vector file plus an automated{' '}
                <code className="text-[#FBBF24]">.jsx</code> Illustrator script that promotes each
                particle group into native Illustrator Layers and saves a true{' '}
                <code className="text-[#E5E7EB]">.ai</code> file.
              </p>
              <button
                type="button"
                onClick={onDownloadIllustratorJsxOnly}
                className="w-full py-1 px-2 text-[10px] font-medium bg-[#22252E] hover:bg-[#2C303C] text-[#FBBF24] rounded border border-[#323644] transition-colors"
              >
                Download .JSX Automation Script Separately
              </button>
            </div>
          )}

          {/* Format Options */}
          <div className="space-y-1.5 pt-1">
            <ToggleSwitchRow
              label="Include Artboard Background"
              description={
                exp.includeBackground
                  ? `Exporting with ${config.background.type} background`
                  : 'Exporting with 100% transparent background'
              }
              checked={exp.includeBackground}
              onChange={(checked) =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  export: { ...prev.export, includeBackground: checked },
                }))
              }
            />

            <ToggleSwitchRow
              label="Include Glow / Atmosphere Layer"
              description="Kept separate from core vector particle paths"
              checked={exp.includeVectorGlow}
              onChange={(checked) =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  export: { ...prev.export, includeVectorGlow: checked },
                }))
              }
            />

            {exp.format === 'jpg' && (
              <SliderNumericRow
                label="JPEG Compression Quality"
                value={exp.jpgQuality}
                min={10}
                max={100}
                step={1}
                unit="%"
                onChange={(val) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    export: { ...prev.export, jpgQuality: val },
                  }))
                }
              />
            )}
          </div>

          {/* Export Summary Card */}
          <div className="p-2.5 rounded bg-[#0D0E11] border border-[#262932] space-y-1 text-[10px] font-mono">
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Output Dimensions:</span>
              <span className="text-[#E5E7EB]">
                {widthPx} × {heightPx} px ({art.dpi} DPI)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Vector Elements:</span>
              <span className="text-[#FBBF24]">
                {particleResult ? particleResult.stats.totalCount.toLocaleString() : 0} paths
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Estimated File Size:</span>
              <span className="text-[#10B981]">~{formatBytes(estimatedBytes)}</span>
            </div>
          </div>

          {/* Primary Export Action Button */}
          <button
            type="button"
            onClick={onExportArtwork}
            disabled={isExporting || !particleResult || particleResult.stats.totalCount === 0}
            className="w-full py-2.5 px-4 text-[12px] font-bold bg-[#F59E0B] hover:bg-[#FBBF24] text-[#0D0E11] rounded-md shadow-md shadow-[#F59E0B]/20 disabled:opacity-40 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.4]" />
            <span>
              {isExporting
                ? 'Generating Export File...'
                : exp.format === 'ai-workflow'
                ? 'Export Vector + Illustrator .JSX'
                : `Export ${exp.format.toUpperCase()} Artwork`}
            </span>
          </button>

          {/* Export Status Feedback Banner */}
          {exportStatus && (
            <div
              className={`p-2 rounded border text-[11px] flex items-start gap-2 ${
                exportStatus.type === 'success'
                  ? 'bg-[#10B981]/10 border-[#10B981]/40 text-[#34D399]'
                  : 'bg-red-950/50 border-red-700/50 text-red-300'
              }`}
            >
              {exportStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{exportStatus.message}</span>
            </div>
          )}
        </AccordionSection>
      </div>
    </aside>
  );
};
