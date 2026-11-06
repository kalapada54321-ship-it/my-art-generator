import { SourceImageMetadata } from '../types/studio';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const MAX_FILE_SIZE_BYTES = 45 * 1024 * 1024; // 45 MB safety limit
export const MAX_IMAGE_DIMENSION = 10000;

export interface ValidatedUploadResult {
  valid: boolean;
  error?: string;
}

/**
 * Pure validation helper for image file metadata (testable in unit tests and browser).
 */
export function validateImageFileMetadata(file: {
  name: string;
  type: string;
  size: number;
}): ValidatedUploadResult {
  if (!file || file.size <= 0) {
    return {
      valid: false,
      error: 'The selected file is empty (0 bytes). Please upload a valid JPG, PNG, or WEBP image.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image file exceeds the 45 MB safety limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please use a smaller image.`,
    };
  }

  const lowerType = (file.type || '').toLowerCase();
  const extMatch = /\.(jpe?g|png|webp)$/i.test(file.name || '');

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(lowerType) && !extMatch) {
    return {
      valid: false,
      error: `Unsupported file format "${file.type || file.name}". Supported formats: JPG, JPEG, PNG, and WEBP.`,
    };
  }

  return { valid: true };
}

/**
 * Reads and decodes a browser File into SourceImageMetadata + HTMLImageElement + pixel buffer.
 */
export async function decodeUploadedImageFile(file: File): Promise<{
  metadata: SourceImageMetadata;
  imageElement: HTMLImageElement;
  rgbaBuffer: Uint8ClampedArray;
  bufferWidth: number;
  bufferHeight: number;
}> {
  const check = validateImageFileMetadata(file);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.length > 32) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image data. File may be corrupted.'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading image file from disk.'));
    reader.readAsDataURL(file);
  });

  return decodeImageDataUrl(dataUrl, file.name, file.size, file.type || 'image/png');
}

/**
 * Decodes a dataUrl into an HTMLImageElement and extracts a working pixel buffer.
 */
export async function decodeImageDataUrl(
  dataUrl: string,
  name: string,
  fileSize: number,
  mimeType: string,
  isSample = false,
  sampleId?: string
): Promise<{
  metadata: SourceImageMetadata;
  imageElement: HTMLImageElement;
  rgbaBuffer: Uint8ClampedArray;
  bufferWidth: number;
  bufferHeight: number;
}> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    throw new Error('Corrupted or invalid image data URL.');
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => {
      if (el.naturalWidth <= 0 || el.naturalHeight <= 0) {
        reject(new Error('Image has invalid zero dimensions.'));
      } else if (
        el.naturalWidth > MAX_IMAGE_DIMENSION ||
        el.naturalHeight > MAX_IMAGE_DIMENSION
      ) {
        reject(
          new Error(
            `Image dimensions (${el.naturalWidth}×${el.naturalHeight}) exceed the maximum supported size of ${MAX_IMAGE_DIMENSION}px.`
          )
        );
      } else {
        resolve(el);
      }
    };
    el.onerror = () =>
      reject(new Error('Corrupted image data. The browser could not decode this image.'));
    el.src = dataUrl;
  });

  // Extract pixel buffer at up to 640px max dimension for fast, responsive image analysis
  const maxAnalysisDim = 640;
  const scale = Math.min(1, maxAnalysisDim / Math.max(img.naturalWidth, img.naturalHeight));
  const bufW = Math.max(16, Math.round(img.naturalWidth * scale));
  const bufH = Math.max(16, Math.round(img.naturalHeight * scale));

  const offCanvas = document.createElement('canvas');
  offCanvas.width = bufW;
  offCanvas.height = bufH;
  const ctx = offCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser 2D Canvas context is unavailable.');
  }

  ctx.drawImage(img, 0, 0, bufW, bufH);
  const imgData = ctx.getImageData(0, 0, bufW, bufH);

  return {
    metadata: {
      name,
      width: img.naturalWidth,
      height: img.naturalHeight,
      fileSize,
      mimeType,
      dataUrl,
      isSample,
      sampleId,
    },
    imageElement: img,
    rgbaBuffer: imgData.data,
    bufferWidth: bufW,
    bufferHeight: bufH,
  };
}
