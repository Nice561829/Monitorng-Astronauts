import React, { useEffect, useState } from 'react';
import { Sliders, X } from 'lucide-react';
import {
  GuideLanguage,
  HudAccentId,
  MissionPresetId,
  OperatorProfile,
  PressureUnit,
  TempUnit,
} from '../types/telemetry';
import {
  DEFAULT_OPERATOR_PROFILE,
  HUD_ACCENTS,
  MISSION_PRESETS,
} from '../utils/unitFormatters';
import { HudScrubber, HudToggle } from './HudPrimitives';

interface PersonalizeModalProps {
  open: boolean;
  onClose: () => void;
  profile: OperatorProfile;
  onSaveProfile: (next: OperatorProfile) => Promise<void>;
}

export const PersonalizeModal: React.FC<PersonalizeModalProps> = ({
  open,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [draft, setDraft] = useState<OperatorProfile>(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(profile);
    }
  }, [open, profile]);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSaveProfile(draft);
    setSaving(false);
    onClose();
  };

  const handleReset = () => {
    setDraft(DEFAULT_OPERATOR_PROFILE);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="personalize-modal-title"
    >
      <form
        onSubmit={handleSave}
        className="hud-panel-focused w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
      >
        <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-[#0284C7]" />
            <div>
              <h2
                id="personalize-modal-title"
                className="text-base font-semibold text-[#0F172A]"
              >
                Personalize Flight Console
              </h2>
              <p className="text-xs text-[#475569]">
                Customize your callsign, mission target, units, color accent, and alert thresholds
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close personalization dialog"
            className="p-1.5 rounded-[4px] bg-[#F4F9FD] border border-[#CBD5E1] text-[#475569] hover:text-[#0284C7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="op-name"
                className="block label-caps text-[#475569] mb-1.5"
              >
                OPERATOR NAME
              </label>
              <input
                id="op-name"
                type="text"
                value={draft.operatorName}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, operatorName: e.target.value }))
                }
                className="w-full h-10 px-3 hud-trough text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label
                htmlFor="op-callsign"
                className="block label-caps text-[#475569] mb-1.5"
              >
                CALLSIGN
              </label>
              <input
                id="op-callsign"
                type="text"
                value={draft.callsign}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    callsign: e.target.value.toUpperCase(),
                  }))
                }
                className="w-full h-10 px-3 hud-trough font-mono text-xs font-semibold text-[#0284C7] focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label
                htmlFor="vessel-name"
                className="block label-caps text-[#475569] mb-1.5"
              >
                SPACECRAFT NAME
              </label>
              <input
                id="vessel-name"
                type="text"
                value={draft.vesselName}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    vesselName: e.target.value.toUpperCase(),
                  }))
                }
                className="w-full h-10 px-3 hud-trough font-mono text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>

          <div>
            <div className="label-caps text-[#475569] mb-2">
              EXPEDITION DESTINATION & TRAJECTORY PRESET
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(Object.keys(MISSION_PRESETS) as MissionPresetId[]).map(
                (presetId) => {
                  const preset = MISSION_PRESETS[presetId];
                  const active = draft.missionPreset === presetId;
                  return (
                    <button
                      key={presetId}
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, missionPreset: presetId }))
                      }
                      className={`p-3 rounded-[4px] border text-left transition-colors ${
                        active
                          ? 'bg-[#E0F2FE] border-[#0284C7]'
                          : 'bg-[#F8FAFC] border-[#CBD5E1] hover:border-[#94A3B8]'
                      }`}
                    >
                      <div className="text-xs font-semibold text-[#0F172A]">
                        {preset.label}
                      </div>
                      <div className="font-mono text-[11px] text-[#475569] mt-1">
                        {preset.orbitalVelocity}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div>
            <div className="label-caps text-[#475569] mb-2">
              HUD ACCENT COLOR
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(HUD_ACCENTS) as HudAccentId[]).map((accentId) => {
                const item = HUD_ACCENTS[accentId];
                const active = draft.hudAccent === accentId;
                return (
                  <button
                    key={accentId}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({ ...d, hudAccent: accentId }))
                    }
                    className={`px-3 py-2.5 rounded-[4px] border flex items-center gap-2 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#E0F2FE] border-[#0284C7]'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] hover:border-[#94A3B8]'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-[2px] shrink-0"
                      style={{ backgroundColor: item.hex }}
                    />
                    <span className="truncate text-[#0F172A]">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="label-caps text-[#475569] mb-2">PRESSURE UNIT</div>
              <div className="grid grid-cols-2 gap-1 p-1 hud-trough">
                {(['kPa', 'psi'] as PressureUnit[]).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({ ...d, pressureUnit: unit }))
                    }
                    className={`py-1.5 rounded-[3px] font-mono text-xs font-semibold transition-colors ${
                      draft.pressureUnit === unit
                        ? 'bg-[#0284C7] text-white'
                        : 'text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="label-caps text-[#475569] mb-2">
                TEMPERATURE SCALE
              </div>
              <div className="grid grid-cols-2 gap-1 p-1 hud-trough">
                {(
                  [
                    ['metric', 'K / °C'],
                    ['imperial', '°F'],
                  ] as Array<[TempUnit, string]>
                ).map(([unit, label]) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, tempUnit: unit }))}
                    className={`py-1.5 rounded-[3px] font-mono text-xs font-semibold transition-colors ${
                      draft.tempUnit === unit
                        ? 'bg-[#0284C7] text-white'
                        : 'text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="label-caps text-[#475569] mb-2">
                GUIDE LANGUAGE
              </div>
              <div className="grid grid-cols-2 gap-1 p-1 hud-trough">
                {(
                  [
                    ['en', 'English'],
                    ['tr', 'Türkçe'],
                  ] as Array<[GuideLanguage, string]>
                ).map(([lang, label]) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({ ...d, guideLanguage: lang }))
                    }
                    className={`py-1.5 rounded-[3px] text-xs font-semibold transition-colors ${
                      draft.guideLanguage === lang
                        ? 'bg-[#0284C7] text-white'
                        : 'text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hud-trough p-4 space-y-2">
            <HudScrubber
              label="Personal O₂ Warning Floor"
              value={draft.o2AlertThresholdKpa}
              min={16.5}
              max={21.0}
              step={0.1}
              unit="kPa"
              onChange={(v) =>
                setDraft((d) => ({ ...d, o2AlertThresholdKpa: v }))
              }
            />
            <HudScrubber
              label="Crew Heart Rate Alert Ceiling"
              value={draft.hrAlertThresholdBpm}
              min={85}
              max={140}
              step={1}
              unit="bpm"
              onChange={(v) =>
                setDraft((d) => ({ ...d, hrAlertThresholdBpm: v }))
              }
            />
            <HudToggle
              label="Plain-Language Metric Explanations"
              sublabel="Show helpful descriptions below technical telemetry values"
              checked={draft.showExplanations}
              onChange={(v) => setDraft((d) => ({ ...d, showExplanations: v }))}
            />
          </div>
        </div>

        <footer className="px-5 py-3.5 bg-[#F4F9FD] border-t border-[#E2E8F0] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-[4px] bg-white border border-[#CBD5E1] text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors"
          >
            Reset Defaults
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[4px] bg-white border border-[#CBD5E1] text-[#334155] text-xs font-semibold hover:border-[#0284C7] hover:text-[#0284C7] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-[4px] bg-[#0284C7] text-white text-xs font-semibold hover:bg-[#0369A1] transition-colors"
            >
              {saving ? 'Applying...' : 'Apply Personalization'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
};
