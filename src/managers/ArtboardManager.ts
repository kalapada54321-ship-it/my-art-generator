import { ArtboardPresetId, ArtboardSettings, ArtboardUnit } from '../types/studio';

export interface ArtboardPresetSpec {
  id: ArtboardPresetId;
  label: string;
  width: number;
  height: number;
  unit: ArtboardUnit;
  defaultDpi: number;
  aspectRatioLabel: string;
}

export const ARTBOARD_PRESETS: ArtboardPresetSpec[] = [
  {
    id: 'square-3000',
    label: 'Square Master (3000 × 3000 px)',
    width: 3000,
    height: 3000,
    unit: 'px',
    defaultDpi: 300,
    aspectRatioLabel: '1:1',
  },
  {
    id: 'portrait-3000x4000',
    label: 'Portrait Studio (3000 × 4000 px)',
    width: 3000,
    height: 4000,
    unit: 'px',
    defaultDpi: 300,
    aspectRatioLabel: '3:4',
  },
  {
    id: 'landscape-4000x3000',
    label: 'Landscape Studio (4000 × 3000 px)',
    width: 4000,
    height: 3000,
    unit: 'px',
    defaultDpi: 300,
    aspectRatioLabel: '4:3',
  },
  {
    id: '16:9',
    label: 'Widescreen 4K (3840 × 2160 px)',
    width: 3840,
    height: 2160,
    unit: 'px',
    defaultDpi: 300,
    aspectRatioLabel: '16:9',
  },
  {
    id: '4:5',
    label: 'Editorial Vertical (2400 × 3000 px)',
    width: 2400,
    height: 3000,
    unit: 'px',
    defaultDpi: 300,
    aspectRatioLabel: '4:5',
  },
  {
    id: '3:2',
    label: 'Classic Photo (3600 × 2400 px)',
    width: 3600,
    height: 2400,
    unit: 'px',
    defaultDpi: 300,
    aspectRatioLabel: '3:2',
  },
  {
    id: '1:1',
    label: 'Standard Square (2000 × 2000 px)',
    width: 2000,
    height: 2000,
    unit: 'px',
    defaultDpi: 300,
    aspectRatioLabel: '1:1',
  },
  {
    id: 'a4',
    label: 'ISO A4 (210 × 297 mm)',
    width: 210,
    height: 297,
    unit: 'mm',
    defaultDpi: 300,
    aspectRatioLabel: '1:√2',
  },
  {
    id: 'a3',
    label: 'ISO A3 (297 × 420 mm)',
    width: 297,
    height: 420,
    unit: 'mm',
    defaultDpi: 300,
    aspectRatioLabel: '1:√2',
  },
  {
    id: 'us-letter',
    label: 'US Letter (8.5 × 11 in)',
    width: 8.5,
    height: 11,
    unit: 'in',
    defaultDpi: 300,
    aspectRatioLabel: '8.5:11',
  },
  {
    id: 'custom',
    label: 'Custom Dimensions',
    width: 3000,
    height: 3000,
    unit: 'px',
    defaultDpi: 300,
    aspectRatioLabel: 'Custom',
  },
];

/**
 * Convert a value in the given unit to pixels at the specified DPI.
 */
export function unitToPixels(value: number, unit: ArtboardUnit, dpi: number): number {
  const safeDpi = Math.max(36, Math.min(1200, Number.isFinite(dpi) ? dpi : 300));
  const safeVal = Math.max(0.1, Number.isFinite(value) ? value : 100);

  switch (unit) {
    case 'px':
      return Math.round(safeVal);
    case 'in':
      return Math.round(safeVal * safeDpi);
    case 'mm':
      return Math.round((safeVal / 25.4) * safeDpi);
    case 'cm':
      return Math.round((safeVal / 2.54) * safeDpi);
    default:
      return Math.round(safeVal);
  }
}

/**
 * Convert pixels at a specified DPI into the target unit.
 */
export function pixelsToUnit(px: number, targetUnit: ArtboardUnit, dpi: number): number {
  const safeDpi = Math.max(36, Math.min(1200, Number.isFinite(dpi) ? dpi : 300));
  const safePx = Math.max(1, Number.isFinite(px) ? px : 1000);

  switch (targetUnit) {
    case 'px':
      return Math.round(safePx);
    case 'in':
      return Number((safePx / safeDpi).toFixed(2));
    case 'mm':
      return Number(((safePx / safeDpi) * 25.4).toFixed(1));
    case 'cm':
      return Number(((safePx / safeDpi) * 2.54).toFixed(2));
    default:
      return Math.round(safePx);
  }
}

/**
 * Convert between any two units preserving physical pixel size at the given DPI.
 */
export function convertArtboardUnit(
  value: number,
  fromUnit: ArtboardUnit,
  toUnit: ArtboardUnit,
  dpi: number
): number {
  if (fromUnit === toUnit) return value;
  const px = unitToPixels(value, fromUnit, dpi);
  return pixelsToUnit(px, toUnit, dpi);
}

/**
 * Resolve exact pixel dimensions for the artboard, clamped to safe limits (64px to 12000px).
 */
export function getArtboardPixelDimensions(artboard: ArtboardSettings): {
  widthPx: number;
  heightPx: number;
  aspectRatio: number;
} {
  const rawW = unitToPixels(artboard.width, artboard.unit, artboard.dpi);
  const rawH = unitToPixels(artboard.height, artboard.unit, artboard.dpi);
  const widthPx = Math.max(64, Math.min(12000, rawW));
  const heightPx = Math.max(64, Math.min(12000, rawH));
  return {
    widthPx,
    heightPx,
    aspectRatio: widthPx / heightPx,
  };
}

/**
 * Validate and sanitize artboard settings.
 */
export function sanitizeArtboardSettings(settings: ArtboardSettings): ArtboardSettings {
  const safeDpi = Math.max(36, Math.min(1200, Math.round(settings.dpi || 300)));
  const minVal = settings.unit === 'px' ? 64 : 0.5;
  const maxVal = settings.unit === 'px' ? 12000 : 2000;
  const width = Math.max(minVal, Math.min(maxVal, Number(settings.width) || minVal));
  const height = Math.max(minVal, Math.min(maxVal, Number(settings.height) || minVal));
  const orientation =
    Math.abs(width - height) < 0.001
      ? 'square'
      : width > height
      ? 'landscape'
      : 'portrait';

  return {
    ...settings,
    width,
    height,
    dpi: safeDpi,
    orientation,
  };
}
