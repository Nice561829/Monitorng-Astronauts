import React, { useMemo, useState } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import {
  GuideLanguage,
  SubsystemToggles,
  SystemScrubbers,
  SystemSeverity,
  WaveformSample,
} from '../../types/telemetry';
import { HudCard, HudScrubber, HudToggle, StatusChip } from '../HudPrimitives';

interface SystemsPowerScreenProps {
  toggles: SubsystemToggles;
  onToggle: (key: keyof SubsystemToggles, val: boolean) => void;
  scrubbers: SystemScrubbers;
  onScrubberChange: (key: keyof SystemScrubbers, val: number) => void;
  waveforms: WaveformSample[];
  condition: SystemSeverity;
  guideLanguage?: GuideLanguage;
  systemsRankClaimed?: boolean;
  onClaimSystemsRank?: () => void;
}

export const SystemsPowerScreen: React.FC<SystemsPowerScreenProps> = ({
  toggles,
  onToggle,
  scrubbers,
  onScrubberChange,
  waveforms,
  condition,
  guideLanguage = 'tr',
  systemsRankClaimed = false,
  onClaimSystemsRank,
}) => {
  const isTr = guideLanguage === 'tr';
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const busGenerationKw = useMemo(() => {
    const fission = toggles.kilopowerBus ? 40.0 : 0;
    const solar = toggles.solarArrayTrack ? 28.4 : 11.2;
    return Number((fission + solar).toFixed(1));
  }, [toggles.kilopowerBus, toggles.solarArrayTrack]);

  const busDrawKw = useMemo(() => {
    let draw = 18.2;
    if (toggles.eclssAutoScrub) draw += 9.4;
    if (toggles.thermalLoopB) draw += 4.6;
    if (toggles.highGainDish) draw += 3.8;
    if (toggles.starTrackerOptical) draw += 1.4;
    draw += (scrubbers.coolantFlowLpm - 10) * 0.35;
    return Number(draw.toFixed(1));
  }, [toggles, scrubbers.coolantFlowLpm]);

  const thermalMarginK = useMemo(() => {
    const base = 312;
    const louverCool = (scrubbers.radiatorLouverDeg - 45) * 0.45;
    const flowCool = (scrubbers.coolantFlowLpm - 15) * 1.1;
    const penalty =
      condition === 'emergency' ? 38 : condition === 'advisory' ? 14 : 0;
    return Math.round(base - louverCool - flowCool + penalty);
  }, [scrubbers.radiatorLouverDeg, scrubbers.coolantFlowLpm, condition]);

  const engineeringGrade: 'S' | 'A' | 'B' | 'C' = useMemo(() => {
    if (busGenerationKw < busDrawKw || condition === 'emergency') return 'C';
    if (
      busGenerationKw >= busDrawKw &&
      scrubbers.coolantFlowLpm >= 20 &&
      thermalMarginK <= 308
    ) {
      return 'S';
    }
    if (busGenerationKw >= busDrawKw && scrubbers.coolantFlowLpm >= 16) {
      return 'A';
    }
    return 'B';
  }, [busGenerationKw, busDrawKw, scrubbers.coolantFlowLpm, thermalMarginK, condition]);

  const consumables = useMemo(
    () => [
      {
        id: 'LOX',
        name: 'Liquid Oxygen (Propulsion)',
        massKg: '18,420.0',
        reservePct: 84.2,
        endurance: '148.4 d',
        status: 'nominal' as SystemSeverity,
      },
      {
        id: 'LCH4',
        name: 'Liquid Methane Fuel',
        massKg: '5,260.4',
        reservePct: 83.9,
        endurance: '148.0 d',
        status: 'nominal' as SystemSeverity,
      },
      {
        id: 'O2-ECLSS',
        name: 'Breathing O2 High-Pressure',
        massKg: '612.8',
        reservePct:
          condition === 'emergency'
            ? 42.1
            : condition === 'advisory'
              ? 68.4
              : 91.5,
        endurance: `${(92 - scrubbers.o2MixPct * 0.4).toFixed(1)} d`,
        status: condition,
      },
      {
        id: 'H2O-LOOP',
        name: 'Reclaimed Potable Water',
        massKg: '1,184.0',
        reservePct: 94.0,
        endurance: '210.0 d',
        status: 'nominal' as SystemSeverity,
      },
      {
        id: 'LIOH',
        name: 'CO2 Amine / LiOH Reserves',
        massKg: '240.0',
        reservePct: toggles.eclssAutoScrub ? 88.0 : 62.5,
        endurance: toggles.eclssAutoScrub ? '195.0 d' : '42.0 d',
        status: toggles.eclssAutoScrub
          ? ('nominal' as SystemSeverity)
          : ('advisory' as SystemSeverity),
      },
    ],
    [condition, scrubbers.o2MixPct, toggles.eclssAutoScrub]
  );

  // Dual-line decay chart geometry
  const w = 660;
  const h = 190;
  const padL = 44;
  const padR = 20;
  const padT = 18;
  const padB = 26;
  const iw = w - padL - padR;
  const ih = h - padT - padB;

  const theoPts = waveforms
    .map((s, i) => {
      const x = padL + (i / Math.max(1, waveforms.length - 1)) * iw;
      const y = padT + ih - ((s.theoreticalEffPct - 86) / 12) * ih;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const empPts = waveforms
    .map((s, i) => {
      const x = padL + (i / Math.max(1, waveforms.length - 1)) * iw;
      const y = padT + ih - ((s.ispEffPct - 86) / 12) * ih;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const activeSample =
    hoverIdx !== null ? waveforms[hoverIdx] : waveforms[waveforms.length - 1];

  return (
    <div className="space-y-6">
      {/* Top Row: Power Distribution + Sensor Scrubber Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <HudCard
            title="Primary Power Bus & Load Allocation"
            tier={busGenerationKw < busDrawKw ? 'emergency' : 'default'}
            className="flex-1"
            rightSlot={
              <StatusChip
                status={busGenerationKw >= busDrawKw ? 'nominal' : 'emergency'}
                label={busGenerationKw >= busDrawKw ? 'BUS BALANCED' : 'OVERLOAD'}
              />
            }
          >
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">GENERATION</div>
                <div className="telemetry-md font-semibold text-[#0284C7] mt-1">
                  {busGenerationKw}{' '}
                  <span className="text-xs text-[#64748B]">kW</span>
                </div>
              </div>
              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">TOTAL DRAW</div>
                <div className="telemetry-md font-semibold text-[#0F172A] mt-1">
                  {busDrawKw} <span className="text-xs text-[#64748B]">kW</span>
                </div>
              </div>
              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">RADIATOR</div>
                <div className="telemetry-md font-semibold text-[#059669] mt-1">
                  {thermalMarginK}{' '}
                  <span className="text-xs text-[#64748B]">K</span>
                </div>
              </div>
            </div>

            {/* Load Utilization Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-mono text-[#475569] mb-1.5">
                <span>BUS LOAD UTILIZATION</span>
                <span className="text-[#0284C7] font-semibold">
                  {Math.min(
                    100,
                    Math.round((busDrawKw / Math.max(1, busGenerationKw)) * 100)
                  )}
                  % · 120.4 VDC
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#DCEAF6] border border-[#CBD5E1] overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    busDrawKw > busGenerationKw ? 'bg-[#DC2626]' : 'bg-[#0284C7]'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (busDrawKw / Math.max(1, busGenerationKw)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-1">
              <HudToggle
                label="Kilopower Fission Bus"
                sublabel="40.0 kWe Stirling baseline reactor"
                checked={toggles.kilopowerBus}
                onChange={(v) => onToggle('kilopowerBus', v)}
              />
              <HudToggle
                label="Solar Array Sun-Track"
                sublabel="Dual-wing ROSA photovoltaic gimballing"
                checked={toggles.solarArrayTrack}
                onChange={(v) => onToggle('solarArrayTrack', v)}
              />
              <HudToggle
                label="High-Gain Ka-Band Dish"
                sublabel="3.8 kW deep-space telemetry amplifier"
                checked={toggles.highGainDish}
                onChange={(v) => onToggle('highGainDish', v)}
              />
            </div>

            {/* Gamified Engineering Grade & S-Rank Challenge */}
            <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-[6px] border font-mono text-base font-bold flex items-center justify-center ${
                    engineeringGrade === 'S'
                      ? 'bg-[#ECFDF5] border-[#34D399] text-[#059669]'
                      : engineeringGrade === 'A'
                        ? 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0284C7]'
                        : 'bg-[#FEF3C7] border-[#FCD34D] text-[#B45309]'
                  }`}
                >
                  {engineeringGrade}
                </div>
                <div>
                  <div className="label-caps text-[#475569]">
                    {isTr ? 'MÜHENDİSLİK NOTU' : 'SYSTEMS GRADE'}
                  </div>
                  <div className="text-xs text-[#475569]">
                    {isTr
                      ? 'S-Sınıfı için Soğutma ≥ 20 L/m & Radyatör ≤ 308K'
                      : 'Target S-Rank: Flow ≥ 20 L/m & Radiator ≤ 308K'}
                  </div>
                </div>
              </div>

              {systemsRankClaimed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#ECFDF5] border border-[#6EE7B7] text-[#047857] text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isTr ? 'S-Sınıfı Onaylandı (+60 XP)' : 'S-Rank Verified (+60 XP)'}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={engineeringGrade !== 'S'}
                  onClick={() => onClaimSystemsRank?.()}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors whitespace-nowrap ${
                    engineeringGrade === 'S'
                      ? 'bg-[#059669] text-white hover:bg-[#047857] shadow-sm'
                      : 'bg-[#E2E8F0] text-[#64748B] cursor-not-allowed'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    {isTr
                      ? 'S-Sınıfı Dengeyi Onayla (+60 XP)'
                      : 'Claim S-Rank Balance (+60 XP)'}
                  </span>
                </button>
              )}
            </div>
          </HudCard>
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <HudCard
            title="ECLSS & Thermal Loop Parameter Scrubbers"
            className="flex-1"
            rightSlot={
              <span className="label-caps text-[#475569]">
                PRECISION CALIBRATION
              </span>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <HudScrubber
                label="Cabin O2 / N2 Mix"
                value={scrubbers.o2MixPct}
                min={18.0}
                max={24.5}
                step={0.1}
                unit="%"
                onChange={(v) => onScrubberChange('o2MixPct', v)}
              />
              <HudScrubber
                label="Coolant Loop Flow"
                value={scrubbers.coolantFlowLpm}
                min={10.0}
                max={26.0}
                step={0.2}
                unit="L/m"
                onChange={(v) => onScrubberChange('coolantFlowLpm', v)}
              />
              <HudScrubber
                label="Radiator Louver Angle"
                value={scrubbers.radiatorLouverDeg}
                min={15}
                max={90}
                step={1}
                unit="deg"
                onChange={(v) => onScrubberChange('radiatorLouverDeg', v)}
              />
              <HudScrubber
                label="Main Engine Throttle"
                value={scrubbers.burnThrottlePct}
                min={40}
                max={100}
                step={1}
                unit="%"
                onChange={(v) => onScrubberChange('burnThrottlePct', v)}
              />
            </div>

            {/* Dual-Axis Efficiency Decay Curve */}
            <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="label-caps text-[#475569]">
                  THEORETICAL VS EMPIRICAL LOOP EFFICIENCY
                </span>
                <div className="flex items-center gap-4 text-xs font-mono font-semibold">
                  <span className="text-[#0284C7]">
                    MODEL: {activeSample?.theoreticalEffPct}%
                  </span>
                  <span className="text-[#4F46E5]">
                    EMPIRICAL: {activeSample?.ispEffPct}%
                  </span>
                </div>
              </div>
              <svg
                viewBox={`0 0 ${w} ${h}`}
                className="w-full h-[175px] cursor-crosshair bg-[#F0F9FF] rounded-[6px] border border-[#CBD5E1]"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relX = ((e.clientX - rect.left) / rect.width) * w;
                  const idx = Math.round(
                    ((relX - padL) / iw) * (waveforms.length - 1)
                  );
                  if (idx >= 0 && idx < waveforms.length) setHoverIdx(idx);
                }}
                onMouseLeave={() => setHoverIdx(null)}
              >
                {[0, 0.33, 0.66, 1].map((t) => (
                  <line
                    key={t}
                    x1={padL}
                    y1={padT + t * ih}
                    x2={w - padR}
                    y2={padT + t * ih}
                    stroke="#CBD5E1"
                    strokeWidth="1"
                  />
                ))}
                <text
                  x={padL - 6}
                  y={padT + 4}
                  textAnchor="end"
                  fill="#475569"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                >
                  98%
                </text>
                <text
                  x={padL - 6}
                  y={padT + ih}
                  textAnchor="end"
                  fill="#475569"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                >
                  86%
                </text>
                <polyline
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2.25"
                  points={theoPts}
                />
                <polyline
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                  points={empPts}
                />
                {hoverIdx !== null && waveforms[hoverIdx] && (
                  <line
                    x1={padL + (hoverIdx / (waveforms.length - 1)) * iw}
                    y1={padT}
                    x2={padL + (hoverIdx / (waveforms.length - 1)) * iw}
                    y2={padT + ih}
                    stroke="#0284C7"
                    strokeOpacity="0.45"
                    strokeDasharray="3 3"
                  />
                )}
              </svg>
            </div>
          </HudCard>
        </div>
      </div>

      {/* Propellant & Consumables Matrix */}
      <HudCard
        title="Propellant & Life-Support Consumables Inventory"
        rightSlot={
          <span className="label-caps text-[#475569]">
            TABULAR MASS & ENDURANCE
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#CBD5E1]">
                <th className="py-2.5 pr-4 label-caps text-[#475569]">CODE</th>
                <th className="py-2.5 pr-4 label-caps text-[#475569]">
                  SUBSYSTEM RESOURCE
                </th>
                <th className="py-2.5 pr-4 label-caps text-[#475569] text-right">
                  REMAINING MASS
                </th>
                <th className="py-2.5 pr-4 label-caps text-[#475569] text-right">
                  RESERVE
                </th>
                <th className="py-2.5 pr-4 label-caps text-[#475569] text-right">
                  ENDURANCE
                </th>
                <th className="py-2.5 label-caps text-[#475569] text-right">
                  STATE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {consumables.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#F0F9FF] transition-colors"
                >
                  <td className="py-3 pr-4 font-mono text-xs text-[#0284C7] font-semibold">
                    {item.id}
                  </td>
                  <td className="py-3 pr-4 text-sm text-[#0F172A] font-medium">
                    {item.name}
                  </td>
                  <td className="py-3 pr-4 font-mono tabular-nums text-sm text-[#0F172A] text-right">
                    {item.massKg} kg
                  </td>
                  <td className="py-3 pr-4 font-mono tabular-nums text-sm text-[#0284C7] font-semibold text-right">
                    {item.reservePct.toFixed(1)}%
                  </td>
                  <td className="py-3 pr-4 font-mono tabular-nums text-sm text-[#475569] text-right">
                    {item.endurance}
                  </td>
                  <td className="py-3 text-right">
                    <StatusChip status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </HudCard>
    </div>
  );
};
