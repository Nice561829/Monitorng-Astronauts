import React from 'react';
import { BookOpen, Sliders } from 'lucide-react';
import { OperatorProfile, ScreenId, SystemSeverity } from '../types/telemetry';
import { StreamConnectionState } from '../services/telemetryClient';
import { HUD_ACCENTS, MISSION_PRESETS } from '../utils/unitFormatters';
import { EarthLatencyPill, StatusChip } from './HudPrimitives';

interface TopNavHeaderProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  metFormatted: string;
  rttFormatted: string;
  condition: SystemSeverity;
  onChangeCondition: (next: SystemSeverity) => void;
  onTriggerAbortModal: () => void;
  onOpenGlossary: () => void;
  onOpenPersonalize: () => void;
  streamState: StreamConnectionState;
  profile: OperatorProfile;
}

const NAV_TABS: { id: ScreenId; label: string }[] = [
  { id: 'flight-deck', label: 'Flight Deck' },
  { id: 'crew-eva', label: 'Crew & EVA' },
  { id: 'systems-power', label: 'Systems & Power' },
  { id: 'comms-surface', label: 'Comms & Surface' },
];

export const TopNavHeader: React.FC<TopNavHeaderProps> = ({
  activeScreen,
  onSelectScreen,
  metFormatted,
  rttFormatted,
  condition,
  onChangeCondition,
  onTriggerAbortModal,
  onOpenGlossary,
  onOpenPersonalize,
  streamState,
  profile,
}) => {
  const accentHex = HUD_ACCENTS[profile.hudAccent].hex;
  const missionMeta =
    MISSION_PRESETS[profile.missionPreset] ?? MISSION_PRESETS['mars-transit'];

  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#CBD5E1]">
      {/* Strict 3-Zone Top Bar */}
      <header className="max-w-[1720px] mx-auto px-4 md:px-6 lg:px-10 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title */}
        <button
          type="button"
          onClick={() => onSelectScreen('flight-deck')}
          className="text-lg font-semibold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-[#0284C7]"
        >
          AeroHUD Telemetry
        </button>

        {/* Zone 2: Single-line Screen Tabs */}
        <nav
          aria-label="Mission Screens"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_TABS.map((tab) => {
            const isActive = activeScreen === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectScreen(tab.id)}
                style={isActive ? { color: accentHex } : undefined}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#0284C7] ${
                  isActive ? '' : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span
                    className="absolute left-0 right-0 -bottom-[9px] h-[2px]"
                    style={{ backgroundColor: accentHex }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onTriggerAbortModal}
            className="px-4 py-2 rounded-[4px] bg-[#DC2626] text-white text-xs font-semibold tracking-wide whitespace-nowrap shrink-0 shadow-sm hover:bg-[#B91C1C] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2626]"
          >
            Abort Override
          </button>
        </div>
      </header>

      {/* Mobile Screen Selector */}
      <div className="md:hidden px-4 pb-2 flex items-center gap-2 overflow-x-auto border-t border-[#E2E8F0] pt-2">
        {NAV_TABS.map((tab) => {
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectScreen(tab.id)}
              style={
                isActive
                  ? { color: accentHex, borderColor: accentHex }
                  : undefined
              }
              className={`px-3 py-1.5 rounded-[4px] text-xs font-medium whitespace-nowrap shrink-0 border transition-colors ${
                isActive
                  ? 'bg-[#E0F2FE]'
                  : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Telemetry Status Ribbon */}
      <div className="bg-[#F4F9FD] border-t border-[#E2E8F0]">
        <div className="max-w-[1720px] mx-auto px-4 md:px-6 lg:px-10 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <div
              className="flex items-center gap-2"
              title="Mission Elapsed Time: continuous clock since launch"
            >
              <span className="label-caps text-[#475569]">MET</span>
              <span className="telemetry-sm font-semibold text-[#0F172A]">
                {metFormatted}
              </span>
            </div>

            <span className="text-[#CBD5E1] hidden sm:inline" aria-hidden="true">
              /
            </span>

            <div className="hidden lg:flex items-center gap-2">
              <span className="label-caps text-[#475569]">
                {profile.callsign || 'FD-ALPHA'}
              </span>
              <span
                className="telemetry-sm font-semibold"
                style={{ color: accentHex }}
              >
                {profile.vesselName || 'ARTEMIS-IV'} · {missionMeta.phaseLabel}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="label-caps text-[#475569]">STREAM</span>
              <span
                className={`telemetry-sm font-semibold ${
                  streamState === 'live' ? 'text-[#059669]' : 'text-[#D97706]'
                }`}
              >
                {streamState === 'live' ? '● SSE LIVE' : '▲ SYNCING'}
              </span>
            </div>

            <EarthLatencyPill
              rttFormatted={rttFormatted}
              degraded={condition !== 'nominal'}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenPersonalize}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-white border border-[#CBD5E1] text-[#334155] text-xs font-medium whitespace-nowrap shrink-0 hover:border-[#0284C7] hover:text-[#0284C7] transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Personalize</span>
            </button>

            <button
              type="button"
              onClick={onOpenGlossary}
              style={{
                borderColor: `${accentHex}66`,
                color: accentHex,
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-white border text-xs font-medium whitespace-nowrap shrink-0 hover:bg-[#E0F2FE]/60 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {profile.guideLanguage === 'tr'
                  ? 'Terimler & Veri'
                  : 'Terminology & Data'}
              </span>
            </button>

            <StatusChip status={condition} />
            <div
              role="group"
              aria-label="Telemetry Condition State"
              className="inline-flex items-center p-0.5 rounded-[4px] bg-white border border-[#CBD5E1]"
            >
              {(['nominal', 'advisory', 'emergency'] as SystemSeverity[]).map(
                (state) => {
                  const active = condition === state;
                  return (
                    <button
                      key={state}
                      type="button"
                      onClick={() => onChangeCondition(state)}
                      className={`px-2.5 py-1 rounded-[3px] label-caps whitespace-nowrap shrink-0 transition-colors ${
                        active
                          ? state === 'emergency'
                            ? 'bg-[#FEE2E2] text-[#B91C1C]'
                            : state === 'advisory'
                              ? 'bg-[#FEF3C7] text-[#B45309]'
                              : 'bg-[#E0F2FE] text-[#0369A1]'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      {state}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
