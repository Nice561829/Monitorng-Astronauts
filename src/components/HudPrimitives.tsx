import React from 'react';
import { AlertTriangle, Minus, Plus } from 'lucide-react';
import { SystemSeverity } from '../types/telemetry';

interface HudCardProps {
  title: string;
  tier?: 'default' | 'focused' | 'warning' | 'emergency';
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const HudCard: React.FC<HudCardProps> = ({
  title,
  tier = 'default',
  rightSlot,
  children,
  className = '',
}) => {
  const tierClass =
    tier === 'emergency'
      ? 'hud-panel-emergency'
      : tier === 'warning'
        ? 'hud-panel-warning'
        : tier === 'focused'
          ? 'hud-panel-focused'
          : 'hud-panel';

  return (
    <section className={`${tierClass} flex flex-col ${className}`}>
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E2E8F0]">
        <h2 className="label-caps text-[#475569] truncate">{title}</h2>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </header>
      <div className="p-4 flex-1 flex flex-col">{children}</div>
    </section>
  );
};

interface StatusChipProps {
  status: SystemSeverity;
  label?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label }) => {
  if (status === 'emergency') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEE2E2] border border-[#EF4444] text-[#B91C1C] label-caps whitespace-nowrap shrink-0">
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#DC2626] emergency-beacon shrink-0"
          aria-hidden="true"
        />
        <span>{label ?? 'EMERGENCY'}</span>
      </span>
    );
  }

  if (status === 'advisory') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] label-caps whitespace-nowrap shrink-0">
        <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span>{label ?? 'ADVISORY'}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E0F2FE] border border-[#38BDF8] text-[#0369A1] label-caps whitespace-nowrap shrink-0">
      <span
        className="w-1.5 h-1.5 rounded-full bg-[#0284C7] shrink-0"
        aria-hidden="true"
      />
      <span>{label ?? 'NOMINAL'}</span>
    </span>
  );
};

interface EarthLatencyPillProps {
  rttFormatted: string;
  degraded?: boolean;
}

export const EarthLatencyPill: React.FC<EarthLatencyPillProps> = ({
  rttFormatted,
  degraded = false,
}) => {
  return (
    <div
      className="inline-flex items-center gap-2.5 px-3 py-1 rounded-lg bg-white border border-[#C7D2FE] whitespace-nowrap shrink-0"
      title="Unidirectional & Round-Trip Light-Speed Radio Transit Delay"
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] shrink-0"
        aria-hidden="true"
      />
      <span className="label-caps text-[#475569]">EARTH COMM LATENCY</span>
      <span
        className={`telemetry-sm font-semibold ${
          degraded ? 'text-[#B45309]' : 'text-[#0284C7]'
        }`}
      >
        {rttFormatted}
      </span>
    </div>
  );
};

interface HudToggleProps {
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

export const HudToggle: React.FC<HudToggleProps> = ({
  label,
  sublabel,
  checked,
  onChange,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[#E2E8F0] last:border-b-0 min-h-[44px]">
      <div className="min-w-0">
        <div className="text-sm font-medium text-[#0F172A] truncate">{label}</div>
        {sublabel && (
          <div className="text-xs font-mono text-[#64748B] truncate">
            {sublabel}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-[5px] border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7] ${
          checked
            ? 'bg-[#0284C7] border-[#0284C7]'
            : 'bg-[#E2E8F0] border-[#CBD5E1]'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-[3px] transition-transform duration-150 ${
            checked
              ? 'translate-x-6 bg-white shadow-sm'
              : 'translate-x-1 bg-[#64748B]'
          }`}
        />
      </button>
    </div>
  );
};

interface HudScrubberProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
}

export const HudScrubber: React.FC<HudScrubberProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}) => {
  const clamp = (n: number) =>
    Number(Math.min(max, Math.max(min, n)).toFixed(2));

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="label-caps text-[#475569]">{label}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={`Decrease ${label}`}
            onClick={() => onChange(clamp(value - step))}
            className="w-7 h-7 flex items-center justify-center rounded-[4px] bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0284C7] hover:border-[#0284C7] transition-colors focus-visible:outline-2 focus-visible:outline-[#0284C7]"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="hud-trough px-2.5 py-1 min-w-[82px] text-right focus-within:border-[#0284C7]">
            <span className="telemetry-sm font-semibold text-[#0284C7]">
              {value.toFixed(step < 1 ? 1 : 0)}
            </span>
            <span className="text-[11px] font-mono text-[#64748B] ml-1">
              {unit}
            </span>
          </div>
          <button
            type="button"
            aria-label={`Increase ${label}`}
            onClick={() => onChange(clamp(value + step))}
            className="w-7 h-7 flex items-center justify-center rounded-[4px] bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0284C7] hover:border-[#0284C7] transition-colors focus-visible:outline-2 focus-visible:outline-[#0284C7]"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
          className="hud-scrubber w-full"
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-[#64748B] tabular-nums">
        <span>
          {min} {unit}
        </span>
        <span>
          {((min + max) / 2).toFixed(step < 1 ? 1 : 0)} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
};
