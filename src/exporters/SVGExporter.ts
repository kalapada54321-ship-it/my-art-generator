import { getParticlePolygonPoints } from '../engine/ParticleShapeRenderer';
import {
  ParticleGenerationResult,
  ParticleItem,
  ParticleShapeSettings,
  StudioConfig,
} from '../types/studio';
import { rgbToHex } from '../utils/colorUtils';

function renderSingleParticleSvgElement(
  p: ParticleItem,
  shapeSettings: ParticleShapeSettings
): string {
  const hex = rgbToHex(p.r, p.g, p.b);
  const opAttr = p.opacity < 0.995 ? ` fill-opacity="${p.opacity}"` : '';

  if (shapeSettings.shape === 'circle') {
    return `<circle cx="${p.x}" cy="${p.y}" r="${p.radius}" fill="${hex}"${opAttr}/>`;
  }

  const pts = getParticlePolygonPoints(p, shapeSettings);
  if (pts.length === 0) {
    return `<circle cx="${p.x}" cy="${p.y}" r="${p.radius}" fill="${hex}"${opAttr}/>`;
  }

  const pointsStr = pts.map((pt) => `${pt.x},${pt.y}`).join(' ');
  return `<polygon points="${pointsStr}" fill="${hex}"${opAttr}/>`;
}

/**
 * Generates a complete, valid, editable SVG string from the ParticleGenerationResult.
 */
