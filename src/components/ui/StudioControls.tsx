import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { hexToRgb, rgbToHex, sanitizeHex } from '../../utils/colorUtils';

interface AccordionSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  onResetSection?: () => void;
  children: React.ReactNode;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  subtitle,
  icon,
  badge,
  defaultOpen = true,
  onResetSection,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#262932] bg-[#16181D]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer hover:bg-[#1E2028] transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#9CA3AF]">
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
          {icon && <span className="text-[#F59E0B] shrink-0">{icon}</span>}
          <div className="truncate">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#E5E7EB]">
              {title}
            </span>
            {subtitle && (
              <span className="ml-2 text-[10px] text-[#6B7280] hidden sm:inline">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-[#22252E] text-[#FBBF24] border border-[#323644]">
              {badge}
            </span>
          )}
          {onResetSection && (
            <button
              type="button"
              title={`Reset ${title}`}
              onClick={(e) => {
                e.stopPropagation();
                onResetSection();
              }}
              className="p-1 text-[#6B7280] hover:text-[#F3F4F6] hover:bg-[#262932] rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {open && <div className="px-3.5 pb-3.5 pt-1 space-y-2.5">{children}</div>}
    </div>
  );
};

interface SliderNumericRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number, isDragging?: boolean) => void;
  disabled?: boolean;
  tooltip?: string;
}

export const SliderNumericRow: React.FC<SliderNumericRowProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  disabled = false,
  tooltip,
}) => {
  const [textVal, setTextVal] = useState<string>(String(value));
  const [isEditingText, setIsEditingText] = useState(false);

  useEffect(() => {
    if (!isEditingText) {
      setTextVal(String(Number(value.toFixed(step < 1 ? 2 : 0))));
    }
  }, [value, step, isEditingText]);

  const commitNumericInput = () => {
    setIsEditingText(false);
    const parsed = parseFloat(textVal);
    if (Number.isFinite(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped, false);
      setTextVal(String(Number(clamped.toFixed(step < 1 ? 2 : 0))));
    } else {
      setTextVal(String(value));
    }
  };

  return (
    <div
      className={`space-y-1 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      title={tooltip}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-medium text-[#9CA3AF] truncate">{label}</label>
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            value={textVal}
            min={min}
            max={max}
            step={step}
            onFocus={() => setIsEditingText(true)}
            onChange={(e) => {
              setTextVal(e.target.value);
              const parsed = parseFloat(e.target.value);
              if (Number.isFinite(parsed)) {
                const clamped = Math.max(min, Math.min(max, parsed));
                onChange(clamped, true);
              }
            }}
            onBlur={commitNumericInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitNumericInput();
              }
            }}
            className="w-16 px-1.5 py-0.5 text-right text-[11px] font-mono bg-[#0D0E11] border border-[#262932] focus:border-[#F59E0B] focus:outline-none rounded text-[#F3F4F6]"
          />
          {unit && <span className="text-[10px] font-mono text-[#6B7280] w-5">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.max(min, Math.min(max, value))}
        onChange={(e) => onChange(parseFloat(e.target.value), true)}
        onMouseUp={(e) => onChange(parseFloat((e.target as HTMLInputElement).value), false)}
        onTouchEnd={(e) => onChange(parseFloat((e.target as HTMLInputElement).value), false)}
        className="w-full studio-slider"
      />
    </div>
  );
};

interface ColorPickerHexRgbProps {
  label: string;
  hexValue: string;
  onChange: (newHex: string) => void;
  showRgbInputs?: boolean;
}

export const ColorPickerHexRgb: React.FC<ColorPickerHexRgbProps> = ({
  label,
  hexValue,
  onChange,
  showRgbInputs = false,
}) => {
  const validHex = sanitizeHex(hexValue);
  const rgb = hexToRgb(validHex);
  const [hexDraft, setHexDraft] = useState(validHex);

  useEffect(() => {
    setHexDraft(sanitizeHex(hexValue));
  }, [hexValue]);

  const handleRgbChange = (channel: 'r' | 'g' | 'b', valStr: string) => {
    const num = Math.max(0, Math.min(255, parseInt(valStr, 10) || 0));
    const nextRgb = { ...rgb, [channel]: num };
    onChange(rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-[#9CA3AF]">{label}</span>
        <div className="flex items-center gap-1.5">
          <label className="relative w-6 h-5 rounded border border-[#374151] overflow-hidden cursor-pointer shrink-0">
            <input
              type="color"
              value={validHex}
              onChange={(e) => onChange(sanitizeHex(e.target.value))}
              className="sr-only"
            />
            <span
              className="block w-full h-full"
              style={{ backgroundColor: validHex }}
            />
          </label>
          <input
            type="text"
            value={hexDraft}
            maxLength={7}
            onChange={(e) => {
              setHexDraft(e.target.value);
              if (/^#?[0-9A-Fa-f]{6}$/.test(e.target.value.trim())) {
                onChange(sanitizeHex(e.target.value));
              }
            }}
            onBlur={() => setHexDraft(validHex)}
            className="w-18 px-1.5 py-0.5 text-[11px] font-mono uppercase bg-[#0D0E11] border border-[#262932] focus:border-[#F59E0B] focus:outline-none rounded text-[#F3F4F6]"
          />
        </div>
      </div>

      {showRgbInputs && (
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          {(['r', 'g', 'b'] as const).map((ch) => (
            <div
              key={ch}
              className="flex items-center bg-[#0D0E11] border border-[#262932] rounded px-1.5 py-0.5"
            >
              <span className="text-[10px] font-mono uppercase text-[#6B7280] mr-1">
                {ch}
              </span>
              <input
                type="number"
                min={0}
                max={255}
                value={rgb[ch]}
                onChange={(e) => handleRgbChange(ch, e.target.value)}
                className="w-full text-right text-[11px] font-mono bg-transparent text-[#F3F4F6] focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ToggleSwitchRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const ToggleSwitchRow: React.FC<ToggleSwitchRowProps> = ({
  label,
  checked,
  onChange,
  description,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-[#D1D5DB]">{label}</div>
        {description && <div className="text-[10px] text-[#6B7280]">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border transition-colors ${
          checked
            ? 'bg-[#F59E0B] border-[#FBBF24]'
            : 'bg-[#0D0E11] border-[#323644]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform mt-[1px] ${
            checked ? 'translate-x-3' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};
