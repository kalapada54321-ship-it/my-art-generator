import { getArtboardPixelDimensions } from '../managers/ArtboardManager';
import {
  AnalyzedImageBuffer,
  ParticleGenerationResult,
  ParticleItem,
  ParticleTypeTag,
  ProcessingQuality,
  StudioConfig,
} from '../types/studio';
import { createSeededRandom } from '../utils/colorUtils';
import { computeParticleColor } from './ParticleColorMapper';
import { computeParticleRadius } from './ParticleSizeMapper';

/**
 * Generates the complete array of editable vector particles from an AnalyzedImageBuffer
 * and StudioConfig. Fully deterministic for any given seed and configuration.
 */
export function generateParticlesFromBuffer(
  buffer: AnalyzedImageBuffer,
  config: StudioConfig,
  quality: ProcessingQuality = 'final'
): ParticleGenerationResult {
  const startTime = performance.now();
  const { widthPx: artW, heightPx: artH } = getArtboardPixelDimensions(config.artboard);

  const dist = config.distribution;
  const sizeSettings = config.size;
  const shapeSettings = config.shape;
  const colorSettings = config.color;
  const effects = config.effects;

  const safeLimit = Math.min(75000, Math.max(100, dist.maxSafetyLimit || 60000));
  const rawDesiredCount = Math.min(
    safeLimit,
    Math.max(50, Math.round(dist.targetCount * (dist.density / 75)))
  );

  const effectiveTargetCount =
    quality === 'preview' ? Math.min(rawDesiredCount, 7500) : rawDesiredCount;

  // Deterministic PRNG instances for position, size, and color
  const posRand = createSeededRandom(dist.seed || 42069);
  const sizeRand = createSeededRandom((sizeSettings.sizeSeed || 1337) + (dist.seed || 0));
  const colorRand = createSeededRandom((colorSettings.colorSeed || 777) + (dist.seed || 0));

  const bufW = buffer.width;
  const bufH = buffer.height;

  // Scale factor so particle radii scale proportionally with artboard resolution
  // Base reference resolution is 1200px
  const artboardScaleFactor = Math.max(0.35, Math.min(4.5, Math.min(artW, artH) / 1200));

  // Helper to sample image buffer at normalized coordinates (u, v in [0, 1])
  const sampleAt = (u: number, v: number) => {
    const cu = Math.max(0, Math.min(0.9999, u));
    const cv = Math.max(0, Math.min(0.9999, v));
    const bx = Math.floor(cu * bufW);
    const by = Math.floor(cv * bufH);
    const idx = by * bufW + bx;
    const pIdx = idx * 4;

    // 3x3 local luminance average for size smoothing
    let localSum = 0;
    let localCnt = 0;
    for (let dy = -1; dy <= 1; dy++) {
      const ny = by + dy;
      if (ny < 0 || ny >= bufH) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const nx = bx + dx;
        if (nx < 0 || nx >= bufW) continue;
        localSum += buffer.luminance[ny * bufW + nx];
        localCnt++;
      }
    }

    return {
      r: buffer.rgba[pIdx],
      g: buffer.rgba[pIdx + 1],
      b: buffer.rgba[pIdx + 2],
      alpha: buffer.alphaMap[idx],
      luminance: buffer.luminance[idx],
      localLuma: localCnt > 0 ? localSum / localCnt : buffer.luminance[idx],
      edge: buffer.edgeMap[idx],
    };
  };

  // Compute importance weight of a pixel at (u, v)
  const computePixelWeight = (luma: number, edge: number, alpha: number): number => {
    if (alpha <= 0.02) {
      return (dist.backgroundDensity / 100) * 0.08;
    }

    // Brightness preference: positive favors bright pixels, negative favors dark pixels
    const bWeight = dist.brightnessWeight / 100; // -1 to +1
    const tonalScore =
      bWeight >= 0
        ? luma * bWeight + 0.5 * (1 - bWeight)
        : (1 - luma) * -bWeight + 0.5 * (1 + bWeight);

    const edgeBoost = edge * (dist.edgeDensity / 100) * 1.45;
    const subjectScore = Math.max(0.01, tonalScore + edgeBoost);

    const bgFloor = (dist.backgroundDensity / 100) * 0.15;
    const preserve = dist.subjectPreservation / 100;

    // When subjectPreservation is high, suppress very low tonal areas strongly
    const thresholdCutoff = preserve * 0.14;
    if (subjectScore < thresholdCutoff) {
      return bgFloor * 0.25;
    }

    return Math.min(2.5, bgFloor + Math.pow(subjectScore, 0.7 + preserve * 0.9));
  };

  const candidates: Array<{
    u: number;
    v: number;
    type: ParticleTypeTag;
  }> = [];

  const mode = config.mode;

  if (mode === 'uniform-grid') {
    // MODE B: UNIFORM GRID PARTICLES
    // Calculate grid step from spacing & target count
    const baseStepPx = Math.max(
      2.5,
      (dist.spacing || 8) * artboardScaleFactor * (1.25 - (dist.density / 100) * 0.65)
    );
    const cols = Math.max(8, Math.min(320, Math.floor(artW / baseStepPx)));
    const rows = Math.max(8, Math.min(320, Math.floor(artH / baseStepPx)));

    const offU = ((dist.gridOffsetX || 0) / 100) * (1 / cols);
    const offV = ((dist.gridOffsetY || 0) / 100) * (1 / rows);
    const jitterAmt = (dist.randomness / 100) * 0.42;

    for (let r = 0; r < rows; r++) {
      const isHexOffset = dist.gridAlign === 'hex' && r % 2 === 1;
      for (let c = 0; c < cols; c++) {
        let u = (c + 0.5 + (isHexOffset ? 0.5 : 0)) / cols + offU;
        let v = (r + 0.5) / rows + offV;

        if (jitterAmt > 0) {
          u += ((posRand() - 0.5) * jitterAmt) / cols;
          v += ((posRand() - 0.5) * jitterAmt) / rows;
        }

        if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;

        const sample = sampleAt(u, v);
        const weight = computePixelWeight(sample.luminance, sample.edge, sample.alpha);

        // Visibility threshold based on subject preservation
        const minVis = (dist.subjectPreservation / 100) * 0.18;
        if (weight > minVis || posRand() < (dist.backgroundDensity / 100) * 0.15) {
          const type: ParticleTypeTag = sample.edge > 0.38 ? 1 : 0;
          candidates.push({ u, v, type });
        }
      }
    }
  } else if (mode === 'edge-based') {
    // MODE D: EDGE-BASED PARTICLES
    const sensitivity = Math.max(0.03, 0.58 - (dist.edgeSensitivity / 100) * 0.52);
    const edgePool: Array<{ u: number; v: number; edge: number }> = [];
    const interiorPool: Array<{ u: number; v: number; weight: number }> = [];

    const step = quality === 'preview' ? 2 : 1;
    for (let y = 1; y < bufH - 1; y += step) {
      for (let x = 1; x < bufW - 1; x += step) {
        const idx = y * bufW + x;
        const e = buffer.edgeMap[idx];
        const luma = buffer.luminance[idx];
        const alpha = buffer.alphaMap[idx];
        const u = (x + 0.5) / bufW;
        const v = (y + 0.5) / bufH;

        if (e >= sensitivity && alpha > 0.05) {
          edgePool.push({ u, v, edge: e });
        } else if (!dist.edgeOnly && dist.combineEdgeInterior && alpha > 0.05 && luma > 0.12) {
          const w = computePixelWeight(luma, e, alpha);
          if (w > 0.18) {
            interiorPool.push({ u, v, weight: w });
          }
        }
      }
    }

    const edgeRatio = dist.edgeOnly ? 1.0 : Math.max(0.35, Math.min(0.92, dist.edgeDensity / 100));
    const desiredEdges = Math.round(effectiveTargetCount * edgeRatio);
    const desiredInterior = effectiveTargetCount - desiredEdges;

    const jitterScale = (0.6 + (dist.randomness / 100) * 1.8) / bufW;

    if (edgePool.length > 0) {
      for (let i = 0; i < desiredEdges; i++) {
        // Weighted pick from edgePool
        const pickIdx = Math.floor(posRand() * edgePool.length);
        const pt = edgePool[pickIdx];
        if (posRand() <= pt.edge + 0.25) {
          const u = pt.u + (posRand() - 0.5) * jitterScale;
          const v = pt.v + (posRand() - 0.5) * jitterScale;
          candidates.push({ u, v, type: 1 });
        } else {
          const pt2 = edgePool[Math.floor(posRand() * edgePool.length)];
          candidates.push({
            u: pt2.u + (posRand() - 0.5) * jitterScale,
            v: pt2.v + (posRand() - 0.5) * jitterScale,
            type: 1,
          });
        }
      }
    }

    if (interiorPool.length > 0 && desiredInterior > 0) {
      for (let i = 0; i < desiredInterior; i++) {
        const pt = interiorPool[Math.floor(posRand() * interiorPool.length)];
        const u = pt.u + (posRand() - 0.5) * jitterScale * 2.2;
        const v = pt.v + (posRand() - 0.5) * jitterScale * 2.2;
        candidates.push({ u, v, type: 0 });
      }
    }
  } else if (mode === 'random') {
    // MODE C: RANDOM DISTRIBUTION (Monte Carlo Importance Rejection Sampling)
    const maxAttempts = effectiveTargetCount * 14;
    let attempts = 0;
    const varAmount = (dist.densityVariation || 0) / 100;

    while (candidates.length < effectiveTargetCount && attempts < maxAttempts) {
      attempts++;
      const u = posRand();
      const v = posRand();
      const sample = sampleAt(u, v);
      let weight = computePixelWeight(sample.luminance, sample.edge, sample.alpha);

      // Apply spatial density variation wave if enabled
      if (varAmount > 0) {
        const wave =
          0.5 +
          0.5 * Math.sin(u * 18.0 + dist.seed * 0.1) * Math.cos(v * 18.0 - dist.seed * 0.1);
        weight *= 1 - varAmount * 0.55 + wave * varAmount * 0.85;
      }

      if (posRand() * 1.15 < weight) {
        const type: ParticleTypeTag =
          sample.edge > 0.42 ? 1 : sample.luminance > 0.84 ? 3 : 0;
        candidates.push({ u, v, type });
      }
    }
  } else {
    // MODE A: IMAGE-BASED PARTICLES (Default Signature Golden Dust Mode)
    // Combines stratified importance sampling across image cells + edge contour reinforcement
    // + specular highlight dust for crisp, recognizable, luminous particle artwork.
    const cellGrid = Math.max(
      24,
      Math.min(180, Math.round(Math.sqrt(effectiveTargetCount * 1.35)))
    );
    const cellWeights = new Float32Array(cellGrid * cellGrid);
    let totalWeight = 0;

    for (let cy = 0; cy < cellGrid; cy++) {
      for (let cx = 0; cx < cellGrid; cx++) {
        const u = (cx + 0.5) / cellGrid;
        const v = (cy + 0.5) / cellGrid;
        const sample = sampleAt(u, v);
        let w = computePixelWeight(sample.luminance, sample.edge, sample.alpha);

        // Density variation modulation
        if (dist.densityVariation > 0) {
          const dv = dist.densityVariation / 100;
          const noise = Math.sin(cx * 0.75 + cy * 1.13 + dist.seed) * 0.5 + 0.5;
          w *= 1 - dv * 0.4 + noise * dv * 0.7;
        }

        cellWeights[cy * cellGrid + cx] = w;
        totalWeight += w;
      }
    }

    if (totalWeight <= 0.0001) {
      totalWeight = 1;
    }

    const jitter = 0.35 + (dist.randomness / 100) * 0.85;

    for (let cy = 0; cy < cellGrid; cy++) {
      for (let cx = 0; cx < cellGrid; cx++) {
        const w = cellWeights[cy * cellGrid + cx];
        if (w <= 0.001) continue;

        const expected = (w / totalWeight) * effectiveTargetCount;
        const whole = Math.floor(expected);
        const frac = expected - whole;
        const countInCell = whole + (posRand() < frac ? 1 : 0);

        for (let k = 0; k < countInCell; k++) {
          const du = (posRand() - 0.5) * jitter;
          const dv = (posRand() - 0.5) * jitter;
          const u = (cx + 0.5 + du) / cellGrid;
          const v = (cy + 0.5 + dv) / cellGrid;

          if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
          const s = sampleAt(u, v);
          const type: ParticleTypeTag =
            s.edge > 0.36 ? 1 : s.luminance > 0.82 ? 3 : 0;
          candidates.push({ u, v, type });
        }
      }
    }
  }

  // Add scattered atmospheric dust particles around active subject particles if scatterAmount > 0
  const scatterRatio = (dist.scatterAmount || 0) / 100;
  if (scatterRatio > 0 && candidates.length > 0) {
    const scatterCount = Math.min(
      Math.round(effectiveTargetCount * scatterRatio * 0.32),
      Math.max(0, safeLimit - candidates.length)
    );
    const maxRadiusNormX = ((dist.scatterRadius || 30) * artboardScaleFactor) / artW;
    const maxRadiusNormY = ((dist.scatterRadius || 30) * artboardScaleFactor) / artH;
    const baseLen = candidates.length;

    for (let i = 0; i < scatterCount; i++) {
      const parent = candidates[Math.floor(posRand() * baseLen)];
      const angle = posRand() * Math.PI * 2;
      const distFactor = 0.25 + Math.pow(posRand(), 0.7) * 0.75;
      const su = parent.u + Math.cos(angle) * maxRadiusNormX * distFactor;
      const sv = parent.v + Math.sin(angle) * maxRadiusNormY * distFactor;

      if (!dist.allowOutsideArtboard && (su < 0 || su > 1 || sv < 0 || sv > 1)) {
        continue;
      }
      candidates.push({ u: su, v: sv, type: 2 });
    }
  }

  // Enforce Minimum Spacing spatial hash culling if minSpacing > 0.6
  const minSpacingPx = Math.max(0, (dist.minSpacing || 0) * artboardScaleFactor * 0.45);
  const useSpatialFilter = minSpacingPx >= 1.2 && mode !== 'uniform-grid';
  const cellSize = useSpatialFilter ? Math.max(2, minSpacingPx) : 10;
  const gridCols = useSpatialFilter ? Math.ceil(artW / cellSize) + 4 : 1;
  const spatialBuckets = useSpatialFilter ? new Map<number, number[]>() : null;
  const minDistSq = minSpacingPx * minSpacingPx;

  // Build final ParticleItem list
  const particles: ParticleItem[] = [];
  let mainCount = 0;
  let edgeCount = 0;
  let scatterCount = 0;
  let highlightCount = 0;
  let minRadius = Infinity;
  let maxRadius = 0;
  let sumRadius = 0;

  const baseOpacity = (effects.particleOpacity ?? 95) / 100;
  const minOpacity = Math.min(baseOpacity, (effects.minOpacity ?? 20) / 100);
  const baseRot = shapeSettings.rotation || 0;
  const rotRandSpan = ((shapeSettings.rotationRandomness || 0) / 100) * 180;

  for (let i = 0; i < candidates.length; i++) {
    if (particles.length >= safeLimit) break;

    const c = candidates[i];
    if (!dist.allowOutsideArtboard && (c.u < 0 || c.u > 1 || c.v < 0 || c.v > 1)) {
      continue;
    }

    const x = Number((c.u * artW).toFixed(2));
    const y = Number((c.v * artH).toFixed(2));

    // Check minimum spacing collision
    if (useSpatialFilter && spatialBuckets) {
      const gx = Math.floor(x / cellSize);
      const gy = Math.floor(y / cellSize);
      let tooClose = false;

      for (let ny = gy - 1; ny <= gy + 1 && !tooClose; ny++) {
        for (let nx = gx - 1; nx <= gx + 1 && !tooClose; nx++) {
          const key = ny * gridCols + nx;
          const bucket = spatialBuckets.get(key);
          if (bucket) {
            for (let b = 0; b < bucket.length; b++) {
              const other = particles[bucket[b]];
              const dx = other.x - x;
              const dy = other.y - y;
              if (dx * dx + dy * dy < minDistSq) {
                tooClose = true;
                break;
              }
            }
          }
        }
      }

      if (tooClose) continue;

      const myKey = gy * gridCols + gx;
      const existing = spatialBuckets.get(myKey);
      if (existing) {
        existing.push(particles.length);
      } else {
        spatialBuckets.set(myKey, [particles.length]);
      }
    }

    const sample = sampleAt(c.u, c.v);
    const rSize = sizeRand();
    let radius = computeParticleRadius(
      sizeSettings,
      sample.luminance,
      sample.localLuma,
      sample.edge,
      rSize,
      artboardScaleFactor
    );

    // Scattered dust particles are slightly finer and more delicate
    if (c.type === 2) {
      radius = Math.max(0.35, radius * (0.45 + rSize * 0.4));
    }

    const rgb = computeParticleColor(
      colorSettings,
      effects,
      c.u,
      c.v,
      { r: sample.r, g: sample.g, b: sample.b },
      sample.luminance,
      colorRand(),
      colorRand(),
      colorRand(),
      c.type === 3
    );

    // Opacity modulated by luminance + particle type
    const tonalOpacity = minOpacity + sample.luminance * (baseOpacity - minOpacity);
    const opacity = Number(
      Math.max(
        0.08,
        Math.min(1, c.type === 2 ? tonalOpacity * 0.68 : tonalOpacity)
      ).toFixed(3)
    );

    const rotation = Number(
      (baseRot + (posRand() * 2 - 1) * rotRandSpan).toFixed(1)
    );

    const pItem: ParticleItem = {
      x,
      y,
      radius: Number(radius.toFixed(2)),
      rotation,
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      opacity,
      brightness: Number(sample.luminance.toFixed(3)),
      edgeStrength: Number(sample.edge.toFixed(3)),
      type: c.type,
      shapeSeed: Number(posRand().toFixed(4)),
    };

    particles.push(pItem);

    if (c.type === 0) mainCount++;
    else if (c.type === 1) edgeCount++;
    else if (c.type === 2) scatterCount++;
    else highlightCount++;

    if (pItem.radius < minRadius) minRadius = pItem.radius;
    if (pItem.radius > maxRadius) maxRadius = pItem.radius;
    sumRadius += pItem.radius;
  }

  const totalCount = particles.length;
  const generationTimeMs = Math.max(1, Math.round(performance.now() - startTime));

  return {
    particles,
    artboardWidthPx: artW,
    artboardHeightPx: artH,
    stats: {
      totalCount,
      mainCount,
      edgeCount,
      scatterCount,
      highlightCount,
      minRadius: totalCount > 0 ? Number(minRadius.toFixed(2)) : 0,
      maxRadius: totalCount > 0 ? Number(maxRadius.toFixed(2)) : 0,
      avgRadius: totalCount > 0 ? Number((sumRadius / totalCount).toFixed(2)) : 0,
      generationTimeMs,
    },
  };
}
