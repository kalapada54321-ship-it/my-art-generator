import { ColorPalettePresetId, GradientStop } from '../types/studio';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface PaletteSpec {
  id: ColorPalettePresetId;
  name: string;
  dark: string;
  mid: string;
  bright: string;
  single: string;
  glow: string;
  stops: GradientStop[];
}

export const COLOR_PALETTES: Record<ColorPalettePresetId, PaletteSpec> = {
  golden: {
    id: 'golden',
    name: 'Golden Dust',
    dark: '#78350F',
    mid: '#F59E0B',
    bright: '#FEF3C7',
    single: '#F59E0B',
    glow: '#F59E0B',
    stops: [
      { offset: 0, color: '#FFFBEB' },
      { offset: 0.45, color: '#FBBF24' },
      { offset: 1, color: '#92400E' },
    ],
  },
  'warm-gold': {
    id: 'warm-gold',
    name: 'Warm Gold',
    dark: '#6B2111',
    mid: '#D97706',
    bright: '#FDE68A',
    single: '#EAB308',
    glow: '#D97706',
    stops: [
      { offset: 0, color: '#FEF08A' },
      { offset: 0.5, color: '#D97706' },
      { offset: 1, color: '#7C2D12' },
    ],
  },
  silver: {
    id: 'silver',
    name: 'Liquid Silver',
    dark: '#334155',
    mid: '#94A3B8',
    bright: '#F8FAFC',
    single: '#CBD5E1',
    glow: '#94A3B8',
    stops: [
      { offset: 0, color: '#FFFFFF' },
      { offset: 0.5, color: '#94A3B8' },
      { offset: 1, color: '#334155' },
    ],
  },
  white: {
    id: 'white',
    name: 'Pure White',
    dark: '#52525B',
    mid: '#D4D4D8',
    bright: '#FFFFFF',
    single: '#FFFFFF',
    glow: '#E4E4E7',
    stops: [
      { offset: 0, color: '#FFFFFF' },
      { offset: 1, color: '#71717A' },
    ],
  },
  blue: {
    id: 'blue',
    name: 'Sapphire Blue',
    dark: '#1E3A8A',
    mid: '#3B82F6',
    bright: '#DBEAFE',
    single: '#3B82F6',
    glow: '#2563EB',
    stops: [
      { offset: 0, color: '#EFF6FF' },
      { offset: 0.5, color: '#3B82F6' },
      { offset: 1, color: '#1E3A8A' },
    ],
  },
  cyan: {
    id: 'cyan',
    name: 'Bioluminescent Cyan',
    dark: '#164E63',
    mid: '#06B6D4',
    bright: '#CFFAFE',
    single: '#22D3EE',
    glow: '#06B6D4',
    stops: [
      { offset: 0, color: '#ECFEFF' },
      { offset: 0.5, color: '#06B6D4' },
      { offset: 1, color: '#155E75' },
    ],
  },
  purple: {
    id: 'purple',
    name: 'Nebula Purple',
    dark: '#3B0764',
    mid: '#A855F7',
    bright: '#F3E8FF',
    single: '#C084FC',
    glow: '#9333EA',
    stops: [
      { offset: 0, color: '#FAF5FF' },
      { offset: 0.5, color: '#A855F7' },
      { offset: 1, color: '#4C1D95' },
    ],
  },
  neon: {
    id: 'neon',
    name: 'Cyber Neon',
    dark: '#06B6D4',
    mid: '#EC4899',
    bright: '#FEF08A',
    single: '#F43F5E',
    glow: '#EC4899',
    stops: [
      { offset: 0, color: '#22D3EE' },
      { offset: 0.5, color: '#EC4899' },
      { offset: 1, color: '#FACC15' },
    ],
  },
  sunset: {
    id: 'sunset',
    name: 'Solar Sunset',
    dark: '#4C1D95',
    mid: '#EA580C',
    bright: '#FEF08A',
    single: '#F97316',
    glow: '#EA580C',
    stops: [
      { offset: 0, color: '#FEF08A' },
      { offset: 0.45, color: '#F97316' },
      { offset: 0.8, color: '#BE185D' },
      { offset: 1, color: '#311042' },
    ],
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome Ink',
    dark: '#18181B',
    mid: '#71717A',
    bright: '#FAFAFA',
    single: '#E4E4E7',
    glow: '#A1A1AA',
    stops: [
      { offset: 0, color: '#FAFAFA' },
      { offset: 1, color: '#27272A' },
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom Palette',
    dark: '#78350F',
    mid: '#F59E0B',
    bright: '#FEF3C7',
    single: '#F59E0B',
    glow: '#F59E0B',
    stops: [
      { offset: 0, color: '#FEF3C7' },
      { offset: 1, color: '#78350F' },
    ],
  },
};

/**
 * Deterministic Mulberry32 PRNG returning floats in [0, 1).
 */
export function createSeededRandom(seed: number): () => number {
  let state = (Math.floor(seed) || 1) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Validate and normalize any HEX string to #RRGGBB.
 */
export function sanitizeHex(hex: string, fallback = '#F59E0B'): string {
  if (!hex || typeof hex !== 'string') return fallback;
  const cleaned = hex.trim().replace(/^#/, '');
  if (/^[0-9A-Fa-f]{3}$/.test(cleaned)) {
    return (
      '#' +
      cleaned
        .split('')
        .map((c) => c + c)
        .join('')
        .toUpperCase()
    );
  }
  if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) {
    return '#' + cleaned.toUpperCase();
  }
  return fallback;
}

export function hexToRgb(hex: string): RGB {
  const valid = sanitizeHex(hex);
  const num = parseInt(valid.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  const hn = (((h % 360) + 360) % 360) / 360;
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;

  if (sn === 0) {
    const val = Math.round(ln * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;

  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

export function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * clamped),
    g: Math.round(a.g + (b.g - a.g) * clamped),
    b: Math.round(a.b + (b.b - a.b) * clamped),
  };
}

export function sampleGradientStops(stops: GradientStop[], t: number): RGB {
  if (!stops || stops.length === 0) {
    return { r: 245, g: 158, b: 11 };
  }
  const sorted = [...stops].sort((a, b) => a.offset - b.offset);
  const clamped = Math.max(0, Math.min(1, t));

  if (clamped <= sorted[0].offset) {
    return hexToRgb(sorted[0].color);
  }
  if (clamped >= sorted[sorted.length - 1].offset) {
    return hexToRgb(sorted[sorted.length - 1].color);
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const s0 = sorted[i];
    const s1 = sorted[i + 1];
    if (clamped >= s0.offset && clamped <= s1.offset) {
      const span = Math.max(0.0001, s1.offset - s0.offset);
      const localT = (clamped - s0.offset) / span;
      return lerpRgb(hexToRgb(s0.color), hexToRgb(s1.color), localT);
    }
  }

  return hexToRgb(sorted[0].color);
}
