import React, { useRef, useState } from 'react';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  FolderOpen,
  Save,
  Copy,
  Edit3,
  Download,
  Upload,
  Check,
  HelpCircle,
  Layers,
  Keyboard,
} from 'lucide-react';
import { BUILTIN_PRESETS } from '../managers/PresetManager';
import { SavedProjectRecord, StudioPreset } from '../types/studio';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customPresets: StudioPreset[];
  onApplyPreset: (preset: StudioPreset) => void;
  onSaveCustomPreset: (name: string) => void;
  onDeleteCustomPreset: (id: string) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  customPresets,
  onApplyPreset,
  onSaveCustomPreset,
  onDeleteCustomPreset,
}) => {
  const [newPresetName, setNewPresetName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#16181D] border border-[#2E323E] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#14161B] border-b border-[#262932] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-[14px] font-bold text-[#F3F4F6]">
              Studio Preset Library (12 Built-In + Custom)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#9CA3AF] hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Save Current as Custom Preset Bar */}
        <div className="px-5 py-3 bg-[#0D0E11] border-b border-[#262932] flex items-center gap-2">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Save current settings as a custom preset..."
            className="flex-1 px-3 py-1.5 text-[12px] bg-[#16181D] border border-[#262932] focus:border-[#F59E0B] focus:outline-none rounded text-[#F3F4F6]"
          />
          <button
            type="button"
            onClick={() => {
              if (!newPresetName.trim()) return;
              onSaveCustomPreset(newPresetName.trim());
              setNewPresetName('');
            }}
            className="px-3 py-1.5 text-[11px] font-semibold bg-[#F59E0B] hover:bg-[#FBBF24] text-[#0D0E11] rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Custom Preset</span>
          </button>
        </div>

        {/* Preset Cards Grid */}
        <div className="p-5 overflow-y-auto space-y-5">
          {customPresets.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#FBBF24] mb-2.5">
                Your Custom Presets ({customPresets.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 rounded-md bg-[#0D0E11] border border-[#2E323E] hover:border-[#F59E0B] flex flex-col justify-between gap-2 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-semibold text-[#F3F4F6] truncate">
                          {preset.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteCustomPreset(preset.id)}
                          className="text-[#6B7280] hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-[#9CA3AF] mt-1">
                        {preset.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyPreset(preset);
                        onClose();
                      }}
                      className="w-full py-1 text-[11px] font-medium bg-[#22252E] hover:bg-[#F59E0B] hover:text-[#0D0E11] text-[#E5E7EB] rounded transition-colors cursor-pointer"
                    >
                      Apply Preset
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2.5">
              Built-In Studio Presets (12)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {BUILTIN_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    onApplyPreset(preset);
                    onClose();
                  }}
                  className="p-3 rounded-md bg-[#0D0E11] border border-[#262932] hover:border-[#F59E0B] cursor-pointer flex flex-col justify-between gap-2.5 group transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: preset.badgeColor }}
                        />
                        <span className="text-[12px] font-bold text-[#F3F4F6] group-hover:text-[#FBBF24] transition-colors">
                          {preset.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#16181D] text-[#9CA3AF] border border-[#262932]">
                        {preset.config.mode}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] mt-1.5 leading-snug">
                      {preset.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7280] pt-1 border-t border-[#1E2028]">
                    <span>Shape: {preset.config.shape?.shape || 'circle'}</span>
                    <span className="text-[#F59E0B] group-hover:underline">Apply →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedProjectRecord[];
  currentProjectName: string;
  onSaveNewProject: (name: string) => void;
  onLoadProject: (record: SavedProjectRecord) => void;
  onDuplicateProject: (id: string) => void;
  onRenameProject: (id: string, newName: string) => void;
  onDeleteProject: (id: string) => void;
  onExportPortableJson: () => void;
  onImportPortableJson: (file: File) => void;
}

export const ProjectManagerModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectName,
  onSaveNewProject,
  onLoadProject,
  onDuplicateProject,
  onRenameProject,
  onDeleteProject,
  onExportPortableJson,
  onImportPortableJson,
}) => {
  const [saveName, setSaveName] = useState(currentProjectName);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#16181D] border border-[#2E323E] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#14161B] border-b border-[#262932] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-[14px] font-bold text-[#F3F4F6]">
              Project Manager (IndexedDB Local Storage & Portable JSON)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#9CA3AF] hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Save Current & Portable JSON Actions */}
        <div className="p-4 bg-[#0D0E11] border-b border-[#262932] space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Project Name..."
              className="flex-1 px-3 py-1.5 text-[12px] bg-[#16181D] border border-[#262932] focus:border-[#F59E0B] focus:outline-none rounded text-[#F3F4F6]"
            />
            <button
              type="button"
              onClick={() => onSaveNewProject(saveName || currentProjectName)}
              className="px-3.5 py-1.5 text-[11px] font-semibold bg-[#F59E0B] hover:bg-[#FBBF24] text-[#0D0E11] rounded flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save to IndexedDB</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#1E2028]">
            <span className="text-[11px] text-[#9CA3AF]">
              Portable Project File (<code className="text-[#FBBF24]">.pforge.json</code>)
            </span>
            <div className="flex items-center gap-2">
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportPortableJson(f);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="px-2.5 py-1 text-[11px] font-medium bg-[#22252E] hover:bg-[#2C303C] text-[#E5E7EB] rounded border border-[#323644] flex items-center gap-1.5"
              >
                <Upload className="w-3 h-3 text-[#F59E0B]" />
                <span>Import JSON Project</span>
              </button>
              <button
                type="button"
                onClick={onExportPortableJson}
                className="px-2.5 py-1 text-[11px] font-medium bg-[#22252E] hover:bg-[#2C303C] text-[#E5E7EB] rounded border border-[#323644] flex items-center gap-1.5"
              >
                <Download className="w-3 h-3 text-[#F59E0B]" />
                <span>Export JSON Project</span>
              </button>
            </div>
          </div>
        </div>

        {/* Saved Projects List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-[12px] text-[#6B7280]">
              No locally saved projects yet. Click &ldquo;Save to IndexedDB&rdquo; above to store a reproducible snapshot.
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                className="p-3 rounded bg-[#0D0E11] border border-[#262932] hover:border-[#374151] flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  {editingId === proj.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="px-2 py-0.5 text-[12px] bg-[#16181D] border border-[#F59E0B] rounded text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onRenameProject(proj.id, editingName);
                          setEditingId(null);
                        }}
                        className="p-1 text-[#10B981] hover:text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-[12px] font-semibold text-[#F3F4F6] truncate">
                      {proj.name}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-[#9CA3AF] mt-0.5">
                    Mode: {proj.config.mode} • {proj.particleCount.toLocaleString()} particles •
                    Seed: {proj.config.distribution.seed} •{' '}
                    {new Date(proj.updatedAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadProject(proj);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-[#F59E0B] hover:bg-[#FBBF24] text-[#0D0E11] rounded cursor-pointer"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    title="Rename Project"
                    onClick={() => {
                      setEditingId(proj.id);
                      setEditingName(proj.name);
                    }}
                    className="p-1.5 text-[#9CA3AF] hover:text-white bg-[#16181D] border border-[#262932] rounded"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Duplicate Project"
                    onClick={() => onDuplicateProject(proj.id)}
                    className="p-1.5 text-[#9CA3AF] hover:text-white bg-[#16181D] border border-[#262932] rounded"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Delete Project"
                    onClick={() => onDeleteProject(proj.id)}
                    className="p-1.5 text-[#9CA3AF] hover:text-red-400 bg-[#16181D] border border-[#262932] rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#16181D] border border-[#2E323E] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-3.5 bg-[#14161B] border-b border-[#262932] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-[14px] font-bold text-[#F3F4F6]">
              ParticleForge Studio — Vector Workflow & Documentation
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#9CA3AF] hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-[12px] text-[#D1D5DB] leading-relaxed">
          <div className="p-3.5 rounded bg-[#0D0E11] border border-[#262932] space-y-1.5">
            <h3 className="text-[12px] font-bold text-[#FBBF24] flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Editable Vector Architecture for Adobe Illustrator & Stock Contributors</span>
            </h3>
            <p className="text-[11px] text-[#9CA3AF]">
              Every particle generated by ParticleForge Studio is exported as an independent,
              non-flattened vector element (<code className="text-[#E5E7EB]">&lt;circle&gt;</code>,{' '}
              <code className="text-[#E5E7EB]">&lt;polygon&gt;</code>, PostScript arc/path, or PDF
              Bezier path). Vector exports are organized into 5 logical groups:{' '}
              <strong className="text-[#E5E7EB]">
                Background, Glow Effects, Scattered Particles, Main Particles, and Edge Particles
              </strong>
              .
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded bg-[#0D0E11] border border-[#262932]">
              <div className="font-bold text-[#F3F4F6] mb-1">4 Generation Modes</div>
              <ul className="text-[11px] text-[#9CA3AF] space-y-1 list-disc list-inside">
                <li>
                  <strong className="text-[#E5E7EB]">Image-Based:</strong> Stratified luminance +
                  detail importance sampling.
                </li>
                <li>
                  <strong className="text-[#E5E7EB]">Uniform Grid:</strong> Hexagonal or orthogonal
                  halftone vector screens.
                </li>
                <li>
                  <strong className="text-[#E5E7EB]">Random Dust:</strong> Seeded Monte Carlo
                  rejection sampling.
                </li>
                <li>
                  <strong className="text-[#E5E7EB]">Edge Contours:</strong> Sobel gradient
                  boundary detection.
                </li>
              </ul>
            </div>

            <div className="p-3 rounded bg-[#0D0E11] border border-[#262932]">
              <div className="font-bold text-[#F3F4F6] mb-1 flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Keyboard Shortcuts</span>
              </div>
              <ul className="text-[11px] font-mono text-[#9CA3AF] space-y-1">
                <li>
                  <strong className="text-[#FBBF24]">Ctrl + Z:</strong> Undo setting change
                </li>
                <li>
                  <strong className="text-[#FBBF24]">Ctrl + Shift + Z:</strong> Redo setting change
                </li>
                <li>
                  <strong className="text-[#FBBF24]">Ctrl + S:</strong> Save Project to IndexedDB
                </li>
                <li>
                  <strong className="text-[#FBBF24]">Ctrl + V:</strong> Paste Image from Clipboard
                </li>
                <li>
                  <strong className="text-[#FBBF24]">Mouse Wheel:</strong> Zoom Preview Canvas
                </li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded bg-[#0D0E11] border border-[#262932] space-y-1.5">
            <div className="font-bold text-[#F3F4F6]">
              Native Adobe Illustrator (.AI) Workflow
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              Because native <code className="text-[#E5E7EB]">.ai</code> is a proprietary Adobe
              binary container, ParticleForge Studio never renames a PNG or SVG to{' '}
              <code className="text-[#E5E7EB]">.ai</code>. Instead, select{' '}
              <strong className="text-[#FBBF24]">Illustrator (.AI)</strong> in the Export panel to
              download both the layered editable vector file and a custom{' '}
              <code className="text-[#FBBF24]">.jsx</code> ExtendScript. In Adobe Illustrator, run{' '}
              <em>File &gt; Scripts &gt; Other Script...</em> to automatically promote all particle
              groups into native Illustrator Layers and save a genuine{' '}
              <code className="text-[#E5E7EB]">.ai</code> document.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
