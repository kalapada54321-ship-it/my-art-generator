import React, { useRef, useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Grid,
  Compass,
  Maximize2,
  Shapes,
  Palette,
  Sun,
  Layers,
  RefreshCw,
  Trash2,
  Crop,
  Shuffle,
  Info,
  Plus,
  X,
} from 'lucide-react';
import { SAMPLE_SUBJECTS } from '../engine/SampleGenerator';
import { formatBytes } from '../exporters/RasterExporter';
import {
  BackgroundType,
  ColorMode,
  ColorPalettePresetId,
  DEFAULT_STUDIO_CONFIG,
  GenerationMode,
  ParticleDistributionCurve,
  ParticleShape,
  ParticleSizeMode,
  SourceImageMetadata,
  StudioConfig,
} from '../types/studio';
import { COLOR_PALETTES } from '../utils/colorUtils';
import {
  AccordionSection,
  ColorPickerHexRgb,
  SliderNumericRow,
  ToggleSwitchRow,
} from './ui/StudioControls';

interface LeftSidebarProps {
  config: StudioConfig;
  sourceImage: SourceImageMetadata | null;
  onUpdateConfig: (updater: (prev: StudioConfig) => StudioConfig, isDragging?: boolean) => void;
  onUploadFile: (file: File) => void;
  onSelectSample: (sampleId: string) => void;
  onRemoveImage: () => void;
  onRandomizeTarget: (target: 'size' | 'position' | 'color' | 'distribution') => void;
  onApplyGoldenDustEffectPreset: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  config,
  sourceImage,
  onUpdateConfig,
  onUploadFile,
  onSelectSample,
  onRemoveImage,
  onRandomizeTarget,
  onApplyGoldenDustEffectPreset,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showTransformTools, setShowTransformTools] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  const handlePaletteSelect = (paletteId: ColorPalettePresetId) => {
    const spec = COLOR_PALETTES[paletteId];
    if (!spec) return;
    onUpdateConfig((prev) => ({
      ...prev,
      color: {
        ...prev.color,
        paletteId,
        singleColor: spec.single,
        darkColor: spec.dark,
        midColor: spec.mid,
        brightColor: spec.bright,
        baseColor: spec.single,
        gradientStops: [...spec.stops],
      },
      effects: {
        ...prev.effects,
        glowColor: spec.glow,
      },
    }));
  };

  return (
    <aside className="w-[335px] bg-[#16181D] border-r border-[#262932] flex flex-col h-full shrink-0 select-none overflow-hidden">
      {/* Sidebar Header */}
      <div className="px-3.5 py-2 bg-[#14161B] border-b border-[#262932] flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Image & Generation Settings
        </span>
        <span className="text-[10px] font-mono text-[#6B7280]">L-INSPECTOR</span>
      </div>

      {/* Scrollable Inspector Accordion List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#262932]">
        {/* 1. IMAGE UPLOAD & TRANSFORM */}
        <AccordionSection
          title="1. Source Image"
          icon={<ImageIcon className="w-3.5 h-3.5" />}
          badge={sourceImage ? `${sourceImage.width}×${sourceImage.height}` : 'None'}
          defaultOpen={true}
        >
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadFile(file);
              e.target.value = '';
            }}
            className="hidden"
          />

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-md border border-dashed p-2.5 transition-colors cursor-pointer ${
              isDraggingOver
                ? 'border-[#F59E0B] bg-[#F59E0B]/10'
                : 'border-[#323644] bg-[#0D0E11] hover:border-[#F59E0B]/60'
            }`}
          >
            {sourceImage ? (
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded bg-[#16181D] border border-[#262932] overflow-hidden shrink-0 flex items-center justify-center">
                  {sourceImage.dataUrl ? (
                    <img
                      src={sourceImage.dataUrl}
                      alt={sourceImage.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-[#6B7280]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-[#F3F4F6] truncate">
                    {sourceImage.name}
                  </div>
                  <div className="text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                    {sourceImage.width} × {sourceImage.height} px •{' '}
                    {formatBytes(sourceImage.fileSize)}
                  </div>
                  <div className="text-[10px] text-[#FBBF24] mt-0.5">
                    Click, drop, or Ctrl+V to replace
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <Upload className="w-5 h-5 text-[#F59E0B] mx-auto mb-1" />
                <div className="text-[11px] font-medium text-[#E5E7EB]">
                  Drop image, click to browse, or Paste (Ctrl+V)
                </div>
                <div className="text-[10px] text-[#6B7280] mt-0.5">
                  Supports JPG, JPEG, PNG, WEBP
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons for Current Image */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1 py-1 px-2 text-[10px] font-medium bg-[#22252E] hover:bg-[#2C303C] text-[#E5E7EB] rounded border border-[#323644] transition-colors"
            >
              <Upload className="w-3 h-3 text-[#F59E0B]" />
              <span>Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTransformTools((s) => !s)}
              className={`flex items-center justify-center gap-1 py-1 px-2 text-[10px] font-medium rounded border transition-colors ${
                showTransformTools
                  ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#FBBF24]'
                  : 'bg-[#22252E] hover:bg-[#2C303C] text-[#E5E7EB] border-[#323644]'
              }`}
            >
              <Crop className="w-3 h-3" />
              <span>Crop & Fit</span>
            </button>
            <button
              type="button"
              onClick={onRemoveImage}
              disabled={!sourceImage}
              className="flex items-center justify-center gap-1 py-1 px-2 text-[10px] font-medium bg-[#22252E] hover:bg-red-950/60 hover:border-red-700/60 text-[#E5E7EB] hover:text-red-300 disabled:opacity-35 rounded border border-[#323644] transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          </div>

          {/* Studio Sample Gallery Selector */}
          <div className="pt-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
              Studio Reference Subjects
            </div>
            <div className="grid grid-cols-3 gap-1">
              {SAMPLE_SUBJECTS.map((subj) => {
                const isSelected = sourceImage?.sampleId === subj.id;
                return (
                  <button
                    key={subj.id}
                    type="button"
                    onClick={() => onSelectSample(subj.id)}
                    title={subj.subtitle}
                    className={`px-1.5 py-1 text-left rounded border text-[10px] truncate transition-colors ${
                      isSelected
                        ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#FBBF24] font-semibold'
                        : 'bg-[#0D0E11] border-[#262932] text-[#9CA3AF] hover:text-[#E5E7EB] hover:border-[#374151]'
                    }`}
                  >
                    {subj.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Crop, Fit, Scale, Position, Rotation Controls */}
          {showTransformTools && (
            <div className="mt-2 p-2.5 rounded bg-[#0D0E11] border border-[#262932] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FBBF24]">
                  Artboard Placement & Crop
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig((prev) => ({
                      ...prev,
                      transform: { ...DEFAULT_STUDIO_CONFIG.transform },
                    }))
                  }
                  className="text-[10px] text-[#9CA3AF] hover:text-white underline"
                >
                  Reset Fit
                </button>
              </div>

              {/* Fit Mode Buttons */}
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'contain', label: 'Fit Inside' },
                    { id: 'cover', label: 'Fill / Crop' },
                    { id: 'stretch', label: 'Stretch' },
                  ] as const
                ).map((fm) => (
                  <button
                    key={fm.id}
                    type="button"
                    onClick={() =>
                      onUpdateConfig((prev) => ({
                        ...prev,
                        transform: { ...prev.transform, fitMode: fm.id },
                      }))
                    }
                    className={`py-1 text-[10px] font-medium rounded border transition-colors ${
                      config.transform.fitMode === fm.id
                        ? 'bg-[#F59E0B] text-[#0D0E11] border-[#FBBF24] font-semibold'
                        : 'bg-[#16181D] text-[#9CA3AF] border-[#262932] hover:text-white'
                    }`}
                  >
                    {fm.label}
                  </button>
                ))}
              </div>

              <SliderNumericRow
                label="Image Scale"
                value={config.transform.scale}
                min={0.2}
                max={3.0}
                step={0.05}
                unit="×"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      transform: { ...prev.transform, scale: val },
                    }),
                    dragging
                  )
                }
              />
              <SliderNumericRow
                label="Horizontal Offset (X)"
                value={config.transform.offsetX}
                min={-80}
                max={80}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      transform: { ...prev.transform, offsetX: val },
                    }),
                    dragging
                  )
                }
              />
              <SliderNumericRow
                label="Vertical Offset (Y)"
                value={config.transform.offsetY}
                min={-80}
                max={80}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      transform: { ...prev.transform, offsetY: val },
                    }),
                    dragging
                  )
                }
              />
              <SliderNumericRow
                label="Image Rotation"
                value={config.transform.rotation}
                min={-180}
                max={180}
                step={1}
                unit="°"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      transform: { ...prev.transform, rotation: val },
                    }),
                    dragging
                  )
                }
              />

              <div className="pt-1 border-t border-[#262932] grid grid-cols-2 gap-2">
                <SliderNumericRow
                  label="Crop Left"
                  value={config.transform.cropLeft}
                  min={0}
                  max={40}
                  step={1}
                  unit="%"
                  onChange={(val, dragging) =>
                    onUpdateConfig(
                      (prev) => ({
                        ...prev,
                        transform: { ...prev.transform, cropLeft: val },
                      }),
                      dragging
                    )
                  }
                />
                <SliderNumericRow
                  label="Crop Right"
                  value={config.transform.cropRight}
                  min={0}
                  max={40}
                  step={1}
                  unit="%"
                  onChange={(val, dragging) =>
                    onUpdateConfig(
                      (prev) => ({
                        ...prev,
                        transform: { ...prev.transform, cropRight: val },
                      }),
                      dragging
                    )
                  }
                />
                <SliderNumericRow
                  label="Crop Top"
                  value={config.transform.cropTop}
                  min={0}
                  max={40}
                  step={1}
                  unit="%"
                  onChange={(val, dragging) =>
                    onUpdateConfig(
                      (prev) => ({
                        ...prev,
                        transform: { ...prev.transform, cropTop: val },
                      }),
                      dragging
                    )
                  }
                />
                <SliderNumericRow
                  label="Crop Bottom"
                  value={config.transform.cropBottom}
                  min={0}
                  max={40}
                  step={1}
                  unit="%"
                  onChange={(val, dragging) =>
                    onUpdateConfig(
                      (prev) => ({
                        ...prev,
                        transform: { ...prev.transform, cropBottom: val },
                      }),
                      dragging
                    )
                  }
                />
              </div>
            </div>
          )}
        </AccordionSection>

        {/* 2. IMAGE PREPROCESSING & ANALYSIS */}
        <AccordionSection
          title="2. Image Preprocessing"
          icon={<Sliders className="w-3.5 h-3.5" />}
          defaultOpen={false}
          onResetSection={() =>
            onUpdateConfig((prev) => ({
              ...prev,
              preprocess: { ...DEFAULT_STUDIO_CONFIG.preprocess },
            }))
          }
        >
          <SliderNumericRow
            label="Brightness"
            value={config.preprocess.brightness}
            min={-100}
            max={100}
            step={1}
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  preprocess: { ...prev.preprocess, brightness: val },
                }),
                dragging
              )
            }
          />
          <SliderNumericRow
            label="Contrast"
            value={config.preprocess.contrast}
            min={-100}
            max={100}
            step={1}
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  preprocess: { ...prev.preprocess, contrast: val },
                }),
                dragging
              )
            }
          />
          <SliderNumericRow
            label="Saturation"
            value={config.preprocess.saturation}
            min={-100}
            max={100}
            step={1}
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  preprocess: { ...prev.preprocess, saturation: val },
                }),
                dragging
              )
            }
          />
          <SliderNumericRow
            label="Gamma Correction"
            value={config.preprocess.gamma}
            min={0.2}
            max={3.0}
            step={0.05}
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  preprocess: { ...prev.preprocess, gamma: val },
                }),
                dragging
              )
            }
          />
          <SliderNumericRow
            label="Edge Enhancement (Sobel)"
            value={config.preprocess.edgeEnhance}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  preprocess: { ...prev.preprocess, edgeEnhance: val },
                }),
                dragging
              )
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <SliderNumericRow
              label="Blur"
              value={config.preprocess.blur}
              min={0}
              max={6}
              step={1}
              unit="px"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    preprocess: { ...prev.preprocess, blur: val },
                  }),
                  dragging
                )
              }
            />
            <SliderNumericRow
              label="Sharpen"
              value={config.preprocess.sharpen}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    preprocess: { ...prev.preprocess, sharpen: val },
                  }),
                  dragging
                )
              }
            />
          </div>

          <div className="pt-1 border-t border-[#262932] space-y-1.5">
            <ToggleSwitchRow
              label="Convert to Grayscale"
              checked={config.preprocess.grayscale}
              onChange={(checked) =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  preprocess: { ...prev.preprocess, grayscale: checked },
                }))
              }
            />
            <ToggleSwitchRow
              label="Invert Luminance & Colors"
              checked={config.preprocess.invert}
              onChange={(checked) =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  preprocess: { ...prev.preprocess, invert: checked },
                }))
              }
            />
            <ToggleSwitchRow
              label="Binary Luminance Threshold"
              checked={config.preprocess.thresholdEnabled}
              onChange={(checked) =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  preprocess: { ...prev.preprocess, thresholdEnabled: checked },
                }))
              }
            />
            {config.preprocess.thresholdEnabled && (
              <SliderNumericRow
                label="Threshold Cutoff"
                value={config.preprocess.thresholdValue}
                min={1}
                max={254}
                step={1}
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      preprocess: { ...prev.preprocess, thresholdValue: val },
                    }),
                    dragging
                  )
                }
              />
            )}
          </div>

          {/* Manual Color-Key Background Removal */}
          <div className="pt-2 border-t border-[#262932] space-y-2">
            <ToggleSwitchRow
              label="Manual Color-Key Background Removal"
              description="Isolate subject by color tolerance & feathering"
              checked={config.preprocess.removeBgEnabled}
              onChange={(checked) =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  preprocess: { ...prev.preprocess, removeBgEnabled: checked },
                }))
              }
            />
            {config.preprocess.removeBgEnabled && (
              <div className="p-2 rounded bg-[#0D0E11] border border-[#262932] space-y-2">
                <ColorPickerHexRgb
                  label="Key Background Color"
                  hexValue={config.preprocess.bgTargetColor}
                  onChange={(hex) =>
                    onUpdateConfig((prev) => ({
                      ...prev,
                      preprocess: { ...prev.preprocess, bgTargetColor: hex },
                    }))
                  }
                />
                <SliderNumericRow
                  label="Color Tolerance"
                  value={config.preprocess.bgTolerance}
                  min={1}
                  max={90}
                  step={1}
                  unit="%"
                  onChange={(val, dragging) =>
                    onUpdateConfig(
                      (prev) => ({
                        ...prev,
                        preprocess: { ...prev.preprocess, bgTolerance: val },
                      }),
                      dragging
                    )
                  }
                />
                <SliderNumericRow
                  label="Edge Feathering"
                  value={config.preprocess.bgFeather}
                  min={0}
                  max={50}
                  step={1}
                  unit="%"
                  onChange={(val, dragging) =>
                    onUpdateConfig(
                      (prev) => ({
                        ...prev,
                        preprocess: { ...prev.preprocess, bgFeather: val },
                      }),
                      dragging
                    )
                  }
                />
              </div>
            )}
          </div>
        </AccordionSection>

        {/* 3. PARTICLE GENERATION MODES */}
        <AccordionSection
          title="3. Generation Mode"
          icon={<Sparkles className="w-3.5 h-3.5" />}
          badge={config.mode}
          defaultOpen={true}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                {
                  id: 'image-based',
                  title: 'Image-Based',
                  desc: 'Luminance & detail weighted',
                  icon: <Sparkles className="w-3.5 h-3.5" />,
                },
                {
                  id: 'uniform-grid',
                  title: 'Uniform Grid',
                  desc: 'Clean halftone matrix',
                  icon: <Grid className="w-3.5 h-3.5" />,
                },
                {
                  id: 'random',
                  title: 'Random Dust',
                  desc: 'Seeded organic scatter',
                  icon: <Shuffle className="w-3.5 h-3.5" />,
                },
                {
                  id: 'edge-based',
                  title: 'Edge Contours',
                  desc: 'Boundary & Sobel outlines',
                  icon: <Compass className="w-3.5 h-3.5" />,
                },
              ] as Array<{
                id: GenerationMode;
                title: string;
                desc: string;
                icon: React.ReactNode;
              }>
            ).map((item) => {
              const active = config.mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onUpdateConfig((prev) => ({
                      ...prev,
                      mode: item.id,
                    }))
                  }
                  className={`p-2 rounded border text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F3F4F6] shadow-sm'
                      : 'bg-[#0D0E11] border-[#262932] text-[#9CA3AF] hover:border-[#374151] hover:text-[#E5E7EB]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={active ? 'text-[#F59E0B]' : 'text-[#6B7280]'}>
                      {item.icon}
                    </span>
                    <span className="text-[11px] font-semibold">{item.title}</span>
                  </div>
                  <div className="text-[10px] text-[#6B7280] mt-0.5 leading-tight">
                    {item.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </AccordionSection>

        {/* 4. PARTICLE SIZE CONTROLS */}
        <AccordionSection
          title="4. Particle Size"
          icon={<Maximize2 className="w-3.5 h-3.5" />}
          badge={`${config.size.minSize}–${config.size.maxSize}px`}
          defaultOpen={true}
          onResetSection={() =>
            onUpdateConfig((prev) => ({
              ...prev,
              size: { ...DEFAULT_STUDIO_CONFIG.size },
            }))
          }
        >
          {/* Size Mode Selector */}
          <div className="grid grid-cols-3 gap-1 bg-[#0D0E11] p-1 rounded border border-[#262932]">
            {(
              [
                { id: 'image-dependent', label: 'Image-Mapped' },
                { id: 'manual', label: 'Manual' },
                { id: 'random', label: 'Random' },
              ] as Array<{ id: ParticleSizeMode; label: string }>
            ).map((sm) => (
              <button
                key={sm.id}
                type="button"
                onClick={() =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    size: { ...prev.size, mode: sm.id },
                  }))
                }
                className={`py-1 text-[10px] font-medium rounded transition-colors ${
                  config.size.mode === sm.id
                    ? 'bg-[#F59E0B] text-[#0D0E11] font-semibold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {sm.label}
              </button>
            ))}
          </div>

          <SliderNumericRow
            label="Minimum Particle Size"
            value={config.size.minSize}
            min={0.3}
            max={40}
            step={0.1}
            unit="px"
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  size: {
                    ...prev.size,
                    minSize: val,
                    maxSize: Math.max(val, prev.size.maxSize),
                  },
                }),
                dragging
              )
            }
          />
          <SliderNumericRow
            label="Maximum Particle Size"
            value={config.size.maxSize}
            min={0.5}
            max={80}
            step={0.1}
            unit="px"
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  size: {
                    ...prev.size,
                    maxSize: val,
                    minSize: Math.min(val, prev.size.minSize),
                  },
                }),
                dragging
              )
            }
          />
          <SliderNumericRow
            label="Default / Base Size"
            value={config.size.defaultSize}
            min={0.5}
            max={50}
            step={0.1}
            unit="px"
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  size: { ...prev.size, defaultSize: val },
                }),
                dragging
              )
            }
          />

          {config.size.mode === 'manual' && (
            <>
              <ToggleSwitchRow
                label="Uniform Particle Size"
                description="Lock all particles to Default Size"
                checked={config.size.uniformSize}
                onChange={(checked) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    size: { ...prev.size, uniformSize: checked },
                  }))
                }
              />
              {!config.size.uniformSize && (
                <SliderNumericRow
                  label="Independent Size Variation"
                  value={config.size.sizeVariation}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(val, dragging) =>
                    onUpdateConfig(
                      (prev) => ({
                        ...prev,
                        size: { ...prev.size, sizeVariation: val },
                      }),
                      dragging
                    )
                  }
                />
              )}
            </>
          )}

          {config.size.mode === 'random' && (
            <>
              <SliderNumericRow
                label="Size Variation Intensity"
                value={config.size.sizeVariation}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      size: { ...prev.size, sizeVariation: val },
                    }),
                    dragging
                  )
                }
              />
              <SliderNumericRow
                label="Size Random Seed"
                value={config.size.sizeSeed}
                min={1}
                max={999999}
                step={1}
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      size: { ...prev.size, sizeSeed: Math.round(val) },
                    }),
                    dragging
                  )
                }
              />
            </>
          )}

          {config.size.mode === 'image-dependent' && (
            <>
              <SliderNumericRow
                label="Brightness Mapping Strength"
                value={config.size.mappingStrength}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      size: { ...prev.size, mappingStrength: val },
                    }),
                    dragging
                  )
                }
              />
              <ToggleSwitchRow
                label="Invert Size Mapping"
                description="Dark regions produce larger particles"
                checked={config.size.invertMapping}
                onChange={(checked) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    size: { ...prev.size, invertMapping: checked },
                  }))
                }
              />
              <SliderNumericRow
                label="Size Randomness"
                value={config.size.sizeRandomness}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      size: { ...prev.size, sizeRandomness: val },
                    }),
                    dragging
                  )
                }
              />
              <SliderNumericRow
                label="Spatial Size Smoothing"
                value={config.size.sizeSmoothing}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      size: { ...prev.size, sizeSmoothing: val },
                    }),
                    dragging
                  )
                }
              />
            </>
          )}

          {/* Size Distribution Curve */}
          <div className="pt-1 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-[#9CA3AF]">Size Distribution</span>
            <select
              value={config.size.distributionCurve}
              onChange={(e) =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  size: {
                    ...prev.size,
                    distributionCurve: e.target.value as ParticleDistributionCurve,
                  },
                }))
              }
              className="px-2 py-1 text-[11px] bg-[#0D0E11] border border-[#262932] rounded text-[#E5E7EB] focus:border-[#F59E0B] focus:outline-none"
            >
              <option value="ease-out">Ease-Out (Balanced)</option>
              <option value="linear">Linear</option>
              <option value="ease-in">Ease-In (Fine Dust)</option>
              <option value="bell">Bell Curve</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => onRandomizeTarget('size')}
            className="w-full mt-1 py-1 px-2 text-[10px] font-medium bg-[#22252E] hover:bg-[#2C303C] text-[#E5E7EB] rounded border border-[#323644] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Shuffle className="w-3 h-3 text-[#F59E0B]" />
            <span>Randomize Only Particle Size</span>
          </button>
        </AccordionSection>

        {/* 5. PARTICLE DENSITY & DISTRIBUTION */}
        <AccordionSection
          title="5. Density & Distribution"
          icon={<Grid className="w-3.5 h-3.5" />}
          badge={`${(config.distribution.targetCount / 1000).toFixed(1)}k`}
          defaultOpen={true}
          onResetSection={() =>
            onUpdateConfig((prev) => ({
              ...prev,
              distribution: { ...DEFAULT_STUDIO_CONFIG.distribution },
            }))
          }
        >
          {/* Quick Particle Count Preset Buttons */}
          <div>
            <div className="text-[10px] font-medium text-[#9CA3AF] mb-1">
              Quick Target Count Presets
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[1000, 5000, 10000, 25000, 50000].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() =>
                    onUpdateConfig((prev) => ({
                      ...prev,
                      distribution: {
                        ...prev.distribution,
                        targetCount: cnt,
                        maxSafetyLimit: Math.max(prev.distribution.maxSafetyLimit, cnt),
                      },
                    }))
                  }
                  className={`py-1 text-[10px] font-mono rounded border transition-colors ${
                    Math.abs(config.distribution.targetCount - cnt) < 250
                      ? 'bg-[#F59E0B] text-[#0D0E11] border-[#FBBF24] font-semibold'
                      : 'bg-[#0D0E11] text-[#9CA3AF] border-[#262932] hover:text-white'
                  }`}
                >
                  {cnt >= 1000 ? `${cnt / 1000}K` : cnt}
                </button>
              ))}
            </div>
          </div>

          <SliderNumericRow
            label="Target Particle Count"
            value={config.distribution.targetCount}
            min={100}
            max={config.distribution.maxSafetyLimit}
            step={100}
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  distribution: { ...prev.distribution, targetCount: Math.round(val) },
                }),
                dragging
              )
            }
          />

          <SliderNumericRow
            label="Particle Density"
            value={config.distribution.density}
            min={5}
            max={100}
            step={1}
            unit="%"
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  distribution: { ...prev.distribution, density: val },
                }),
                dragging
              )
            }
          />

          <div className="grid grid-cols-2 gap-2">
            <SliderNumericRow
              label="Min Spacing"
              value={config.distribution.minSpacing}
              min={0}
              max={30}
              step={0.5}
              unit="px"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    distribution: { ...prev.distribution, minSpacing: val },
                  }),
                  dragging
                )
              }
            />
            <SliderNumericRow
              label="Max Spacing"
              value={config.distribution.maxSpacing}
              min={2}
              max={100}
              step={1}
              unit="px"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    distribution: { ...prev.distribution, maxSpacing: val },
                  }),
                  dragging
                )
              }
            />
          </div>

          {config.mode === 'uniform-grid' && (
            <div className="p-2 rounded bg-[#0D0E11] border border-[#262932] space-y-2">
              <SliderNumericRow
                label="Grid Spacing"
                value={config.distribution.spacing}
                min={2}
                max={40}
                step={0.5}
                unit="px"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      distribution: { ...prev.distribution, spacing: val },
                    }),
                    dragging
                  )
                }
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#9CA3AF]">Grid Pattern</span>
                <div className="flex gap-1">
                  {(['hex', 'square'] as const).map((ga) => (
                    <button
                      key={ga}
                      type="button"
                      onClick={() =>
                        onUpdateConfig((prev) => ({
                          ...prev,
                          distribution: { ...prev.distribution, gridAlign: ga },
                        }))
                      }
                      className={`px-2 py-0.5 text-[10px] uppercase rounded border ${
                        config.distribution.gridAlign === ga
                          ? 'bg-[#F59E0B] text-[#0D0E11] border-[#FBBF24] font-semibold'
                          : 'bg-[#16181D] text-[#9CA3AF] border-[#262932]'
                      }`}
                    >
                      {ga}
                    </button>
                  ))}
                </div>
              </div>
              <SliderNumericRow
                label="Grid Offset X"
                value={config.distribution.gridOffsetX}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      distribution: { ...prev.distribution, gridOffsetX: val },
                    }),
                    dragging
                  )
                }
              />
            </div>
          )}

          <SliderNumericRow
            label="Distribution Randomness"
            value={config.distribution.randomness}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  distribution: { ...prev.distribution, randomness: val },
                }),
                dragging
              )
            }
          />

          <div className="grid grid-cols-2 gap-2">
            <SliderNumericRow
              label="Scatter Amount"
              value={config.distribution.scatterAmount}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    distribution: { ...prev.distribution, scatterAmount: val },
                  }),
                  dragging
                )
              }
            />
            <SliderNumericRow
              label="Scatter Radius"
              value={config.distribution.scatterRadius}
              min={2}
              max={150}
              step={1}
              unit="px"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    distribution: { ...prev.distribution, scatterRadius: val },
                  }),
                  dragging
                )
              }
            />
          </div>

          <SliderNumericRow
            label="Subject Preservation"
            value={config.distribution.subjectPreservation}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  distribution: { ...prev.distribution, subjectPreservation: val },
                }),
                dragging
              )
            }
          />

          <SliderNumericRow
            label="Brightness Density Mapping"
            tooltip="Positive values place more particles in bright areas; negative values favor dark areas"
            value={config.distribution.brightnessWeight}
            min={-100}
            max={100}
            step={1}
            unit="%"
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  distribution: { ...prev.distribution, brightnessWeight: val },
                }),
                dragging
              )
            }
          />

          <div className="grid grid-cols-2 gap-2">
            <SliderNumericRow
              label="Edge Sensitivity"
              value={config.distribution.edgeSensitivity}
              min={5}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    distribution: { ...prev.distribution, edgeSensitivity: val },
                  }),
                  dragging
                )
              }
            />
            <SliderNumericRow
              label="Edge Density"
              value={config.distribution.edgeDensity}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    distribution: { ...prev.distribution, edgeDensity: val },
                  }),
                  dragging
                )
              }
            />
          </div>

          {config.mode === 'edge-based' && (
            <div className="space-y-1.5 pt-1 border-t border-[#262932]">
              <ToggleSwitchRow
                label="Edge-Only Generation"
                checked={config.distribution.edgeOnly}
                onChange={(checked) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    distribution: { ...prev.distribution, edgeOnly: checked },
                  }))
                }
              />
              {!config.distribution.edgeOnly && (
                <ToggleSwitchRow
                  label="Combine Edge + Interior Particles"
                  checked={config.distribution.combineEdgeInterior}
                  onChange={(checked) =>
                    onUpdateConfig((prev) => ({
                      ...prev,
                      distribution: { ...prev.distribution, combineEdgeInterior: checked },
                    }))
                  }
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <SliderNumericRow
              label="Background Density"
              value={config.distribution.backgroundDensity}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    distribution: { ...prev.distribution, backgroundDensity: val },
                  }),
                  dragging
                )
              }
            />
            <SliderNumericRow
              label="Density Variation"
              value={config.distribution.densityVariation}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    distribution: { ...prev.distribution, densityVariation: val },
                  }),
                  dragging
                )
              }
            />
          </div>

          <ToggleSwitchRow
            label="Allow Outside-Artboard Scattering"
            checked={config.distribution.allowOutsideArtboard}
            onChange={(checked) =>
              onUpdateConfig((prev) => ({
                ...prev,
                distribution: { ...prev.distribution, allowOutsideArtboard: checked },
              }))
            }
          />

          {/* Safety Limit & Deterministic Seed */}
          <div className="pt-2 border-t border-[#262932] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-[#9CA3AF]">Safety Limit</span>
              <input
                type="number"
                min={1000}
                max={75000}
                step={1000}
                value={config.distribution.maxSafetyLimit}
                onChange={(e) => {
                  const v = Math.max(1000, Math.min(75000, parseInt(e.target.value, 10) || 50000));
                  onUpdateConfig((prev) => ({
                    ...prev,
                    distribution: { ...prev.distribution, maxSafetyLimit: v },
                  }));
                }}
                className="w-20 px-1.5 py-0.5 text-right text-[11px] font-mono bg-[#0D0E11] border border-[#262932] rounded text-[#F3F4F6]"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-[#9CA3AF]">Random Seed</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={config.distribution.seed}
                  onChange={(e) => {
                    const s = parseInt(e.target.value, 10) || 1;
                    onUpdateConfig((prev) => ({
                      ...prev,
                      distribution: { ...prev.distribution, seed: s },
                    }));
                  }}
                  className="w-20 px-1.5 py-0.5 text-right text-[11px] font-mono bg-[#0D0E11] border border-[#262932] rounded text-[#F3F4F6]"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig((prev) => ({
                      ...prev,
                      distribution: {
                        ...prev.distribution,
                        seed: Math.floor(1000 + Math.random() * 999000),
                      },
                    }))
                  }
                  title="Regenerate with new Random Seed"
                  className="px-2 py-0.5 text-[10px] font-medium bg-[#22252E] hover:bg-[#2C303C] text-[#FBBF24] rounded border border-[#323644] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Seed</span>
                </button>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* 6. PARTICLE SHAPE OPTIONS */}
        <AccordionSection
          title="6. Particle Shape"
          icon={<Shapes className="w-3.5 h-3.5" />}
          badge={config.shape.shape}
          defaultOpen={false}
          onResetSection={() =>
            onUpdateConfig((prev) => ({
              ...prev,
              shape: { ...DEFAULT_STUDIO_CONFIG.shape },
            }))
          }
        >
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'circle', label: 'Circle' },
                { id: 'square', label: 'Square' },
                { id: 'diamond', label: 'Diamond' },
                { id: 'star', label: 'Star' },
                { id: 'hexagon', label: 'Hexagon' },
                { id: 'organic', label: 'Organic' },
              ] as Array<{ id: ParticleShape; label: string }>
            ).map((sh) => {
              const active = config.shape.shape === sh.id;
              return (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() =>
                    onUpdateConfig((prev) => ({
                      ...prev,
                      shape: { ...prev.shape, shape: sh.id },
                    }))
                  }
                  className={`py-2 px-2 rounded border flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#FBBF24] font-semibold'
                      : 'bg-[#0D0E11] border-[#262932] text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  <ShapeIconPreview shape={sh.id} active={active} />
                  <span className="text-[10px]">{sh.label}</span>
                </button>
              );
            })}
          </div>

          {config.shape.shape !== 'circle' && (
            <div className="space-y-2 pt-2">
              <SliderNumericRow
                label="Base Rotation"
                value={config.shape.rotation}
                min={-180}
                max={180}
                step={1}
                unit="°"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      shape: { ...prev.shape, rotation: val },
                    }),
                    dragging
                  )
                }
              />
              <SliderNumericRow
                label="Rotation Randomness"
                value={config.shape.rotationRandomness}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      shape: { ...prev.shape, rotationRandomness: val },
                    }),
                    dragging
                  )
                }
              />
              {(config.shape.shape === 'diamond' || config.shape.shape === 'square') && (
                <SliderNumericRow
                  label="Corner Sharpness / Aspect"
                  value={config.shape.cornerSharpness}
                  min={10}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(val, dragging) =>
                    onUpdateConfig(
                      (prev) => ({
                        ...prev,
                        shape: { ...prev.shape, cornerSharpness: val },
                      }),
                      dragging
                    )
                  }
                />
              )}
              {config.shape.shape === 'star' && (
                <>
                  <SliderNumericRow
                    label="Star Points"
                    value={config.shape.starPoints}
                    min={4}
                    max={8}
                    step={1}
                    onChange={(val, dragging) =>
                      onUpdateConfig(
                        (prev) => ({
                          ...prev,
                          shape: { ...prev.shape, starPoints: Math.round(val) },
                        }),
                        dragging
                      )
                    }
                  />
                  <SliderNumericRow
                    label="Star Inner Radius Ratio"
                    value={config.shape.innerRadiusRatio}
                    min={0.2}
                    max={0.8}
                    step={0.05}
                    onChange={(val, dragging) =>
                      onUpdateConfig(
                        (prev) => ({
                          ...prev,
                          shape: { ...prev.shape, innerRadiusRatio: val },
                        }),
                        dragging
                      )
                    }
                  />
                </>
              )}
              {config.shape.shape === 'organic' && (
                <SliderNumericRow
                  label="Organic Shape Irregularity"
                  value={config.shape.shapeVariation}
                  min={5}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(val, dragging) =>
                    onUpdateConfig(
                      (prev) => ({
                        ...prev,
                        shape: { ...prev.shape, shapeVariation: val },
                      }),
                      dragging
                    )
                  }
                />
              )}
            </div>
          )}
        </AccordionSection>

        {/* 7. ADVANCED COLOR SYSTEM */}
        <AccordionSection
          title="7. Color System"
          icon={<Palette className="w-3.5 h-3.5" />}
          badge={config.color.mode}
          defaultOpen={true}
          onResetSection={() =>
            onUpdateConfig((prev) => ({
              ...prev,
              color: { ...DEFAULT_STUDIO_CONFIG.color },
            }))
          }
        >
          {/* Color Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[#0D0E11] p-1 rounded border border-[#262932]">
            {(
              [
                { id: 'brightness', label: 'Brightness' },
                { id: 'single', label: 'Single' },
                { id: 'original', label: 'Original Img' },
                { id: 'gradient', label: 'Gradient' },
                { id: 'random-variation', label: 'Random Var' },
              ] as Array<{ id: ColorMode; label: string }>
            ).map((cm) => (
              <button
                key={cm.id}
                type="button"
                onClick={() =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    color: { ...prev.color, mode: cm.id },
                  }))
                }
                className={`py-1 text-[10px] font-medium rounded transition-colors ${
                  config.color.mode === cm.id
                    ? 'bg-[#F59E0B] text-[#0D0E11] font-semibold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {cm.label}
              </button>
            ))}
          </div>

          {/* Curated Palette Swatches */}
          <div>
            <div className="text-[10px] font-medium text-[#9CA3AF] mb-1">
              Studio Color Palettes
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(Object.keys(COLOR_PALETTES) as ColorPalettePresetId[])
                .filter((k) => k !== 'custom')
                .map((pid) => {
                  const p = COLOR_PALETTES[pid];
                  const active = config.color.paletteId === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => handlePaletteSelect(pid)}
                      className={`px-1.5 py-1 rounded border text-left flex items-center gap-1.5 transition-colors ${
                        active
                          ? 'bg-[#22252E] border-[#F59E0B] text-[#F3F4F6]'
                          : 'bg-[#0D0E11] border-[#262932] text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                        style={{ backgroundColor: p.single }}
                      />
                      <span className="text-[10px] truncate">{p.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Mode-Specific Controls */}
          {config.color.mode === 'single' && (
            <div className="pt-1 space-y-2">
              <ColorPickerHexRgb
                label="Particle Color (HEX & RGB)"
                hexValue={config.color.singleColor}
                showRgbInputs={true}
                onChange={(hex) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    color: { ...prev.color, singleColor: hex, paletteId: 'custom' },
                  }))
                }
              />
            </div>
          )}

          {config.color.mode === 'original' && (
            <div className="pt-1 space-y-2">
              <SliderNumericRow
                label="Color Preservation Strength"
                value={config.color.colorPreservation}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      color: { ...prev.color, colorPreservation: val },
                    }),
                    dragging
                  )
                }
              />
              <SliderNumericRow
                label="Saturation Boost"
                value={config.color.colorSaturation}
                min={-100}
                max={100}
                step={1}
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      color: { ...prev.color, colorSaturation: val },
                    }),
                    dragging
                  )
                }
              />
              <SliderNumericRow
                label="Brightness Adjustment"
                value={config.color.colorBrightness}
                min={-100}
                max={100}
                step={1}
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      color: { ...prev.color, colorBrightness: val },
                    }),
                    dragging
                  )
                }
              />
              <SliderNumericRow
                label="Color Variation"
                value={config.color.colorVariation}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      color: { ...prev.color, colorVariation: val },
                    }),
                    dragging
                  )
                }
              />
            </div>
          )}

          {config.color.mode === 'brightness' && (
            <div className="pt-1 space-y-2">
              <ColorPickerHexRgb
                label="Bright Region Highlights"
                hexValue={config.color.brightColor}
                onChange={(hex) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    color: { ...prev.color, brightColor: hex, paletteId: 'custom' },
                  }))
                }
              />
              <ColorPickerHexRgb
                label="Midtone Particles"
                hexValue={config.color.midColor}
                onChange={(hex) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    color: { ...prev.color, midColor: hex, paletteId: 'custom' },
                  }))
                }
              />
              <ColorPickerHexRgb
                label="Dark Shadow Particles"
                hexValue={config.color.darkColor}
                onChange={(hex) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    color: { ...prev.color, darkColor: hex, paletteId: 'custom' },
                  }))
                }
              />
            </div>
          )}

          {config.color.mode === 'gradient' && (
            <div className="pt-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#9CA3AF]">Gradient Type</span>
                <div className="flex gap-1">
                  {(['linear', 'radial'] as const).map((gt) => (
                    <button
                      key={gt}
                      type="button"
                      onClick={() =>
                        onUpdateConfig((prev) => ({
                          ...prev,
                          color: { ...prev.color, gradientType: gt },
                        }))
                      }
                      className={`px-2 py-0.5 text-[10px] uppercase rounded border ${
                        config.color.gradientType === gt
                          ? 'bg-[#F59E0B] text-[#0D0E11] border-[#FBBF24] font-semibold'
                          : 'bg-[#0D0E11] text-[#9CA3AF] border-[#262932]'
                      }`}
                    >
                      {gt}
                    </button>
                  ))}
                </div>
              </div>

              {config.color.gradientType === 'linear' ? (
                <SliderNumericRow
                  label="Gradient Angle"
                  value={config.color.gradientAngle}
                  min={0}
                  max={360}
                  step={1}
                  unit="°"
                  onChange={(val, dragging) =>
                    onUpdateConfig(
                      (prev) => ({
                        ...prev,
                        color: { ...prev.color, gradientAngle: val },
                      }),
                      dragging
                    )
                  }
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <SliderNumericRow
                    label="Center X"
                    value={config.color.gradientCenterX}
                    min={0}
                    max={100}
                    step={1}
                    unit="%"
                    onChange={(val, dragging) =>
                      onUpdateConfig(
                        (prev) => ({
                          ...prev,
                          color: { ...prev.color, gradientCenterX: val },
                        }),
                        dragging
                      )
                    }
                  />
                  <SliderNumericRow
                    label="Center Y"
                    value={config.color.gradientCenterY}
                    min={0}
                    max={100}
                    step={1}
                    unit="%"
                    onChange={(val, dragging) =>
                      onUpdateConfig(
                        (prev) => ({
                          ...prev,
                          color: { ...prev.color, gradientCenterY: val },
                        }),
                        dragging
                      )
                    }
                  />
                </div>
              )}

              <SliderNumericRow
                label="Gradient Intensity"
                value={config.color.gradientIntensity}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      color: { ...prev.color, gradientIntensity: val },
                    }),
                    dragging
                  )
                }
              />

              {/* Multi-Stop Gradient Stops Editor */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-[#9CA3AF]">
                    Gradient Color Stops ({config.color.gradientStops.length})
                  </span>
                  {config.color.gradientStops.length < 5 && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConfig((prev) => ({
                          ...prev,
                          color: {
                            ...prev.color,
                            gradientStops: [
                              ...prev.color.gradientStops,
                              { offset: 0.5, color: '#F59E0B' },
                            ].sort((a, b) => a.offset - b.offset),
                          },
                        }))
                      }
                      className="flex items-center gap-0.5 text-[10px] text-[#FBBF24] hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Add Stop
                    </button>
                  )}
                </div>
                {config.color.gradientStops.map((stop, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-[#0D0E11] p-1.5 rounded border border-[#262932]"
                  >
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => {
                        const newHex = e.target.value.toUpperCase();
                        onUpdateConfig((prev) => {
                          const nextStops = [...prev.color.gradientStops];
                          nextStops[idx] = { ...nextStops[idx], color: newHex };
                          return {
                            ...prev,
                            color: { ...prev.color, gradientStops: nextStops },
                          };
                        });
                      }}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(stop.offset * 100)}
                      onChange={(e) => {
                        const newOff = parseInt(e.target.value, 10) / 100;
                        onUpdateConfig(
                          (prev) => {
                            const nextStops = [...prev.color.gradientStops];
                            nextStops[idx] = { ...nextStops[idx], offset: newOff };
                            return {
                              ...prev,
                              color: { ...prev.color, gradientStops: nextStops },
                            };
                          },
                          true
                        );
                      }}
                      className="flex-1 studio-slider"
                    />
                    <span className="text-[10px] font-mono text-[#9CA3AF] w-8 text-right">
                      {Math.round(stop.offset * 100)}%
                    </span>
                    {config.color.gradientStops.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateConfig((prev) => ({
                            ...prev,
                            color: {
                              ...prev.color,
                              gradientStops: prev.color.gradientStops.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          }))
                        }
                        className="text-[#6B7280] hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {config.color.mode === 'random-variation' && (
            <div className="pt-1 space-y-2">
              <ColorPickerHexRgb
                label="Base Color"
                hexValue={config.color.baseColor}
                onChange={(hex) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    color: { ...prev.color, baseColor: hex },
                  }))
                }
              />
              <SliderNumericRow
                label="Variation Intensity"
                value={config.color.variationIntensity}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      color: { ...prev.color, variationIntensity: val },
                    }),
                    dragging
                  )
                }
              />
              <SliderNumericRow
                label="Hue Variation"
                value={config.color.hueVariation}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      color: { ...prev.color, hueVariation: val },
                    }),
                    dragging
                  )
                }
              />
              <SliderNumericRow
                label="Saturation Variation"
                value={config.color.saturationVariation}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      color: { ...prev.color, saturationVariation: val },
                    }),
                    dragging
                  )
                }
              />
              <SliderNumericRow
                label="Brightness Variation"
                value={config.color.brightnessVariation}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(val, dragging) =>
                  onUpdateConfig(
                    (prev) => ({
                      ...prev,
                      color: { ...prev.color, brightnessVariation: val },
                    }),
                    dragging
                  )
                }
              />
            </div>
          )}
        </AccordionSection>

        {/* 8. GLOW AND VISUAL EFFECTS */}
        <AccordionSection
          title="8. Glow & Visual Effects"
          icon={<Sun className="w-3.5 h-3.5" />}
          badge={`${config.effects.glowIntensity}%`}
          defaultOpen={false}
          onResetSection={() =>
            onUpdateConfig((prev) => ({
              ...prev,
              effects: { ...DEFAULT_STUDIO_CONFIG.effects },
            }))
          }
        >
          <button
            type="button"
            onClick={onApplyGoldenDustEffectPreset}
            className="w-full py-1.5 px-2.5 text-[11px] font-semibold bg-gradient-to-r from-[#F59E0B]/20 via-[#FBBF24]/25 to-[#B45309]/20 hover:from-[#F59E0B]/30 hover:to-[#B45309]/30 text-[#FDE68A] border border-[#F59E0B]/50 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>Apply Signature Golden Dust Glow</span>
          </button>

          <SliderNumericRow
            label="Glow Intensity"
            value={config.effects.glowIntensity}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  effects: { ...prev.effects, glowIntensity: val },
                }),
                dragging
              )
            }
          />
          <SliderNumericRow
            label="Glow Radius"
            value={config.effects.glowRadius}
            min={0}
            max={60}
            step={1}
            unit="px"
            onChange={(val, dragging) =>
              onUpdateConfig(
                (prev) => ({
                  ...prev,
                  effects: { ...prev.effects, glowRadius: val },
                }),
                dragging
              )
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <SliderNumericRow
              label="Outer Glow"
              value={config.effects.outerGlow}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    effects: { ...prev.effects, outerGlow: val },
                  }),
                  dragging
                )
              }
            />
            <SliderNumericRow
              label="Inner Glow"
              value={config.effects.innerGlow}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    effects: { ...prev.effects, innerGlow: val },
                  }),
                  dragging
                )
              }
            />
          </div>

          <ColorPickerHexRgb
            label="Atmosphere & Glow Tint"
            hexValue={config.effects.glowColor}
            onChange={(hex) =>
              onUpdateConfig((prev) => ({
                ...prev,
                effects: { ...prev.effects, glowColor: hex },
              }))
            }
          />

          <div className="grid grid-cols-2 gap-2">
            <SliderNumericRow
              label="Max Opacity"
              value={config.effects.particleOpacity}
              min={10}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    effects: { ...prev.effects, particleOpacity: val },
                  }),
                  dragging
                )
              }
            />
            <SliderNumericRow
              label="Min Opacity"
              value={config.effects.minOpacity}
              min={5}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    effects: { ...prev.effects, minOpacity: val },
                  }),
                  dragging
                )
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SliderNumericRow
              label="Bloom Effect"
              value={config.effects.bloomEffect}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    effects: { ...prev.effects, bloomEffect: val },
                  }),
                  dragging
                )
              }
            />
            <SliderNumericRow
              label="Highlight Core"
              value={config.effects.highlightIntensity}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    effects: { ...prev.effects, highlightIntensity: val },
                  }),
                  dragging
                )
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SliderNumericRow
              label="Light Intensity"
              value={config.effects.lightIntensity}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    effects: { ...prev.effects, lightIntensity: val },
                  }),
                  dragging
                )
              }
            />
            <SliderNumericRow
              label="Atmosphere"
              value={config.effects.backgroundAtmosphere}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    effects: { ...prev.effects, backgroundAtmosphere: val },
                  }),
                  dragging
                )
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SliderNumericRow
              label="Brightness Boost"
              value={config.effects.brightness}
              min={-50}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    effects: { ...prev.effects, brightness: val },
                  }),
                  dragging
                )
              }
            />
            <SliderNumericRow
              label="Canvas Blur (Raster)"
              value={config.effects.blurIntensity}
              min={0}
              max={15}
              step={0.5}
              unit="px"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    effects: { ...prev.effects, blurIntensity: val },
                  }),
                  dragging
                )
              }
            />
          </div>

          {/* Vector Compatibility Notice */}
          <div className="p-2 rounded bg-[#0D0E11] border border-[#262932] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-[#FBBF24]">
                Vector Export Glow Layer
              </span>
            </div>
            <select
              value={config.effects.vectorGlowMode}
              onChange={(e) =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  effects: {
                    ...prev.effects,
                    vectorGlowMode: e.target.value as 'none' | 'vector-halos' | 'svg-filter',
                  },
                }))
              }
              className="w-full px-2 py-1 text-[11px] bg-[#16181D] border border-[#323644] rounded text-[#E5E7EB]"
            >
              <option value="vector-halos">Separate Vector Halo Circles Layer (Editable)</option>
              <option value="svg-filter">SVG Gaussian Filter Glow</option>
              <option value="none">Clean Vector Particles Only (No Glow)</option>
            </select>
            <div className="flex items-start gap-1.5 text-[10px] text-[#9CA3AF] leading-relaxed">
              <Info className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
              <span>
                Core particle geometry is always exported as 100% independent vector paths. Canvas Blur is raster-only.
              </span>
            </div>
          </div>
        </AccordionSection>

        {/* 9. BACKGROUND SETTINGS */}
        <AccordionSection
          title="9. Background Settings"
          icon={<Layers className="w-3.5 h-3.5" />}
          badge={config.background.type}
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 gap-1">
            {(
              [
                { id: 'solid-black', label: 'Solid Black' },
                { id: 'transparent', label: 'Transparent' },
                { id: 'solid-white', label: 'Solid White' },
                { id: 'custom-solid', label: 'Custom Color' },
                { id: 'gradient', label: 'Gradient' },
                { id: 'original-image', label: 'Original Image' },
              ] as Array<{ id: BackgroundType; label: string }>
            ).map((bType) => (
              <button
                key={bType.id}
                type="button"
                onClick={() =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    background: { ...prev.background, type: bType.id },
                    export: {
                      ...prev.export,
                      includeBackground: bType.id !== 'transparent',
                    },
                  }))
                }
                className={`py-1.5 px-2 text-[10px] font-medium rounded border text-left transition-colors ${
                  config.background.type === bType.id
                    ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#FBBF24] font-semibold'
                    : 'bg-[#0D0E11] border-[#262932] text-[#9CA3AF] hover:text-white'
                }`}
              >
                {bType.label}
              </button>
            ))}
          </div>

          {config.background.type === 'custom-solid' && (
            <ColorPickerHexRgb
              label="Custom Background Color"
              hexValue={config.background.customColor}
              showRgbInputs={true}
              onChange={(hex) =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  background: { ...prev.background, customColor: hex },
                }))
              }
            />
          )}

          {config.background.type === 'gradient' && (
            <div className="space-y-2 pt-1">
              <ColorPickerHexRgb
                label="Gradient Start"
                hexValue={config.background.gradientStart}
                onChange={(hex) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    background: { ...prev.background, gradientStart: hex },
                  }))
                }
              />
              <ColorPickerHexRgb
                label="Gradient End"
                hexValue={config.background.gradientEnd}
                onChange={(hex) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    background: { ...prev.background, gradientEnd: hex },
                  }))
                }
              />
            </div>
          )}

          {config.background.type === 'original-image' && (
            <SliderNumericRow
              label="Original Image Backdrop Opacity"
              value={config.background.originalImageOpacity}
              min={5}
              max={100}
              step={1}
              unit="%"
              onChange={(val, dragging) =>
                onUpdateConfig(
                  (prev) => ({
                    ...prev,
                    background: { ...prev.background, originalImageOpacity: val },
                  }),
                  dragging
                )
              }
            />
          )}
        </AccordionSection>
      </div>
    </aside>
  );
};

const ShapeIconPreview: React.FC<{ shape: ParticleShape; active: boolean }> = ({
  shape,
  active,
}) => {
  const fill = active ? '#F59E0B' : '#9CA3AF';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      {shape === 'circle' && <circle cx="12" cy="12" r="7.5" fill={fill} />}
      {shape === 'square' && <rect x="5" y="5" width="14" height="14" fill={fill} />}
      {shape === 'diamond' && <polygon points="12,3 20,12 12,21 4,12" fill={fill} />}
      {shape === 'hexagon' && (
        <polygon points="12,3 19.8,7.5 19.8,16.5 12,21 4.2,16.5 4.2,7.5" fill={fill} />
      )}
      {shape === 'star' && (
        <polygon
          points="12,2.5 14.8,8.8 21.5,9.5 16.4,14 17.9,20.6 12,17.2 6.1,20.6 7.6,14 2.5,9.5 9.2,8.8"
          fill={fill}
        />
      )}
      {shape === 'organic' && (
        <path
          d="M12,4 C16.5,3.5 20.5,7 19.5,11.8 C18.8,16.2 16,20.5 11.2,19.8 C6.5,19.2 3.8,15.5 4.5,10.8 C5.2,6.2 8.2,4.5 12,4 Z"
          fill={fill}
        />
      )}
    </svg>
  );
};
