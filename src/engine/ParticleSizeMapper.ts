import { ParticleDistributionCurve, ParticleSizeSettings } from '../types/studio';

function applyDistributionCurve(t: number, curve: ParticleDistributionCurve): number {
  const c = Math.max(0, Math.min(1, t));
  switch (curve) {
    case 'ease-in':
      return c * c;
    case 'ease-out':
      return 1 - (1 - c) * (1 - c);
    case 'bell':
      return Math.sin(c * Math.PI);
    case 'linear':
    default:
      return c;
  }
}

/**
 * Computes the radius (in artboard pixels) for an individual particle based on
 * the configured ParticleSizeSettings, local pixel luminance, local edge detail,
 * and deterministic random value in [0, 1).
 */
export function computeParticleRadius(
  settings: ParticleSizeSettings,
  luminance: number,
  localLuminanceAvg: number,
  edgeStrength: number,
  randVal: number,
  artboardScaleFactor = 1
): number {
  const safeMin = Math.max(0.2, Math.min(settings.minSize, settings.maxSize));
  const safeMax = Math.max(safeMin, Math.max(settings.minSize, settings.maxSize));
  const safeDefault = Math.max(safeMin, Math.min(safeMax, settings.defaultSize));

  // If uniform size is checked in manual mode, return defaultSize directly
  if (settings.mode === 'manual' && settings.uniformSize) {
    return safeDefault * artboardScaleFactor;
  }

  let radius = safeDefault;

  if (settings.mode === 'manual') {
    const variation = (settings.sizeVariation / 100) * (safeMax - safeMin) * 0.5;
    const jitter = (randVal * 2 - 1) * variation;
    radius = Math.max(safeMin, Math.min(safeMax, safeDefault + jitter));
  } else if (settings.mode === 'random') {
    const curvedRand = applyDistributionCurve(randVal, settings.distributionCurve);
    const intensity = settings.sizeVariation / 100;
    const randomTarget = safeMin + curvedRand * (safeMax - safeMin);
    radius = safeDefault * (1 - intensity) + randomTarget * intensity;
  } else {
    // image-dependent mode
    const smoothWeight = (settings.sizeSmoothing || 0) / 100;
    const effectiveLuma = luminance * (1 - smoothWeight) + localLuminanceAvg * smoothWeight;

    const tonalFactor = settings.invertMapping ? 1 - effectiveLuma : effectiveLuma;
    const curvedTonal = applyDistributionCurve(tonalFactor, settings.distributionCurve);

    // High-edge detailed regions slightly tighten particle sizes to preserve crisp contour fidelity
    const detailRefinement = 1 - edgeStrength * 0.25;
    const mappedFactor = Math.max(0, Math.min(1, curvedTonal * detailRefinement));

    const strength = (settings.mappingStrength ?? 85) / 100;
    const imageMappedSize = safeMin + mappedFactor * (safeMax - safeMin);
    radius = safeDefault * (1 - strength) + imageMappedSize * strength;

    // Apply optional size randomness
    if (settings.sizeRandomness > 0) {
      const randSpan = (settings.sizeRandomness / 100) * (safeMax - safeMin) * 0.35;
      radius += (randVal * 2 - 1) * randSpan;
    }
  }

  const clamped = Math.max(safeMin, Math.min(safeMax, radius));
  return Math.max(0.2, clamped * artboardScaleFactor);
}
