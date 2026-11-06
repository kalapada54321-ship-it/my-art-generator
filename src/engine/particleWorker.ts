import {
  AnalyzedImageBuffer,
  ParticleGenerationResult,
  ProcessingQuality,
  StudioConfig,
} from '../types/studio';
import { analyzeAndPreprocessImage } from './ImagePreprocessor';
import { generateParticlesFromBuffer } from './ParticleEngine';

export interface WorkerRequestMessage {
  requestId: number;
  srcRgba: Uint8ClampedArray;
  srcWidth: number;
  srcHeight: number;
  analysisWidth: number;
  analysisHeight: number;
  config: StudioConfig;
  quality: ProcessingQuality;
}

export interface WorkerResponseMessage {
  requestId: number;
  result: ParticleGenerationResult;
  analyzedBuffer: AnalyzedImageBuffer;
  error?: string;
}

self.onmessage = (event: MessageEvent<WorkerRequestMessage>) => {
  const {
    requestId,
    srcRgba,
    srcWidth,
    srcHeight,
    analysisWidth,
    analysisHeight,
    config,
    quality,
  } = event.data;

  try {
    const analyzedBuffer = analyzeAndPreprocessImage(
      srcRgba,
      srcWidth,
      srcHeight,
      analysisWidth,
      analysisHeight,
      config.transform,
      config.preprocess
    );

    const result = generateParticlesFromBuffer(analyzedBuffer, config, quality);

    const response: WorkerResponseMessage = {
      requestId,
      result,
      analyzedBuffer,
    };

    self.postMessage(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown particle worker error';
    self.postMessage({
      requestId,
      error: message,
    });
  }
};
