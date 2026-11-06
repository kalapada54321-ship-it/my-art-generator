import {
  AnalyzedImageBuffer,
  ImagePreprocessSettings,
  ImageTransformSettings,
} from '../types/studio';
import { hexToRgb } from '../utils/colorUtils';

/**
 * Pure pixel-level image transformation, preprocessing, and Sobel edge analysis engine.
 * Can run in main thread, Web Worker, or headless Vitest environment.
 */
export function analyzeAndPreprocessImage(
  srcRgba: Uint8ClampedArray,
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number,
  transform: ImageTransformSettings,
  preprocess: ImagePreprocessSettings
): AnalyzedImageBuffer {
  const w = Math.max(16, Math.round(targetWidth));
  const h = Math.max(16, Math.round(targetHeight));
  const totalPixels = w * h;

  const rgba = new Uint8ClampedArray(totalPixels * 4);
  const luminance = new Float32Array(totalPixels);
  const edgeMap = new Float32Array(totalPixels);
  const alphaMap = new Float32Array(totalPixels);

  // 1. Compute active cropped region of source image
  const cropL = Math.max(0, Math.min(0.45, (transform.cropLeft || 0) / 100));
  const cropR = Math.max(0, Math.min(0.45, (transform.cropRight || 0) / 100));
  const cropT = Math.max(0, Math.min(0.45, (transform.cropTop || 0) / 100));
  const cropB = Math.max(0, Math.min(0.45, (transform.cropBottom || 0) / 100));

  const cropX0 = srcWidth * cropL;
  const cropY0 = srcHeight * cropT;
  const cropW = Math.max(1, srcWidth * (1 - cropL - cropR));
  const cropH = Math.max(1, srcHeight * (1 - cropT - cropB));

  // 2. Determine mapping between target buffer (w, h) and cropped source (cropW, cropH)
  const srcAspect = cropW / cropH;
  const dstAspect = w / h;

  let drawW = w;
  let drawH = h;

  if (transform.fitMode === 'contain' || transform.fitMode === 'custom') {
    if (srcAspect > dstAspect) {
      drawW = w;
      drawH = w / srcAspect;
    } else {
      drawH = h;
      drawW = h * srcAspect;
    }
  } else if (transform.fitMode === 'cover') {
    if (srcAspect > dstAspect) {
      drawH = h;
      drawW = h * srcAspect;
    } else {
      drawW = w;
      drawH = w / srcAspect;
    }
  } else if (transform.fitMode === 'stretch') {
    drawW = w;
    drawH = h;
  }

  const scale = Math.max(0.1, Math.min(5, transform.scale || 1));
  drawW *= scale;
  drawH *= scale;

  const centerX = w * 0.5 + (transform.offsetX / 100) * w;
  const centerY = h * 0.5 + (transform.offsetY / 100) * h;
  const rad = ((-transform.rotation || 0) * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);

  // Precompute color adjustment constants
  const brightOffset = (preprocess.brightness / 100) * 255;
  const contrastFactor =
    (259 * ((preprocess.contrast / 100) * 255 + 255)) /
    (255 * (259 - (preprocess.contrast / 100) * 255));
  const satFactor = 1 + preprocess.saturation / 100;
  const invGamma = 1 / Math.max(0.2, Math.min(3.0, preprocess.gamma || 1));

  const bgRgb = hexToRgb(preprocess.bgTargetColor || '#000000');
  const maxBgDist = 441.67; // sqrt(255^2 * 3)
  const tolDist = (preprocess.bgTolerance / 100) * maxBgDist;
  const featherDist = Math.max(1, (preprocess.bgFeather / 100) * maxBgDist);

  // Sample transformed image and apply per-pixel color & background removal
  for (let y = 0; y < h; y++) {
    const dy = y - centerY;
    for (let x = 0; x < w; x++) {
      const dx = x - centerX;
      // Rotate back to unrotated draw frame
      const rx = dx * cosR - dy * sinR;
      const ry = dx * sinR + dy * cosR;

      const u = rx / drawW + 0.5;
      const v = ry / drawH + 0.5;

      const idx = y * w + x;
      const pIdx = idx * 4;

      if (u < 0 || u >= 1 || v < 0 || v >= 1) {
        rgba[pIdx] = 0;
        rgba[pIdx + 1] = 0;
        rgba[pIdx + 2] = 0;
        rgba[pIdx + 3] = 0;
        alphaMap[idx] = 0;
        luminance[idx] = 0;
        continue;
      }

      const sx = Math.min(srcWidth - 1, Math.max(0, Math.floor(cropX0 + u * cropW)));
      const sy = Math.min(srcHeight - 1, Math.max(0, Math.floor(cropY0 + v * cropH)));
      const sIdx = (sy * srcWidth + sx) * 4;

      let r = srcRgba[sIdx];
      let g = srcRgba[sIdx + 1];
      let b = srcRgba[sIdx + 2];
      let a = srcRgba[sIdx + 3] / 255;

      // Optional Manual Background Removal (color key + tolerance + feather)
      if (preprocess.removeBgEnabled && a > 0) {
        const dr = r - bgRgb.r;
        const dg = g - bgRgb.g;
        const db = b - bgRgb.b;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist <= tolDist) {
          a = 0;
        } else if (dist < tolDist + featherDist) {
          a *= (dist - tolDist) / featherDist;
        }
      }

      // Brightness & Contrast
      r = contrastFactor * (r + brightOffset - 128) + 128;
      g = contrastFactor * (g + brightOffset - 128) + 128;
      b = contrastFactor * (b + brightOffset - 128) + 128;

      // Saturation
      const lumaRaw = 0.299 * r + 0.587 * g + 0.114 * b;
      r = lumaRaw + (r - lumaRaw) * satFactor;
      g = lumaRaw + (g - lumaRaw) * satFactor;
      b = lumaRaw + (b - lumaRaw) * satFactor;

      // Clamp 0..255
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      // Gamma correction
      if (Math.abs(invGamma - 1) > 0.01) {
        r = 255 * Math.pow(r / 255, invGamma);
        g = 255 * Math.pow(g / 255, invGamma);
        b = 255 * Math.pow(b / 255, invGamma);
      }

      // Invert
      if (preprocess.invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      // Grayscale
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      if (preprocess.grayscale) {
        r = gray;
        g = gray;
        b = gray;
      }

      // Threshold
      if (preprocess.thresholdEnabled) {
        const th = preprocess.thresholdValue;
        const bin = gray >= th ? 255 : 0;
        r = bin;
        g = bin;
        b = bin;
      }

      rgba[pIdx] = Math.round(r);
      rgba[pIdx + 1] = Math.round(g);
      rgba[pIdx + 2] = Math.round(b);
      rgba[pIdx + 3] = Math.round(a * 255);

      alphaMap[idx] = a;
      luminance[idx] = ((0.299 * r + 0.587 * g + 0.114 * b) / 255) * a;
    }
  }

  // 3. Optional Blur pass on luminance & RGB
  if (preprocess.blur > 0) {
    const radius = Math.min(6, Math.max(1, Math.round(preprocess.blur)));
    applyBoxBlur(rgba, luminance, w, h, radius);
  }

  // 4. Optional Sharpen pass
  if (preprocess.sharpen > 0) {
    const amount = (preprocess.sharpen / 100) * 1.25;
    applySharpen(rgba, luminance, w, h, amount);
  }

  // 5. Compute Sobel Edge Magnitude Map and optional Edge Enhancement
  const edgeEnhanceWeight = (preprocess.edgeEnhance || 0) / 100;
  let maxGradient = 0.001;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (alphaMap[idx] <= 0.01) continue;

      const tl = luminance[(y - 1) * w + (x - 1)];
      const tc = luminance[(y - 1) * w + x];
      const tr = luminance[(y - 1) * w + (x + 1)];
      const ml = luminance[y * w + (x - 1)];
      const mr = luminance[y * w + (x + 1)];
      const bl = luminance[(y + 1) * w + (x - 1)];
      const bc = luminance[(y + 1) * w + x];
      const br = luminance[(y + 1) * w + (x + 1)];

      const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
      const mag = Math.sqrt(gx * gx + gy * gy);
      edgeMap[idx] = mag;
      if (mag > maxGradient) maxGradient = mag;
    }
  }

  // Normalize edgeMap to [0, 1] and blend edge enhancement
  for (let i = 0; i < totalPixels; i++) {
    const normEdge = Math.min(1, edgeMap[i] / maxGradient);
    edgeMap[i] = normEdge;
    if (edgeEnhanceWeight > 0 && alphaMap[i] > 0.01) {
      luminance[i] = Math.min(1, luminance[i] + normEdge * edgeEnhanceWeight * 0.45);
    }
  }

  return {
    width: w,
    height: h,
    rgba,
    luminance,
    edgeMap,
    alphaMap,
  };
}