export function generateEditableSVG(
  result: ParticleGenerationResult,
  config: StudioConfig
): string {
  const w = result.artboardWidthPx;
  const h = result.artboardHeightPx;
  const bg = config.background;
  const fx = config.effects;
  const exp = config.export;
  const shape = config.shape;
  const particles = result.particles;

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" data-generator="ParticleForge Studio" data-particles="${particles.length}">`
  );

  // Defs for background gradients or optional SVG filter glow
  const needsBgGradient =
    exp.includeBackground && bg.type === 'gradient';
  const needsGlowFilter =
    exp.includeVectorGlow && fx.vectorGlowMode === 'svg-filter' && fx.glowIntensity > 0;
  const needsAtmoGradient =
    exp.includeVectorGlow && fx.backgroundAtmosphere > 0;

  if (needsBgGradient || needsGlowFilter || needsAtmoGradient) {
    lines.push(`  <defs>`);
    if (needsBgGradient) {
      if (bg.gradientType === 'radial') {
        lines.push(
          `    <radialGradient id="pf-bg-grad" cx="50%" cy="50%" r="70%">`,
          `      <stop offset="0%" stop-color="${bg.gradientStart}"/>`,
          `      <stop offset="100%" stop-color="${bg.gradientEnd}"/>`,
          `    </radialGradient>`
        );
      } else {
        lines.push(
          `    <linearGradient id="pf-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">`,
          `      <stop offset="0%" stop-color="${bg.gradientStart}"/>`,
          `      <stop offset="100%" stop-color="${bg.gradientEnd}"/>`,
          `    </linearGradient>`
        );
      }
    }
    if (needsAtmoGradient) {
      const atmoOp = Number(((fx.backgroundAtmosphere / 100) * 0.25).toFixed(3));
      lines.push(
        `    <radialGradient id="pf-atmo-grad" cx="50%" cy="48%" r="52%">`,
        `      <stop offset="0%" stop-color="${fx.glowColor}" stop-opacity="${atmoOp}"/>`,
        `      <stop offset="100%" stop-color="${fx.glowColor}" stop-opacity="0"/>`,
        `    </radialGradient>`
      );
    }
    if (needsGlowFilter) {
      const stdDev = Math.max(1, Number(((fx.glowRadius || 12) * 0.35).toFixed(1)));
      lines.push(
        `    <filter id="pf-vector-glow" x="-25%" y="-25%" width="150%" height="150%">`,
        `      <feGaussianBlur stdDeviation="${stdDev}" result="blur"/>`,
        `      <feMerge>`,
        `        <feMergeNode in="blur"/>`,
        `        <feMergeNode in="SourceGraphic"/>`,
        `      </feMerge>`,
        `    </filter>`
      );
    }
    lines.push(`  </defs>`);
  }

  // 1. Background Group
  if (exp.includeBackground && bg.type !== 'transparent') {
    lines.push(`  <g id="Background" data-layer-name="Background">`);
    if (bg.type === 'solid-black' || bg.type === 'original-image') {
      lines.push(`    <rect width="${w}" height="${h}" fill="#050608"/>`);
    } else if (bg.type === 'solid-white') {
      lines.push(`    <rect width="${w}" height="${h}" fill="#FFFFFF"/>`);
    } else if (bg.type === 'custom-solid') {
      lines.push(`    <rect width="${w}" height="${h}" fill="${bg.customColor}"/>`);
    } else if (bg.type === 'gradient') {
      lines.push(`    <rect width="${w}" height="${h}" fill="url(#pf-bg-grad)"/>`);
    }
    lines.push(`  </g>`);
  }

  // 2. Independent Vector Glow Effects Group
  if (exp.includeVectorGlow && (fx.glowIntensity > 0 || fx.backgroundAtmosphere > 0)) {
    lines.push(`  <g id="Glow_Effects" data-layer-name="Glow Effects">`);
    if (needsAtmoGradient) {
      lines.push(`    <rect width="${w}" height="${h}" fill="url(#pf-atmo-grad)"/>`);
    }
    if (fx.vectorGlowMode === 'vector-halos' && fx.glowIntensity > 0) {
      const haloScale = Number((1.75 + (fx.glowRadius / 60) * 2.2).toFixed(2));
      const baseAlpha = (fx.glowIntensity / 100) * ((fx.outerGlow || 50) / 100) * 0.22;
      // Export clean editable vector halo circles on bright particles
      const step = particles.length > 15000 ? 3 : 2;
      for (let i = 0; i < particles.length; i += step) {
        const p = particles[i];
        if (p.brightness < 0.42 && p.type !== 3) continue;
        const hr = Number((p.radius * haloScale).toFixed(2));
        const hop = Number((baseAlpha * p.opacity * p.brightness).toFixed(3));
        if (hop <= 0.015) continue;
        const hex = rgbToHex(p.r, p.g, p.b);
        lines.push(
          `    <circle cx="${p.x}" cy="${p.y}" r="${hr}" fill="${hex}" fill-opacity="${hop}"/>`
        );
      }
    }
    lines.push(`  </g>`);
  }

  const filterAttr = needsGlowFilter ? ` filter="url(#pf-vector-glow)"` : '';
  const grouping = exp.groupingMode || 'by-layer';

  // 3. Editable Particle Geometry Organized by Selected Grouping Mode
  if (grouping === 'ungrouped') {
    for (let i = 0; i < particles.length; i++) {
      lines.push(`  ${renderSingleParticleSvgElement(particles[i], shape)}`);
    }
  } else if (grouping === 'all-grouped') {
    lines.push(`  <g id="All_Particles" data-layer-name="All Particles"${filterAttr}>`);
    for (let i = 0; i < particles.length; i++) {
      lines.push(`    ${renderSingleParticleSvgElement(particles[i], shape)}`);
    }
    lines.push(`  </g>`);
  } else if (grouping === 'by-color') {
    const colorBuckets = new Map<string, ParticleItem[]>();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // Quantize RGB slightly to keep color group count reasonable for Illustrator layers
      const qr = Math.round(p.r / 16) * 16;
      const qg = Math.round(p.g / 16) * 16;
      const qb = Math.round(p.b / 16) * 16;
      const key = rgbToHex(qr, qg, qb);
      const arr = colorBuckets.get(key);
      if (arr) arr.push(p);
      else colorBuckets.set(key, [p]);
    }
    colorBuckets.forEach((groupParticles, hexKey) => {
      const cleanId = `Color_${hexKey.slice(1)}`;
      lines.push(`  <g id="${cleanId}" data-color="${hexKey}"${filterAttr}>`);
      for (let i = 0; i < groupParticles.length; i++) {
        lines.push(`    ${renderSingleParticleSvgElement(groupParticles[i], shape)}`);
      }
      lines.push(`  </g>`);
    });
  } else if (grouping === 'by-size') {
    const minR = result.stats.minRadius;
    const maxR = Math.max(minR + 0.1, result.stats.maxRadius);
    const span = maxR - minR;
    const small: ParticleItem[] = [];
    const medium: ParticleItem[] = [];
    const large: ParticleItem[] = [];

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const norm = (p.radius - minR) / span;
      if (norm < 0.33) small.push(p);
      else if (norm < 0.66) medium.push(p);
      else large.push(p);
    }

    const tiers: Array<{ id: string; items: ParticleItem[] }> = [
      { id: 'Small_Particles', items: small },
      { id: 'Medium_Particles', items: medium },
      { id: 'Large_Particles', items: large },
    ];

    for (const tier of tiers) {
      if (tier.items.length === 0) continue;
      lines.push(`  <g id="${tier.id}"${filterAttr}>`);
      for (let i = 0; i < tier.items.length; i++) {
        lines.push(`    ${renderSingleParticleSvgElement(tier.items[i], shape)}`);
      }
      lines.push(`  </g>`);
    }
  } else {
    // 'by-layer' or 'by-type' -> Logical Illustrator Groups:
    // Main_Particles, Edge_Particles, Scattered_Particles, Highlight_Particles
    const mainList: ParticleItem[] = [];
    const edgeList: ParticleItem[] = [];
    const scatterList: ParticleItem[] = [];
    const highlightList: ParticleItem[] = [];

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.type === 1) edgeList.push(p);
      else if (p.type === 2) scatterList.push(p);
      else if (p.type === 3) highlightList.push(p);
      else mainList.push(p);
    }

    if (scatterList.length > 0) {
      lines.push(
        `  <g id="Scattered_Particles" data-layer-name="Scattered Particles"${filterAttr}>`
      );
      for (let i = 0; i < scatterList.length; i++) {
        lines.push(`    ${renderSingleParticleSvgElement(scatterList[i], shape)}`);
      }
      lines.push(`  </g>`);
    }

    if (mainList.length > 0) {
      lines.push(`  <g id="Main_Particles" data-layer-name="Main Particles"${filterAttr}>`);
      for (let i = 0; i < mainList.length; i++) {
        lines.push(`    ${renderSingleParticleSvgElement(mainList[i], shape)}`);
      }
      lines.push(`  </g>`);
    }

    if (edgeList.length > 0) {
      lines.push(`  <g id="Edge_Particles" data-layer-name="Edge Particles"${filterAttr}>`);
      for (let i = 0; i < edgeList.length; i++) {
        lines.push(`    ${renderSingleParticleSvgElement(edgeList[i], shape)}`);
      }
      lines.push(`  </g>`);
    }

    if (highlightList.length > 0) {
      lines.push(
        `  <g id="Highlight_Particles" data-layer-name="Highlight Particles"${filterAttr}>`
      );
      for (let i = 0; i < highlightList.length; i++) {
        lines.push(`    ${renderSingleParticleSvgElement(highlightList[i], shape)}`);
      }
      lines.push(`  </g>`);
    }
  }

  lines.push(`</svg>`);
  return lines.join('\n');
}
