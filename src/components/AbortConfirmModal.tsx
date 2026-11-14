import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AbortConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmAbort: () => void;
}

export const AbortConfirmModal: React.FC<AbortConfirmModalProps> = ({
  open,
  onClose,
  onConfirmAbort,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="abort-dialog-title"
    >
      <div className="hud-panel-emergency w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5 text-[#DC2626]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 id="abort-dialog-title" className="text-base font-semibold">
              Confirm Mission Abort Override
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-[4px] text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-sm text-[#334155] leading-relaxed">
          Activating the abort override immediately safes main propulsion
          valves, isolates non-essential power buses, and transitions all
          telemetry channels to emergency recovery mode.
        </p>

        <div className="mt-4 hud-trough p-3 font-mono text-xs text-[#475569] space-y-1">
          <div>MODE: FREE-RETURN TRAJECTORY LOCK</div>
          <div>BUS ISOLATION: KILOPOWER STANDBY · ECLSS PRIORITY</div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[4px] border border-[#CBD5E1] bg-white text-[#334155] text-xs font-semibold hover:border-[#0284C7] hover:text-[#0284C7] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmAbort}
            className="px-4 py-2 rounded-[4px] bg-[#DC2626] text-white text-xs font-semibold shadow-sm hover:bg-[#B91C1C] transition-colors"
          >
            Confirm Abort State
          </button>
        </div>
      </div>
    </div>
  );
};
