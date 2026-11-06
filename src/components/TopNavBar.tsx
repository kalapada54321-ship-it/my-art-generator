import React, { useState } from 'react';
import {
  Sparkles,
  FilePlus,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  RotateCcw,
  HelpCircle,
  Download,
  Shuffle,
  Sliders,
  ChevronDown,
} from 'lucide-react';

interface TopNavBarProps {
  projectName: string;
  onRenameProjectInline: (name: string) => void;
  onNewProject: () => void;
  onOpenProjectModal: () => void;
  onSaveProject: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetAll: () => void;
  onRandomizeAll: () => void;
  onRandomizeTarget: (target: 'size' | 'position' | 'color' | 'distribution') => void;
  onOpenPresetsModal: () => void;
  onOpenHelpModal: () => void;
  onQuickExport: () => void;
  isGenerating: boolean;
  particleCount: number;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  projectName,
  onRenameProjectInline,
  onNewProject,
  onOpenProjectModal,
  onSaveProject,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetAll,
  onRandomizeAll,
  onRandomizeTarget,
  onOpenPresetsModal,
  onOpenHelpModal,
  onQuickExport,
  isGenerating,
  particleCount,
}) => {
  const [randMenuOpen, setRandMenuOpen] = useState(false);

  return (
    <header className="h-12 bg-[#14161B] border-b border-[#262932] px-3 flex items-center justify-between gap-2 shrink-0 z-30">
      {/* Left: Brand & Project Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#FBBF24] via-[#F59E0B] to-[#B45309] flex items-center justify-center shadow-sm shadow-[#F59E0B]/20 border border-[#FDE68A]/40">
            <Sparkles className="w-4 h-4 text-[#0D0E11]" />
          </div>
          <div className="leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold tracking-tight text-[#F3F4F6]">
                ParticleForge
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30 font-semibold">
                STUDIO
              </span>
            </div>
            <div className="text-[10px] text-[#6B7280] hidden xl:block mt-0.5">
              Vector Particle Art Engine
            </div>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-[#262932] hidden md:block" />

        {/* Editable Project Name */}
        <input
          type="text"
          value={projectName}
          onChange={(e) => onRenameProjectInline(e.target.value)}
          aria-label="Project Name"
          className="hidden lg:block w-44 px-2 py-1 text-[11px] font-medium bg-[#0D0E11] border border-[#262932] hover:border-[#374151] focus:border-[#F59E0B] focus:outline-none rounded text-[#E5E7EB] truncate"
        />
      </div>

      {/* Center: Project File Actions + History + Presets + Randomize */}
      <div className="flex items-center gap-1">
        {/* Project Actions */}
        <div className="flex items-center bg-[#0D0E11] border border-[#262932] rounded p-0.5">
          <button
            type="button"
            onClick={onNewProject}
            title="New Project"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#D1D5DB] hover:text-white hover:bg-[#1E2028] rounded transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span className="hidden md:inline">New</span>
          </button>
          <button
            type="button"
            onClick={onOpenProjectModal}
            title="Open Saved Project"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#D1D5DB] hover:text-white hover:bg-[#1E2028] rounded transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span className="hidden md:inline">Open</span>
          </button>
          <button
            type="button"
            onClick={onSaveProject}
            title="Save Project (Ctrl+S)"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#D1D5DB] hover:text-white hover:bg-[#1E2028] rounded transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="hidden md:inline">Save</span>
          </button>
        </div>

        {/* Undo / Redo / Reset */}
        <div className="flex items-center bg-[#0D0E11] border border-[#262932] rounded p-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-[#D1D5DB] hover:text-white hover:bg-[#1E2028] disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 text-[#D1D5DB] hover:text-white hover:bg-[#1E2028] disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <div className="h-3.5 w-[1px] bg-[#262932] mx-0.5" />
          <button
            type="button"
            onClick={onResetAll}
            title="Reset All Settings to Default"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#D1D5DB] hover:text-white hover:bg-[#1E2028] rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span className="hidden xl:inline">Reset</span>
          </button>
        </div>

        {/* Presets Button */}
        <button
          type="button"
          onClick={onOpenPresetsModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium bg-[#0D0E11] border border-[#262932] hover:border-[#F59E0B]/60 text-[#E5E7EB] hover:text-[#FBBF24] rounded transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Presets (12)</span>
        </button>

        {/* Randomize Split Button */}
        <div className="relative flex items-center bg-[#0D0E11] border border-[#262932] rounded">
          <button
            type="button"
            onClick={onRandomizeAll}
            title="Randomize All (Seed, Position, Size, Distribution & Color Variation while preserving subject)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-[#E5E7EB] hover:text-[#FBBF24] hover:bg-[#1E2028] rounded-l transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="hidden sm:inline">Randomize All</span>
          </button>
          <button
            type="button"
            onClick={() => setRandMenuOpen((o) => !o)}
            title="Targeted Randomize Options"
            className="px-1.5 py-1.5 border-l border-[#262932] text-[#9CA3AF] hover:text-white hover:bg-[#1E2028] rounded-r transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {randMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setRandMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#181A20] border border-[#2E323E] rounded-md shadow-xl py-1 z-50">
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Randomize Specific
                </div>
                {(
                  [
                    { id: 'size', label: 'Randomize Only Size' },
                    { id: 'position', label: 'Randomize Only Position' },
                    { id: 'color', label: 'Randomize Only Color' },
                    { id: 'distribution', label: 'Randomize Only Distribution' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onRandomizeTarget(item.id);
                      setRandMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-[#E5E7EB] hover:bg-[#262932] hover:text-[#FBBF24] flex items-center gap-2 transition-colors"
                  >
                    <Shuffle className="w-3 h-3 text-[#F59E0B]" />
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Particle Badge, Help, Export Artwork CTA */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0D0E11] border border-[#262932] text-[11px] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isGenerating ? 'bg-[#38BDF8] animate-pulse' : 'bg-[#10B981]'
            }`}
          />
          <span className="text-[#9CA3AF]">Particles:</span>
          <span className="text-[#FBBF24] font-semibold">
            {particleCount.toLocaleString()}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenHelpModal}
          title="Help & Vector Workflow Guide"
          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-[#0D0E11] border border-[#262932] hover:border-[#374151] text-[#D1D5DB] hover:text-white rounded transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#9CA3AF]" />
          <span className="hidden md:inline">Help</span>
        </button>

        <button
          type="button"
          onClick={onQuickExport}
          disabled={isGenerating || particleCount === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-[#F59E0B] hover:bg-[#FBBF24] text-[#0D0E11] rounded shadow-sm shadow-[#F59E0B]/20 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Export Artwork</span>
        </button>
      </div>
    </header>
  );
};
