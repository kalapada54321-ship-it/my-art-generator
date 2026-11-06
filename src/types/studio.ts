export type GenerationMode = 'image-based' | 'uniform-grid' | 'random' | 'edge-based';

export type ParticleSizeMode = 'manual' | 'random' | 'image-dependent';

export type ParticleDistributionCurve = 'linear' | 'ease-in' | 'ease-out' | 'bell';

export type ParticleShape = 'circle' | 'square' | 'diamond' | 'star' | 'hexagon' | 'organic';

export type ColorMode =
  | 'single'
  | 'original'
  | 'gradient'
  | 'brightness'
  | 'random-variation';

export type ColorPalettePresetId =
  | 'golden'
  | 'warm-gold'
  | 'silver'
  | 'white'
  | 'blue'
  | 'cyan'
  | 'purple'
  | 'neon'
  | 'sunset'
  | 'monochrome'
  | 'custom';

export type BackgroundType =
  | 'transparent'
  | 'solid-black'
  | 'solid-white'
  | 'custom-solid'
  | 'gradient'
  | 'original-image';

export type ArtboardUnit = 'px' | 'in' | 'mm' | 'cm';

export type ArtboardPresetId =
  | 'square-3000'
  | 'portrait-3000x4000'
  | 'landscape-4000x3000'
  | '16:9'
  | '4:5'
  | '3:2'
  | '1:1'
  | 'a4'
  | 'a3'
  | 'us-letter'
  | 'custom';

export type VectorGroupingMode =
  | 'by-layer'
  | 'all-grouped'
  | 'by-color'
  | 'by-size'
  | 'by-type'
  | 'ungrouped';

export type ExportFormat = 'svg' | 'eps' | 'ai-workflow' | 'png' | 'jpg' | 'pdf';

export type PreviewViewMode =
  | 'particles'
  | 'original'
  | 'preprocessed'
  | 'split-compare'
  | 'side-by-side';

export type ProcessingQuality = 'preview' | 'final';

export type ParticleTypeTag = 0 | 1 | 2 | 3; // 0 = Main, 1 = Edge, 2 = Scattered, 3 = Highlight

export interface ImageTransformSettings {
  fitMode: 'contain' | 'cover' | 'stretch' | 'custom';
  scale: number; // 0.1 to 4.0
  offsetX: number; // -100 to 100 (% of artboard)
  offsetY: number; // -100 to 100 (% of artboard)
  rotation: number; // -180 to 180 degrees
  cropTop: number; // 0 to 45%
  cropBottom: number; // 0 to 45%
  cropLeft: number; // 0 to 45%
  cropRight: number; // 0 to 45%
  maintainAspectRatio: boolean;
}

export interface ImagePreprocessSettings {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  gamma: number; // 0.2 to 3.0
  grayscale: boolean;
  invert: boolean;
  thresholdEnabled: boolean;
  thresholdValue: number; // 0 to 255
  edgeEnhance: number; // 0 to 100
  blur: number; // 0 to 10
  sharpen: number; // 0 to 100
  // Manual background removal
  removeBgEnabled: boolean;
  bgTargetColor: string; // HEX
  bgTolerance: number; // 0 to 100
  bgFeather: number; // 0 to 50
}

export interface ParticleSizeSettings {
  mode: ParticleSizeMode;
  minSize: number; // 0.3 to 60 px
  maxSize: number; // 0.5 to 120 px
  defaultSize: number; // 0.5 to 60 px
  uniformSize: boolean;
  sizeVariation: number; // 0 to 100%
  invertMapping: boolean; // True = darker areas get larger particles; False = brighter areas get larger particles
  mappingStrength: number; // 0 to 100%
  distributionCurve: ParticleDistributionCurve;
  sizeRandomness: number; // 0 to 100%
  sizeSmoothing: number; // 0 to 100%
  sizeSeed: number;
}

export interface ParticleDistributionSettings {
  targetCount: number; // 100 to 60000
  maxSafetyLimit: number; // default 60000
  density: number; // 1 to 100%
  spacing: number; // 1 to 60 px
  minSpacing: number; // 0.5 to 50 px
  maxSpacing: number; // 2 to 120 px
  randomness: number; // 0 to 100%
  scatterAmount: number; // 0 to 100%
  scatterRadius: number; // 0 to 150 px
  allowOutsideArtboard: boolean;
  subjectPreservation: number; // 0 to 100%
  brightnessWeight: number; // -100 to 100 (negative favors darks, positive favors brights)
  edgeSensitivity: number; // 1 to 100%
  edgeDensity: number; // 0 to 100%
  combineEdgeInterior: boolean;
  edgeOnly: boolean;
  backgroundDensity: number; // 0 to 100%
  densityVariation: number; // 0 to 100%
  gridAlign: 'square' | 'hex';
  gridOffsetX: number; // 0 to 100%
  gridOffsetY: number; // 0 to 100%
  seed: number;
}

