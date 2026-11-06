import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { CenterViewport } from './components/CenterViewport';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import {
  HelpGuideModal,
  PresetsModal,
  ProjectManagerModal,
} from './components/StudioModals';
import { TopNavBar } from './components/TopNavBar';
import { generateSampleImage } from './engine/SampleGenerator';
import { workerController } from './engine/WorkerClient';
import { generateEditableEPS } from './exporters/EPSExporter';
import { generateIllustratorJSXScript } from './exporters/IllustratorBridge';
import { generateEditableVectorPDF } from './exporters/PDFExporter';
import {
  generateHighResRasterBlob,
  triggerFileDownload,
} from './exporters/RasterExporter';
import { generateEditableSVG } from './exporters/SVGExporter';
import {
  createHistoryStack,
  HistoryStack,
  pushHistoryState,
  randomizeAllSettings,
  randomizeColorOnly,
  randomizeDistributionOnly,
  randomizePositionOnly,
  randomizeSizeOnly,
  redoHistoryState,
  undoHistoryState,
} from './managers/HistoryManager';
import {
  applyPresetToConfig,
  BUILTIN_PRESETS,
  deleteCustomPreset,
  loadCustomPresets,
  saveCustomPreset,
} from './managers/PresetManager';
import {
  deleteProjectRecord,
  duplicateProjectRecord,
  listSavedProjects,
  parsePortableProject,
  renameProjectRecord,
  saveProjectRecord,
  serializePortableProject,
} from './managers/ProjectManager';
import {
  AnalyzedImageBuffer,
  DEFAULT_STUDIO_CONFIG,
  ParticleGenerationResult,
  ProcessingQuality,
  SavedProjectRecord,
  SourceImageMetadata,
  StudioConfig,
  StudioPreset,
} from './types/studio';
import {
  decodeImageDataUrl,
  decodeUploadedImageFile,
} from './utils/imageUploadValidator';

