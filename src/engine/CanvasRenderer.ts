import {
  ParticleGenerationResult,
  StudioConfig,
} from '../types/studio';
import { hexToRgb } from '../utils/colorUtils';
import { traceParticleCanvasPath } from './ParticleShapeRenderer';

export interface RenderOptions {
  includeBackground?: boolean;
  includeGlow?: boolean;
  sourceImageElement?: HTMLImageElement | HTMLCanvasElement | null;
  targetWidth?: number;
  targetHeight?: number;
}

/**
 * Renders the complete particle artwork onto the provided HTMLCanvasElement or CanvasRenderingContext2D.
 */
export function renderParticlesToCanvas(
  ctx: CanvasRenderingContext2D,
  result: ParticleGenerationResult,
  config: StudioConfig,
  options: RenderOptions = {}
): void {
  const artW = result.artboardWidthPx;
  const artH = result.artboardHeightPx;
  const outW = options.targetWidth || artW;
  const outH = options.targetHeight || artH;

  const scaleX = outW / artW;
  const scaleY = outH / artH;

  ctx.save();
  ctx.clearRect(0, 0, outW, outH);
  ctx.scale(scaleX, scaleY);

  const bg = config.background;
  const fx = config.effects;
  const shape = config.shape;
  const includeBg = options.includeBackground ?? bg.type !== 'transparent';
  const includeGlow = options.includeGlow ?? true;

  // 1. Render Background
  if (includeBg && bg.type !== 'transparent') {
    if (bg.type === 'solid-black') {
      ctx.fillStyle = '#050608';
      ctx.fillRect(0, 0, artW, artH);
    } else if (bg.type === 'solid-white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, artW, artH);
    } else if (bg.type === 'custom-solid') {
      ctx.fillStyle = bg.customColor || '#07080C';
      ctx.fillRect(0, 0, artW, artH);
    } else if (bg.type === 'gradient') {
      let grad: CanvasGradient;
      if (bg.gradientType === 'radial') {
        grad = ctx.createRadialGradient(
          artW * 0.5,
          artH * 0.5,
          Math.min(artW, artH) * 0.05,
          artW * 0.5,
          artH * 0.5,
          Math.max(artW, artH) * 0.7
        );
      } else {
        const rad = ((bg.gradientAngle || 135) * Math.PI) / 180;
        const cx = artW * 0.5;
        const cy = artH * 0.5;
        const halfDiag = Math.sqrt(artW * artW + artH * artH) * 0.5;
        grad = ctx.createLinearGradient(
          cx - Math.cos(rad) * halfDiag,
          cy - Math.sin(rad) * halfDiag,
          cx + Math.cos(rad) * halfDiag,
          cy + Math.sin(rad) * halfDiag
        );
      }
      grad.addColorStop(0, bg.gradientStart || '#1A1308');
      grad.addColorStop(1, bg.gradientEnd || '#050608');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, artW, artH);
    } else if (bg.type === 'original-image') {
      ctx.fillStyle = '#050608';
      ctx.fillRect(0, 0, artW, artH);
      if (options.sourceImageElement) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, (bg.originalImageOpacity ?? 25) / 100));
        ctx.drawImage(options.sourceImageElement, 0, 0, artW, artH);
        ctx.restore();
      }
    }
  }

  // 2. Render Atmospheric Background Glow
  if (includeGlow && fx.backgroundAtmosphere > 0 && result.particles.length > 0) {
    const glowRgb = hexToRgb(fx.glowColor || '#F59E0B');
    const atmoAlpha = (fx.backgroundAtmosphere / 100) * 0.24;
    const atmoGrad = ctx.createRadialGradient(
      artW * 0.5,
      artH * 0.48,
      Math.min(artW, artH) * 0.04,
      artW * 0.5,
      artH * 0.5,
      Math.max(artW, artH) * 0.52
    );
    atmoGrad.addColorStop(0, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${atmoAlpha})`);
    atmoGrad.addColorStop(
      0.55,
      `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${atmoAlpha * 0.35})`
    );
    atmoGrad.addColorStop(1, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 0)`);
    ctx.fillStyle = atmoGrad;
    ctx.fillRect(0, 0, artW, artH);
  }

  const particles = result.particles;
  const glowMaster = (fx.glowIntensity / 100) * ((fx.outerGlow || 50) / 100);
  const bloomFactor = (fx.bloomEffect || 0) / 100;

  // 3. Render Outer Glow Halos on bright/medium particles
  if (includeGlow && (glowMaster > 0.02 || bloomFactor > 0.02)) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const haloScale = 1.6 + (fx.glowRadius / 60) * 2.6 + bloomFactor * 1.4;
    const baseHaloAlpha = Math.min(0.32, (glowMaster * 0.22 + bloomFactor * 0.14));

    // Step through particles (for very dense clouds >25k, render halos on brightest/largest subset for 60fps speed)
    const step = particles.length > 28000 ? 2 : 1;
    for (let i = 0; i < particles.length; i += step) {
      const p = particles[i];
      if (p.brightness < 0.22 && p.type !== 3) continue;
      const haloR = p.radius * haloScale;
      if (haloR < 1.2) continue;

      const a = Number((baseHaloAlpha * p.opacity * (0.4 + p.brightness * 0.6)).toFixed(3));
      if (a <= 0.01) continue;

      ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 4. Optional subtle canvas blur filter
  if (fx.blurIntensity > 0) {
    ctx.filter = `blur(${(fx.blurIntensity * 0.35).toFixed(1)}px)`;
  }

  // 5. Render Crisp Core Particles
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.opacity})`;
    ctx.beginPath();
    traceParticleCanvasPath(ctx, p, shape);
    ctx.fill();
  }

  if (fx.blurIntensity > 0) {
    ctx.filter = 'none';
  }

  // 6. Render Inner Glow & Specular Highlight Cores on high-luminance particles
  const innerGlowStrength = ((fx.innerGlow || 0) / 100) * ((fx.lightIntensity || 50) / 100);
  if (includeGlow && innerGlowStrength > 0.04) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.brightness < 0.58 && p.type !== 3) continue;
      const coreR = p.radius * 0.46;
      if (coreR < 0.45) continue;

      const coreAlpha = Math.min(0.85, innerGlowStrength * p.brightness * 0.78);
      ctx.fillStyle = `rgba(255, 253, 240, ${coreAlpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, coreR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}