export interface ParticleShapeSettings {
  shape: ParticleShape;
  rotation: number; // -180 to 180 deg
  rotationRandomness: number; // 0 to 100%
  cornerSharpness: number; // 0 to 100% (used for square/diamond/star)
  shapeVariation: number; // 0 to 100% (used for organic/star)
  starPoints: number; // 4 to 8
  innerRadiusRatio: number; // 0.2 to 0.8
}

export interface GradientStop {
  offset: number; // 0 to 1
  color: string; // HEX
}

export interface ParticleColorSettings {
  mode: ColorMode;
  paletteId: ColorPalettePresetId;
  singleColor: string; // HEX
  // Original Image Colors
  colorPreservation: number; // 0 to 100%
  colorSaturation: number; // -100 to 100
  colorVariation: number; // 0 to 100%
  colorBrightness: number; // -100 to 100
  // Gradient Colors
  gradientType: 'linear' | 'radial';
  gradientStops: GradientStop[];
  gradientAngle: number; // 0 to 360
  gradientCenterX: number; // 0 to 100%
  gradientCenterY: number; // 0 to 100%
  gradientIntensity: number; // 0 to 100%
  // Brightness-Based Colors
  darkColor: string;
  midColor: string;
  brightColor: string;
  // Random Color Variation
  baseColor: string;
  variationIntensity: number; // 0 to 100%
  hueVariation: number; // 0 to 100%
  saturationVariation: number; // 0 to 100%
  brightnessVariation: number; // 0 to 100%
  colorSeed: number;
}

export interface VisualEffectsSettings {
  glowIntensity: number; // 0 to 100%
  glowRadius: number; // 0 to 60 px
  outerGlow: number; // 0 to 100%
  innerGlow: number; // 0 to 100%
  glowColor: string; // HEX
  particleOpacity: number; // 5 to 100%
  minOpacity: number; // 5 to 100%
  brightness: number; // -50 to 100%
  blurIntensity: number; // 0 to 20 px
  bloomEffect: number; // 0 to 100%
  lightIntensity: number; // 0 to 100%
  highlightIntensity: number; // 0 to 100%
  backgroundAtmosphere: number; // 0 to 100%
  vectorGlowMode: 'none' | 'vector-halos' | 'svg-filter';
}

export interface BackgroundSettings {
  type: BackgroundType;
  customColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  gradientType: 'linear' | 'radial';
  originalImageOpacity: number; // 0 to 100%
}

export interface ArtboardSettings {
  presetId: ArtboardPresetId;
  width: number; // Value in selected unit
  height: number; // Value in selected unit
  unit: ArtboardUnit;
  dpi: number; // 72, 150, 300, 600
  orientation: 'portrait' | 'landscape' | 'square';
  maintainAspectRatio: boolean;
  centerArtwork: boolean;
}

export interface ExportSettings {
  filename: string;
  format: ExportFormat;
  groupingMode: VectorGroupingMode;
  includeBackground: boolean;
  includeVectorGlow: boolean;
  jpgQuality: number; // 10 to 100
  exportDpi: number;
  generateIllustratorJsx: boolean;
}

export interface StudioConfig {
  mode: GenerationMode;
  transform: ImageTransformSettings;
  preprocess: ImagePreprocessSettings;
  size: ParticleSizeSettings;
  distribution: ParticleDistributionSettings;
  shape: ParticleShapeSettings;
  color: ParticleColorSettings;
  effects: VisualEffectsSettings;
  background: BackgroundSettings;
  artboard: ArtboardSettings;
  export: ExportSettings;
}

export interface ParticleItem {
  x: number; // Artboard pixel X
  y: number; // Artboard pixel Y
  radius: number; // Particle radius in artboard pixels
  rotation: number; // Degrees
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  opacity: number; // 0-1
  brightness: number; // 0-1 source luminance
  edgeStrength: number; // 0-1 source edge gradient
  type: ParticleTypeTag; // 0=main, 1=edge, 2=scatter, 3=highlight
  shapeSeed: number; // Deterministic per-particle float 0-1 for organic shape
}

export interface ParticleGenerationResult {
  particles: ParticleItem[];
  artboardWidthPx: number;
  artboardHeightPx: number;
  stats: {
    totalCount: number;
    mainCount: number;
    edgeCount: number;
    scatterCount: number;
    highlightCount: number;
    minRadius: number;
    maxRadius: number;
    avgRadius: number;
    generationTimeMs: number;
  };
}

export interface SourceImageMetadata {
  name: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  dataUrl: string;
  isSample?: boolean;
  sampleId?: string;
}

