import {
  AnalyzedImageBuffer,
  ParticleGenerationResult,
  ProcessingQuality,
  StudioConfig,
} from '../types/studio';
import { analyzeAndPreprocessImage } from './ImagePreprocessor';
import { generateParticlesFromBuffer } from './ParticleEngine';
import type { WorkerRequestMessage, WorkerResponseMessage } from './particleWorker';

export interface GenerationJobOutput {
  result: ParticleGenerationResult;
  analyzedBuffer: AnalyzedImageBuffer;
}

class ParticleWorkerController {
  private worker: Worker | null = null;
  private currentRequestId = 0;
  private pendingResolve: ((value: GenerationJobOutput | null) => void) | null = null;
  private pendingReject: ((reason?: unknown) => void) | null = null;
  private lastPayload: WorkerRequestMessage | null = null;
  private workerSupported = true;

  private executeFallback(payload: WorkerRequestMessage): GenerationJobOutput {
    const analyzedBuffer = analyzeAndPreprocessImage(
      payload.srcRgba,
      payload.srcWidth,
      payload.srcHeight,
      payload.analysisWidth,
      payload.analysisHeight,
      payload.config.transform,
      payload.config.preprocess
    );
    const result = generateParticlesFromBuffer(
      analyzedBuffer,
      payload.config,
      payload.quality
    );
    return { result, analyzedBuffer };
  }

  private initWorker(): Worker | null {
    if (!this.workerSupported || typeof Worker === 'undefined') return null;
    if (this.worker) return this.worker;

    try {
      this.worker = new Worker(new URL('./particleWorker.ts', import.meta.url), {
        type: 'module',
      });
      this.worker.onmessage = (event: MessageEvent<WorkerResponseMessage>) => {
        const data = event.data;
        if (data.requestId !== this.currentRequestId) {
          return;
        }
        if (data.error) {
          if (this.pendingReject) this.pendingReject(new Error(data.error));
        } else if (this.pendingResolve) {
          this.pendingResolve({
            result: data.result,
            analyzedBuffer: data.analyzedBuffer,
          });
        }
        this.pendingResolve = null;
        this.pendingReject = null;
      };
      this.worker.onerror = (errEvent) => {
        errEvent.preventDefault();
        this.workerSupported = false;
        this.worker?.terminate();
        this.worker = null;

        // Immediately fulfill any pending job using the fallback engine
        if (this.pendingResolve && this.lastPayload) {
          const resolveFn = this.pendingResolve;
          const rejectFn = this.pendingReject;
          const payload = this.lastPayload;
          this.pendingResolve = null;
          this.pendingReject = null;
          try {
            resolveFn(this.executeFallback(payload));
          } catch (err) {
            if (rejectFn) rejectFn(err);
          }
        }
      };
      return this.worker;
    } catch {
      this.workerSupported = false;
      return null;
    }
  }

  public cancelCurrentJob(): void {
    this.currentRequestId++;
    if (this.pendingResolve) {
      this.pendingResolve(null);
      this.pendingResolve = null;
      this.pendingReject = null;
    }
  }

  public async runGeneration(
    srcRgba: Uint8ClampedArray,
    srcWidth: number,
    srcHeight: number,
    analysisWidth: number,
    analysisHeight: number,
    config: StudioConfig,
    quality: ProcessingQuality
  ): Promise<GenerationJobOutput | null> {
    this.cancelCurrentJob();
    const requestId = ++this.currentRequestId;

    const payload: WorkerRequestMessage = {
      requestId,
      srcRgba,
      srcWidth,
      srcHeight,
      analysisWidth,
      analysisHeight,
      config,
      quality,
    };
    this.lastPayload = payload;

    const worker = this.initWorker();
    if (worker && this.workerSupported) {
      return new Promise<GenerationJobOutput | null>((resolve, reject) => {
        this.pendingResolve = resolve;
        this.pendingReject = reject;
        try {
          worker.postMessage(payload);
        } catch {
          this.workerSupported = false;
          this.pendingResolve = null;
          this.pendingReject = null;
          resolve(this.executeFallback(payload));
        }
      });
    }

    return new Promise<GenerationJobOutput | null>((resolve, reject) => {
      setTimeout(() => {
        if (requestId !== this.currentRequestId) {
          resolve(null);
          return;
        }
        try {
          resolve(this.executeFallback(payload));
        } catch (err) {
          reject(err);
        }
      }, 0);
    });
  }
}

export const workerController = new ParticleWorkerController();