function applyBoxBlur(
  rgba: Uint8ClampedArray,
  luminance: Float32Array,
  w: number,
  h: number,
  radius: number
) {
  const copyLuma = new Float32Array(luminance);
  const copyRgba = new Uint8ClampedArray(rgba);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sumL = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let count = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        const ny = y + ky;
        if (ny < 0 || ny >= h) continue;
        for (let kx = -radius; kx <= radius; kx++) {
          const nx = x + kx;
          if (nx < 0 || nx >= w) continue;
          const nIdx = ny * w + nx;
          sumL += copyLuma[nIdx];
          const p = nIdx * 4;
          sumR += copyRgba[p];
          sumG += copyRgba[p + 1];
          sumB += copyRgba[p + 2];
          count++;
        }
      }

      if (count > 0) {
        const idx = y * w + x;
        luminance[idx] = sumL / count;
        const p = idx * 4;
        rgba[p] = sumR / count;
        rgba[p + 1] = sumG / count;
        rgba[p + 2] = sumB / count;
      }
    }
  }
}

function applySharpen(
  rgba: Uint8ClampedArray,
  luminance: Float32Array,
  w: number,
  h: number,
  amount: number
) {
  const copyLuma = new Float32Array(luminance);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const center = copyLuma[idx];
      const neighbors =
        copyLuma[(y - 1) * w + x] +
        copyLuma[(y + 1) * w + x] +
        copyLuma[y * w + (x - 1)] +
        copyLuma[y * w + (x + 1)];
      const lap = 4 * center - neighbors;
      const sharpened = Math.max(0, Math.min(1, center + lap * amount * 0.35));
      const delta = (sharpened - center) * 255;
      luminance[idx] = sharpened;
      const p = idx * 4;
      rgba[p] = Math.max(0, Math.min(255, rgba[p] + delta));
      rgba[p + 1] = Math.max(0, Math.min(255, rgba[p + 1] + delta));
      rgba[p + 2] = Math.max(0, Math.min(255, rgba[p + 2] + delta));
    }
  }
}