export interface AnalyzedImageBuffer {
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
  luminance: Float32Array;
  edgeMap: Float32Array;
  alphaMap: Float32Array;
}

export interface StudioPreset {
  id: string;
  name: string;
  category: 'Gold & Luxury' | 'Luminous & Neon' | 'Print & Halftone' | 'Artistic' | 'Custom';
  description: string;
  badgeColor: string;
  config: Partial<StudioConfig>;
  isCustom?: boolean;
}

export interface SavedProjectRecord {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
  config: StudioConfig;
  sourceImage: SourceImageMetadata | null;
  particleCount: number;
  thumbnailDataUrl?: string;
}

export const DEFAULT_STUDIO_CONFIG: StudioConfig = {
  mode: 'image-based',
  transform: {
    fitMode: 'contain',
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    cropTop: 0,
    cropBottom: 0,
    cropLeft: 0,
    cropRight: 0,
    maintainAspectRatio: true,
  },
  preprocess: {
    brightness: 8,
    contrast: 22,
    saturation: 10,
    gamma: 1.05,
    grayscale: false,
    invert: false,
    thresholdEnabled: false,
    thresholdValue: 128,
    edgeEnhance: 35,
    blur: 0,
    sharpen: 15,
    removeBgEnabled: false,
    bgTargetColor: '#000000',
    bgTolerance: 18,
    bgFeather: 10,
  },
  size: {
    mode: 'image-dependent',
    minSize: 1.2,
    maxSize: 9.5,
    defaultSize: 4.0,
    uniformSize: false,
    sizeVariation: 35,
    invertMapping: false,
    mappingStrength: 85,
    distributionCurve: 'ease-out',
    sizeRandomness: 28,
    sizeSmoothing: 25,
    sizeSeed: 1337,
  },
  distribution: {
    targetCount: 9500,
    maxSafetyLimit: 60000,
    density: 78,
    spacing: 7,
    minSpacing: 2.2,
    maxSpacing: 24,
    randomness: 55,
    scatterAmount: 24,
    scatterRadius: 42,
    allowOutsideArtboard: false,
    subjectPreservation: 88,
    brightnessWeight: 65,
    edgeSensitivity: 38,
    edgeDensity: 65,
    combineEdgeInterior: true,
    edgeOnly: false,
    backgroundDensity: 4,
    densityVariation: 40,
    gridAlign: 'hex',
    gridOffsetX: 0,
    gridOffsetY: 0,
    seed: 42069,
  },
  shape: {
    shape: 'circle',
    rotation: 0,
    rotationRandomness: 25,
    cornerSharpness: 80,
    shapeVariation: 35,
    starPoints: 5,
    innerRadiusRatio: 0.45,
  },
  color: {
    mode: 'brightness',
    paletteId: 'golden',
    singleColor: '#F59E0B',
    colorPreservation: 85,
    colorSaturation: 15,
    colorVariation: 15,
    colorBrightness: 10,
    gradientType: 'radial',
    gradientStops: [
      { offset: 0, color: '#FFFBEB' },
      { offset: 0.45, color: '#FBBF24' },
      { offset: 1, color: '#B45309' },
    ],
    gradientAngle: 135,
    gradientCenterX: 50,
    gradientCenterY: 45,
    gradientIntensity: 90,
    darkColor: '#78350F',
    midColor: '#F59E0B',
    brightColor: '#FEF3C7',
    baseColor: '#F59E0B',
    variationIntensity: 35,
    hueVariation: 12,
    saturationVariation: 25,
    brightnessVariation: 35,
    colorSeed: 777,
  },
  effects: {
    glowIntensity: 68,
    glowRadius: 16,
    outerGlow: 62,
    innerGlow: 45,
    glowColor: '#F59E0B',
    particleOpacity: 95,
    minOpacity: 22,
    brightness: 18,
    blurIntensity: 0,
    bloomEffect: 52,
    lightIntensity: 60,
    highlightIntensity: 75,
    backgroundAtmosphere: 42,
    vectorGlowMode: 'vector-halos',
  },
  background: {
    type: 'solid-black',
    customColor: '#07080C',
    gradientStart: '#1A1308',
    gradientEnd: '#050608',
    gradientAngle: 135,
    gradientType: 'radial',
    originalImageOpacity: 15,
  },
  artboard: {
    presetId: 'square-3000',
    width: 3000,
    height: 3000,
    unit: 'px',
    dpi: 300,
    orientation: 'square',
    maintainAspectRatio: true,
    centerArtwork: true,
  },
  export: {
    filename: 'particleforge-golden-artwork',
    format: 'svg',
    groupingMode: 'by-layer',
    includeBackground: true,
    includeVectorGlow: true,
    jpgQuality: 95,
    exportDpi: 300,
    generateIllustratorJsx: true,
  },
};