export function App() {
  const [projectName, setProjectName] = useState<string>('Imperial Phoenix Golden Dust');
  const [history, setHistory] = useState<HistoryStack<StudioConfig>>(() =>
    createHistoryStack(DEFAULT_STUDIO_CONFIG)
  );
  const config = history.present;

  // Source image state
  const [sourceImage, setSourceImage] = useState<SourceImageMetadata | null>(null);
  const [sourceImageElement, setSourceImageElement] = useState<HTMLImageElement | null>(null);
  const sourceBufferRef = useRef<{
    rgba: Uint8ClampedArray;
    width: number;
    height: number;
  } | null>(null);

  // Generated output state
  const [particleResult, setParticleResult] = useState<ParticleGenerationResult | null>(null);
  const [analyzedBuffer, setAnalyzedBuffer] = useState<AnalyzedImageBuffer | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeQuality, setActiveQuality] = useState<ProcessingQuality>('final');
  const [lockFinalQuality, setLockFinalQuality] = useState<boolean>(false);

  // Modals & notifications
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [customPresets, setCustomPresets] = useState<StudioPreset[]>(() =>
    loadCustomPresets()
  );
  const [savedProjects, setSavedProjects] = useState<SavedProjectRecord[]>([]);
  const [toast, setToast] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const finalQualityTimerRef = useRef<number | null>(null);

  const showToast = useCallback((type: 'error' | 'success', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  }, []);

  // Load saved projects from IndexedDB
  const refreshProjectsList = useCallback(async () => {
    const list = await listSavedProjects();
    setSavedProjects(list);
  }, []);

  useEffect(() => {
    refreshProjectsList();
  }, [refreshProjectsList]);

  // Core particle generation trigger
  const triggerParticleGeneration = useCallback(
    async (targetConfig: StudioConfig, quality: ProcessingQuality) => {
      const srcBuf = sourceBufferRef.current;
      if (!srcBuf) {
        setParticleResult(null);
        setAnalyzedBuffer(null);
        return;
      }

      setIsGenerating(true);
      setActiveQuality(quality);

      // Analysis resolution scales with quality for fast slider dragging and high-detail final output
      const maxAnalysisSide = quality === 'preview' ? 260 : 420;
      const aspect = targetConfig.artboard.width / targetConfig.artboard.height;
      const analysisW =
        aspect >= 1 ? maxAnalysisSide : Math.max(64, Math.round(maxAnalysisSide * aspect));
      const analysisH =
        aspect >= 1 ? Math.max(64, Math.round(maxAnalysisSide / aspect)) : maxAnalysisSide;

      try {
        const output = await workerController.runGeneration(
          srcBuf.rgba,
          srcBuf.width,
          srcBuf.height,
          analysisW,
          analysisH,
          targetConfig,
          quality
        );

        if (output) {
          setParticleResult(output.result);
          setAnalyzedBuffer(output.analyzedBuffer);
          setIsGenerating(false);
        }
      } catch (err) {
        setIsGenerating(false);
        const msg = err instanceof Error ? err.message : 'Particle generation failed.';
        showToast('error', msg);
      }
    },
    [showToast]
  );

  // Load initial studio sample subject on mount
  const handleSelectSample = useCallback(
    async (sampleId: string) => {
      try {
        const sampleMeta = generateSampleImage(sampleId);
        const decoded = await decodeImageDataUrl(
          sampleMeta.dataUrl,
          sampleMeta.name,
          sampleMeta.fileSize,
          sampleMeta.mimeType,
          true,
          sampleId
        );
        sourceBufferRef.current = {
          rgba: decoded.rgbaBuffer,
          width: decoded.bufferWidth,
          height: decoded.bufferHeight,
        };
        setSourceImage(decoded.metadata);
        setSourceImageElement(decoded.imageElement);
        await triggerParticleGeneration(config, 'final');
      } catch (err) {
        showToast(
          'error',
          err instanceof Error ? err.message : 'Failed to initialize sample subject.'
        );
      }
    },
    [config, showToast, triggerParticleGeneration]
  );

  useEffect(() => {
    handleSelectSample('phoenix');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update configuration with live preview quality while dragging & final quality on commit
  const handleUpdateConfig = useCallback(
    (updater: (prev: StudioConfig) => StudioConfig, isDragging = false) => {
      setHistory((prevStack) => {
        const nextConfig = updater(prevStack.present);

        if (finalQualityTimerRef.current) {
          window.clearTimeout(finalQualityTimerRef.current);
          finalQualityTimerRef.current = null;
        }

        if (isDragging && !lockFinalQuality) {
          // Update present in place during continuous slider drag so we don't spam history stack
          triggerParticleGeneration(nextConfig, 'preview');
          finalQualityTimerRef.current = window.setTimeout(() => {
            triggerParticleGeneration(nextConfig, 'final');
          }, 260);
          return {
            ...prevStack,
            present: nextConfig,
          };
        } else {
          // Commit to Undo/Redo history stack and run Final Quality
          triggerParticleGeneration(nextConfig, 'final');
          return pushHistoryState(prevStack, nextConfig);
        }
      });
    },
    [lockFinalQuality, triggerParticleGeneration]
  );

  // Handle user file upload (Drag & drop, File input, or Clipboard Paste)
  const handleUploadFile = useCallback(
    async (file: File) => {
      try {
        const decoded = await decodeUploadedImageFile(file);
        sourceBufferRef.current = {
          rgba: decoded.rgbaBuffer,
          width: decoded.bufferWidth,
          height: decoded.bufferHeight,
        };
        setSourceImage(decoded.metadata);
        setSourceImageElement(decoded.imageElement);
        const cleanTitle = file.name.replace(/\.[^.]+$/, '');
        setProjectName(`${cleanTitle} Particle Art`);
        handleUpdateConfig((prev) => ({
          ...prev,
          export: {
            ...prev.export,
            filename: `${cleanTitle.toLowerCase().replace(/[^a-z0-9-_]+/g, '-')}-particles`,
          },
        }));
        showToast(
          'success',
          `Loaded "${file.name}" (${decoded.metadata.width}×${decoded.metadata.height} px)`
        );
      } catch (err) {
        showToast(
          'error',
          err instanceof Error ? err.message : 'Could not load the selected image file.'
        );
      }
    },
    [handleUpdateConfig, showToast]
  );

  // Remove current image
  const handleRemoveImage = useCallback(() => {
    sourceBufferRef.current = null;
    setSourceImage(null);
    setSourceImageElement(null);
    setParticleResult(null);
    setAnalyzedBuffer(null);
    showToast('success', 'Removed source image. Upload or select a subject to generate particles.');
  }, [showToast]);

  // Global Clipboard Paste support (Ctrl+V)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleUploadFile(file);
            return;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleUploadFile]);

  // Undo & Redo handlers
  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const nextStack = undoHistoryState(prev);
      triggerParticleGeneration(nextStack.present, 'final');
      return nextStack;
    });
  }, [triggerParticleGeneration]);

  const handleRedo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const nextStack = redoHistoryState(prev);
      triggerParticleGeneration(nextStack.present, 'final');
      return nextStack;
    });
  }, [triggerParticleGeneration]);

  // Save Project to IndexedDB
  const handleQuickSaveProject = useCallback(
    async (customName?: string) => {
      const targetName = customName || projectName;
      await saveProjectRecord({
        name: targetName,
        config,
        sourceImage,
        particleCount: particleResult?.stats.totalCount || 0,
      });
      await refreshProjectsList();
      showToast('success', `Project "${targetName}" saved locally to IndexedDB.`);
    },
    [config, particleResult?.stats.totalCount, projectName, refreshProjectsList, showToast, sourceImage]
  );

  // Global Keyboard Shortcuts: Ctrl+Z, Ctrl+Shift+Z / Ctrl+Y, Ctrl+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (!isCtrlOrMeta) return;

      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (key === 's') {
        e.preventDefault();
        handleQuickSaveProject();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo, handleQuickSaveProject]);

  // Randomize handlers
  const handleRandomizeAll = useCallback(() => {
    handleUpdateConfig((prev) => randomizeAllSettings(prev));
    showToast('success', 'Randomized seed, size, distribution, and color variations.');
  }, [handleUpdateConfig, showToast]);

  const handleRandomizeTarget = useCallback(
    (target: 'size' | 'position' | 'color' | 'distribution') => {
      handleUpdateConfig((prev) => {
        if (target === 'size') return randomizeSizeOnly(prev);
        if (target === 'position') return randomizePositionOnly(prev);
        if (target === 'color') return randomizeColorOnly(prev);
        return randomizeDistributionOnly(prev);
      });
      showToast('success', `Randomized particle ${target} parameters.`);
    },
    [handleUpdateConfig, showToast]
  );

  // Export Artwork handler supporting SVG, EPS, AI-Workflow, PDF, PNG, JPG
  const handleExportArtwork = useCallback(async () => {
    if (!particleResult || particleResult.stats.totalCount === 0) {
      setExportStatus({
        type: 'error',
        message: 'Cannot export before particles are generated.',
      });
      return;
    }

    if (isGenerating) {
      setExportStatus({
        type: 'error',
        message: 'Please wait for particle generation to finish before exporting.',
      });
      return;
    }

    setIsExporting(true);
    setExportStatus(null);

    const baseName =
      (config.export.filename || 'particleforge-artwork')
        .trim()
        .replace(/\.(svg|eps|ai|pdf|png|jpg|jpeg)$/i, '') || 'particleforge-artwork';
    const fmt = config.export.format;

    try {
      // Ensure we export from Final Quality particle data
      let finalResult = particleResult;
      if (activeQuality === 'preview' && sourceBufferRef.current) {
        const out = await workerController.runGeneration(
          sourceBufferRef.current.rgba,
          sourceBufferRef.current.width,
          sourceBufferRef.current.height,
          420,
          420,
          config,
          'final'
        );
        if (out) {
          finalResult = out.result;
          setParticleResult(out.result);
          setActiveQuality('final');
        }
      }

      if (fmt === 'svg') {
        const svgContent = generateEditableSVG(finalResult, config);
        triggerFileDownload(svgContent, `${baseName}.svg`, 'image/svg+xml;charset=utf-8');
        setExportStatus({
          type: 'success',
          message: `Exported editable SVG (${finalResult.stats.totalCount.toLocaleString()} independent vector elements).`,
        });
      } else if (fmt === 'eps') {
        const epsContent = generateEditableEPS(finalResult, config);
        triggerFileDownload(epsContent, `${baseName}.eps`, 'application/postscript');
        setExportStatus({
          type: 'success',
          message: `Exported Encapsulated PostScript (${baseName}.eps) with vector paths.`,
        });
      } else if (fmt === 'pdf') {
        const pdfContent = generateEditableVectorPDF(finalResult, config);
        triggerFileDownload(pdfContent, `${baseName}.pdf`, 'application/pdf');
        setExportStatus({
          type: 'success',
          message: `Exported editable Vector PDF 1.4 (${baseName}.pdf).`,
        });
      } else if (fmt === 'ai-workflow') {
        const vectorFileName = `${baseName}-illustrator-layers.svg`;
        const jsxFileName = `${baseName}-save-native-ai.jsx`;
        const svgContent = generateEditableSVG(finalResult, {
          ...config,
          export: { ...config.export, groupingMode: 'by-layer' },
        });
        const jsxContent = generateIllustratorJSXScript(
          finalResult,
          config,
          vectorFileName
        );
        triggerFileDownload(svgContent, vectorFileName, 'image/svg+xml;charset=utf-8');
        setTimeout(() => {
          triggerFileDownload(jsxContent, jsxFileName, 'text/javascript;charset=utf-8');
        }, 250);
        setExportStatus({
          type: 'success',
          message: `Exported Layered Vector (${vectorFileName}) + Adobe Illustrator Automation Script (${jsxFileName}).`,
        });
      } else if (fmt === 'png' || fmt === 'jpg') {
        const blob = await generateHighResRasterBlob(
          finalResult,
          config,
          fmt,
          sourceImageElement
        );
        triggerFileDownload(
          blob,
          `${baseName}.${fmt}`,
          fmt === 'png' ? 'image/png' : 'image/jpeg'
        );
        setExportStatus({
          type: 'success',
          message: `Exported high-resolution ${fmt.toUpperCase()} (${finalResult.artboardWidthPx}×${finalResult.artboardHeightPx} px).`,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed unexpectedly.';
      setExportStatus({ type: 'error', message: msg });
      showToast('error', msg);
    } finally {
      setIsExporting(false);
    }
  }, [activeQuality, config, isGenerating, particleResult, showToast, sourceImageElement]);

  const handleDownloadIllustratorJsxOnly = useCallback(() => {
    if (!particleResult) return;
    const baseName = (config.export.filename || 'particleforge-artwork').replace(
      /\.(svg|eps|ai|jsx)$/i,
      ''
    );
    const jsx = generateIllustratorJSXScript(
      particleResult,
      config,
      `${baseName}-illustrator-layers.svg`
    );
    triggerFileDownload(
      jsx,
      `${baseName}-save-native-ai.jsx`,
      'text/javascript;charset=utf-8'
    );
    showToast('success', 'Downloaded Adobe Illustrator .JSX Native .AI Automation Script.');
  }, [config, particleResult, showToast]);

  // Load a saved project record
  const handleLoadProjectRecord = useCallback(
    async (record: SavedProjectRecord) => {
      setProjectName(record.name);
      setHistory(createHistoryStack(record.config));
      if (record.sourceImage && record.sourceImage.dataUrl) {
        try {
          const decoded = await decodeImageDataUrl(
            record.sourceImage.dataUrl,
            record.sourceImage.name,
            record.sourceImage.fileSize,
            record.sourceImage.mimeType,
            record.sourceImage.isSample,
            record.sourceImage.sampleId
          );
          sourceBufferRef.current = {
            rgba: decoded.rgbaBuffer,
            width: decoded.bufferWidth,
            height: decoded.bufferHeight,
          };
          setSourceImage(decoded.metadata);
          setSourceImageElement(decoded.imageElement);
          await triggerParticleGeneration(record.config, 'final');
          showToast('success', `Loaded project "${record.name}".`);
        } catch {
          showToast('error', 'Could not restore project source image.');
        }
      } else {
        await triggerParticleGeneration(record.config, 'final');
      }
    },
    [showToast, triggerParticleGeneration]
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0D0E11] text-[#F3F4F6] overflow-hidden">
      {/* Top Studio Navigation Bar */}
      <TopNavBar
        projectName={projectName}
        onRenameProjectInline={setProjectName}
        onNewProject={() => {
          setProjectName('Untitled Particle Artwork');
          setHistory(createHistoryStack(DEFAULT_STUDIO_CONFIG));
          handleSelectSample('phoenix');
          showToast('success', 'Started a fresh ParticleForge Studio project.');
        }}
        onOpenProjectModal={() => setProjectsOpen(true)}
        onSaveProject={() => handleQuickSaveProject()}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetAll={() => {
          handleUpdateConfig(() => DEFAULT_STUDIO_CONFIG);
          showToast('success', 'All studio settings reset to Golden Dust defaults.');
        }}
        onRandomizeAll={handleRandomizeAll}
        onRandomizeTarget={handleRandomizeTarget}
        onOpenPresetsModal={() => setPresetsOpen(true)}
        onOpenHelpModal={() => setHelpOpen(true)}
        onQuickExport={handleExportArtwork}
        isGenerating={isGenerating}
        particleCount={particleResult?.stats.totalCount || 0}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed top-14 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-md border shadow-xl text-[12px] backdrop-blur-md ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-600/60 text-red-200'
              : 'bg-[#181A20]/95 border-[#10B981]/50 text-[#E5E7EB]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-0.5 text-[#9CA3AF] hover:text-white ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main 3-Column Desktop Studio Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar — Image & Particle Generation Controls */}
        <LeftSidebar
          config={config}
          sourceImage={sourceImage}
          onUpdateConfig={handleUpdateConfig}
          onUploadFile={handleUploadFile}
          onSelectSample={handleSelectSample}
          onRemoveImage={handleRemoveImage}
          onRandomizeTarget={handleRandomizeTarget}
          onApplyGoldenDustEffectPreset={() => {
            const goldenPreset = BUILTIN_PRESETS[0];
            handleUpdateConfig((prev) => applyPresetToConfig(prev, goldenPreset));
            showToast('success', 'Applied signature Golden Dust preset.');
          }}
        />

        {/* Center Workspace — Interactive Live Canvas Preview */}
        <CenterViewport
          config={config}
          particleResult={particleResult}
          analyzedBuffer={analyzedBuffer}
          sourceImage={sourceImage}
          sourceImageElement={sourceImageElement}
          isGenerating={isGenerating}
          activeQuality={activeQuality}
          lockFinalQuality={lockFinalQuality}
          onToggleLockFinalQuality={(locked) => {
            setLockFinalQuality(locked);
            if (locked) {
              triggerParticleGeneration(config, 'final');
            }
          }}
          onCancelGeneration={() => {
            workerController.cancelCurrentJob();
            setIsGenerating(false);
            showToast('success', 'Cancelled ongoing particle computation.');
          }}
        />

        {/* Right Sidebar — Artboard, Layer Hierarchy, Statistics & Vector/Raster Export */}
        <RightSidebar
          config={config}
          particleResult={particleResult}
          onUpdateConfig={handleUpdateConfig}
          onExportArtwork={handleExportArtwork}
          onDownloadIllustratorJsxOnly={handleDownloadIllustratorJsxOnly}
          isExporting={isExporting}
          exportStatus={exportStatus}
        />
      </div>

      {/* Studio Modals */}
      <PresetsModal
        isOpen={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        customPresets={customPresets}
        onApplyPreset={(preset) => {
          handleUpdateConfig((prev) => applyPresetToConfig(prev, preset));
          showToast('success', `Applied "${preset.name}" preset.`);
        }}
        onSaveCustomPreset={(name) => {
          const updated = saveCustomPreset(name, config);
          setCustomPresets(updated);
          showToast('success', `Saved custom preset "${name}".`);
        }}
        onDeleteCustomPreset={(id) => {
          const updated = deleteCustomPreset(id);
          setCustomPresets(updated);
        }}
      />

      <ProjectManagerModal
        isOpen={projectsOpen}
        onClose={() => setProjectsOpen(false)}
        projects={savedProjects}
        currentProjectName={projectName}
        onSaveNewProject={(name) => {
          setProjectName(name);
          handleQuickSaveProject(name);
        }}
        onLoadProject={handleLoadProjectRecord}
        onDuplicateProject={async (id) => {
          await duplicateProjectRecord(id);
          await refreshProjectsList();
          showToast('success', 'Duplicated project.');
        }}
        onRenameProject={async (id, newName) => {
          await renameProjectRecord(id, newName);
          await refreshProjectsList();
        }}
        onDeleteProject={async (id) => {
          await deleteProjectRecord(id);
          await refreshProjectsList();
          showToast('success', 'Deleted project from local storage.');
        }}
        onExportPortableJson={() => {
          const jsonStr = serializePortableProject(projectName, config, sourceImage);
          const safeFile =
            projectName.toLowerCase().replace(/[^a-z0-9-_]+/g, '-') || 'project';
          triggerFileDownload(
            jsonStr,
            `${safeFile}.pforge.json`,
            'application/json;charset=utf-8'
          );
          showToast('success', 'Exported portable .pforge.json project file.');
        }}
        onImportPortableJson={async (file) => {
          try {
            const text = await file.text();
            const parsed = parsePortableProject(text);
            await handleLoadProjectRecord({
              id: `imported-${Date.now()}`,
              name: parsed.name,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              config: parsed.config,
              sourceImage: parsed.sourceImage,
              particleCount: 0,
            });
            setProjectsOpen(false);
          } catch (err) {
            showToast(
              'error',
              err instanceof Error ? err.message : 'Invalid portable project file.'
            );
          }
        }}
      />

      <HelpGuideModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
export default App;
