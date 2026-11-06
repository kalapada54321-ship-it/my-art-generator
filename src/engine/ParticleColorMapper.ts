import { ParticleColorSettings, VisualEffectsSettings } from '../types/studio';
import {
  hexToRgb,
  hslToRgb,
  lerpRgb,
  RGB,
  rgbToHsl,
  sampleGradientStops,
} from '../utils/colorUtils';

/**
 * Computes the RGB color for a single particle given its normalized position (u, v in 0..1),
 * source pixel RGB, source luminance (0..1), deterministic random values, and color settings.
 */
export function computeParticleColor(
  colorSettings: ParticleColorSettings,
  effectsSettings: VisualEffectsSettings,
  u: number,
  v: number,
  sourceRgb: RGB,
  luminance: number,
  rand1: number,
  rand2: number,
  rand3: number,
  isHighlightParticle = false
): RGB {
  let result: RGB = { r: 245, g: 158, b: 11 };

  switch (colorSettings.mode) {
    case 'single': {
      result = hexToRgb(colorSettings.singleColor);
      break;
    }

    case 'original': {
      const hsl = rgbToHsl(sourceRgb.r, sourceRgb.g, sourceRgb.b);
      const satDelta = colorSettings.colorSaturation || 0;
      const brightDelta = (colorSettings.colorBrightness || 0) * 0.5;
      const variation = (colorSettings.colorVariation || 0) / 100;

      const h = (hsl.h + (rand1 * 2 - 1) * variation * 35 + 360) % 360;
      const s = Math.max(0, Math.min(100, hsl.s + satDelta + (rand2 * 2 - 1) * variation * 25));
      const l = Math.max(2, Math.min(98, hsl.l + brightDelta + (rand3 * 2 - 1) * variation * 20));

      const adjustedOriginal = hslToRgb(h, s, l);
      const fallbackColor = hexToRgb(colorSettings.singleColor);
      const preserve = (colorSettings.colorPreservation ?? 100) / 100;
      result = lerpRgb(fallbackColor, adjustedOriginal, preserve);
      break;
    }

    case 'gradient': {
      let t = 0.5;
      if (colorSettings.gradientType === 'radial') {
        const cx = (colorSettings.gradientCenterX ?? 50) / 100;
        const cy = (colorSettings.gradientCenterY ?? 50) / 100;
        const dx = u - cx;
        const dy = v - cy;
        t = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 1.414);
      } else {
        const rad = ((colorSettings.gradientAngle || 0) * Math.PI) / 180;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);
        const proj = (u - 0.5) * cosA + (v - 0.5) * sinA;
        t = Math.max(0, Math.min(1, proj + 0.5));
      }

      // Modulate gradient slightly by luminance so subject tonal depth remains visible
      const intensity = (colorSettings.gradientIntensity ?? 90) / 100;
      const blendedT = Math.max(0, Math.min(1, t * intensity + (1 - luminance) * (1 - intensity)));
      result = sampleGradientStops(colorSettings.gradientStops, blendedT);
      break;
    }

    case 'brightness': {
      const dark = hexToRgb(colorSettings.darkColor);
      const mid = hexToRgb(colorSettings.midColor);
      const bright = hexToRgb(colorSettings.brightColor);

      // Subtle random micro-jitter for organic golden dust shimmer
      const jitterLuma = Math.max(0, Math.min(1, luminance + (rand1 - 0.5) * 0.08));
      if (jitterLuma < 0.5) {
        result = lerpRgb(dark, mid, jitterLuma * 2);
      } else {
        result = lerpRgb(mid, bright, (jitterLuma - 0.5) * 2);
      }
      break;
    }

    case 'random-variation': {
      const baseRgb = hexToRgb(colorSettings.baseColor);
      const baseHsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
      const masterIntensity = (colorSettings.variationIntensity ?? 50) / 100;

      const hSpan = (colorSettings.hueVariation / 100) * 180 * masterIntensity;
      const sSpan = (colorSettings.saturationVariation / 100) * 80 * masterIntensity;
      const lSpan = (colorSettings.brightnessVariation / 100) * 75 * masterIntensity;

      const h = (baseHsl.h + (rand1 * 2 - 1) * hSpan + 360) % 360;
      const s = Math.max(0, Math.min(100, baseHsl.s + (rand2 * 2 - 1) * sSpan));
      const l = Math.max(
        5,
        Math.min(
          98,
          baseHsl.l * (0.45 + luminance * 0.75) + (rand3 * 2 - 1) * lSpan
        )
      );
      result = hslToRgb(h, s, l);
      break;
    }
  }

  // Apply Visual Effects brightness & highlight boost
  const fxBright = (effectsSettings.brightness || 0) / 100;
  const highlightBoost = isHighlightParticle
    ? (effectsSettings.highlightIntensity || 0) / 100
    : 0;
  const totalBoost = fxBright * 0.4 + highlightBoost * 0.45;

  if (Math.abs(totalBoost) > 0.005) {
    if (totalBoost > 0) {
      result = lerpRgb(result, { r: 255, g: 252, b: 235 }, Math.min(0.85, totalBoost));
    } else {
      result = lerpRgb(result, { r: 0, g: 0, b: 0 }, Math.min(0.85, -totalBoost));
    }
  }

  return result;
}
