import { renderParticlesToCanvas } from '../engine/CanvasRenderer';
import { ParticleGenerationResult, StudioConfig } from '../types/studio';

/**
 * Renders the artwork at full artboard resolution to a Blob (PNG or JPEG).
 */
export async function generateHighResRasterBlob(
  result: ParticleGenerationResult,
  config: StudioConfig,
  format: 'png' | 'jpg',
  sourceImageElement?: HTMLImageElement | HTMLCanvasElement | null
): Promise<Blob> {
  const outW = Math.max(64, Math.min(8192, Math.round(result.artboardWidthPx)));
  const outH = Math.max(64, Math.min(8192, Math.round(result.artboardHeightPx)));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context for high-resolution raster export.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // For JPG, always ensure a non-transparent background
  const effectiveConfig: StudioConfig =
    format === 'jpg' &&
    (!config.export.includeBackground || config.background.type === 'transparent')
      ? {
          ...config,
          background: {
            ...config.background,
            type: 'custom-solid',
            customColor: config.background.customColor || '#050608',
          },
          export: {
            ...config.export,
            includeBackground: true,
          },
        }
      : config;

  renderParticlesToCanvas(ctx, result, effectiveConfig, {
    includeBackground: effectiveConfig.export.includeBackground,
    includeGlow: effectiveConfig.export.includeVectorGlow,
    sourceImageElement,
    targetWidth: outW,
    targetHeight: outH,
  });

  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const quality =
    format === 'jpg'
      ? Math.max(0.1, Math.min(1.0, (config.export.jpgQuality || 92) / 100))
      : undefined;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Failed to encode ${format.toUpperCase()} image blob.`));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Triggers a browser download for a Blob or string payload.
 */
export function triggerFileDownload(
  content: Blob | string,
  filename: string,
  mimeType = 'application/octet-stream'
): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Estimates the exported file size in bytes based on format and particle count.
 */
export function estimateExportFileSizeBytes(
  result: ParticleGenerationResult,
  config: StudioConfig
): number {
  const count = result.stats.totalCount;
  const format = config.export.format;
  const pixels = result.artboardWidthPx * result.artboardHeightPx;

  switch (format) {
    case 'svg':
    case 'ai-workflow': {
      const bytesPerParticle = config.shape.shape === 'circle' ? 68 : 115;
      const glowExtra =
        config.export.includeVectorGlow && config.effects.vectorGlowMode === 'vector-halos'
          ? Math.round(count * 0.35 * 68)
          : 0;
      return 1200 + count * bytesPerParticle + glowExtra;
    }
    case 'eps': {
      const bytesPerParticle = config.shape.shape === 'circle' ? 42 : 85;
      return 950 + count * bytesPerParticle;
    }
    case 'pdf': {
      const bytesPerParticle = config.shape.shape === 'circle' ? 120 : 95;
      return 1400 + count * bytesPerParticle;
    }
    case 'png': {
      return Math.round(Math.min(25_000_000, Math.max(120_000, pixels * 0.22 + count * 18)));
    }
    case 'jpg': {
      const qFactor = (config.export.jpgQuality || 90) / 100;
      return Math.round(
        Math.min(15_000_000, Math.max(65_000, pixels * 0.08 * qFactor + count * 8))
      );
    }
    default:
      return count * 75;
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
