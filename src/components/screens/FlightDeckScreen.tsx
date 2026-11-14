import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Compass,
  Crosshair,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CrewMember,
  OperatorProfile,
  SubsystemToggles,
  SystemSeverity,
  WaveformSample,
} from '../../types/telemetry';
import { formatCountdown } from '../../data/telemetryEngine';
import {
  formatPressure,
  HUD_ACCENTS,
  MISSION_PRESETS,
} from '../../utils/unitFormatters';
import { HudCard, HudToggle, StatusChip } from '../HudPrimitives';

interface FlightDeckScreenProps {
  condition: SystemSeverity;
  crew: CrewMember[];
  toggles: SubsystemToggles;
  onToggle: (key: keyof SubsystemToggles, val: boolean) => void;
  burnActive: boolean;
  onToggleBurn: () => void;
  burnCountdownSec: number;
  burnThrottlePct: number;
  waveforms: WaveformSample[];
  tick: number;
  cabinO2OffsetKpa?: number;
  radiationSpikeMsv?: number;
  profile: OperatorProfile;
  onInspectCrewHealth: () => void;
  orbitalAlignedClaimed?: boolean;
  onClaimOrbitalAlignment?: () => void;
}

export const FlightDeckScreen: React.FC<FlightDeckScreenProps> = ({
  condition,
  crew,
  toggles,
  onToggle,
  burnActive,
  onToggleBurn,
  burnCountdownSec,
  burnThrottlePct,
  waveforms,
  tick,
  cabinO2OffsetKpa = 0,
  radiationSpikeMsv = 0,
  profile,
  onInspectCrewHealth,
  orbitalAlignedClaimed = false,
  onClaimOrbitalAlignment,
}) => {
  const isTr = profile.guideLanguage === 'tr';
  const [zoom, setZoom] = useState(1);
  const [layers, setLayers] = useState({
    trajectory: true,
    thermalVector: true,
    debrisField: true,
    commsCone: true,
  });
  const [probe, setProbe] = useState<{
    x: number;
    y: number;
    auX: string;
    auY: string;
    rangeKm: string;
  } | null>(null);
  const [chartHoverIdx, setChartHoverIdx] = useState<number | null>(null);

  const vectorReady =
    toggles.rcsGimbalLock && toggles.starTrackerOptical && toggles.thermalLoopB;
  const alignmentPct = useMemo(() => {
    let score = 40;
    if (toggles.rcsGimbalLock) score += 20;
    if (toggles.starTrackerOptical) score += 20;
    if (toggles.thermalLoopB) score += 20;
    if (burnActive && score === 100) return 100;
    return score;
  }, [
    toggles.rcsGimbalLock,
    toggles.starTrackerOptical,
    toggles.thermalLoopB,
    burnActive,
  ]);

  const accentHex = HUD_ACCENTS[profile.hudAccent].hex;
  const missionPreset =
    MISSION_PRESETS[profile.missionPreset] ?? MISSION_PRESETS['mars-transit'];

  const activeCrew = crew.filter((c) => c.sensorActive);
  const avgHeartRate = useMemo(() => {
    if (activeCrew.length === 0) return 0;
    const sum = activeCrew.reduce((acc, c) => acc + c.heartRate, 0);
    return Math.round(sum / activeCrew.length);
  }, [activeCrew]);

  const healthyCount = useMemo(
    () =>
      crew.filter((c) => c.sensorActive && c.status === 'nominal').length,
    [crew]
  );

  const cabinO2Kpa = useMemo(() => {
    const base = toggles.eclssAutoScrub ? 21.3 : 19.8;
    const mod =
      condition === 'emergency' ? -5.8 : condition === 'advisory' ? -2.1 : 0;
    return Number(
      (base + mod + cabinO2OffsetKpa + Math.sin(tick * 0.3) * 0.1).toFixed(1)
    );
  }, [condition, toggles.eclssAutoScrub, cabinO2OffsetKpa, tick]);

  const cabinPressureKpa = useMemo(() => {
    const mod =
      condition === 'emergency' ? -18.4 : condition === 'advisory' ? -3.2 : 0;
    return Number((101.3 + mod + Math.cos(tick * 0.25) * 0.1).toFixed(1));
  }, [condition, tick]);

  const cabinO2Formatted = formatPressure(cabinO2Kpa, profile.pressureUnit, 1);
  const cabinPressureFormatted = formatPressure(
    cabinPressureKpa,
    profile.pressureUnit,
    1
  );
  const o2BelowPersonalFloor = cabinO2Kpa < profile.o2AlertThresholdKpa;
  const hrAbovePersonalCeiling = avgHeartRate > profile.hrAlertThresholdBpm;

  const radFlux = useMemo(() => {
    const mod =
      condition === 'emergency' ? 4.85 : condition === 'advisory' ? 1.15 : 0;
    return (0.42 + mod + radiationSpikeMsv + (tick % 3) * 0.01).toFixed(2);
  }, [condition, radiationSpikeMsv, tick]);

  const pitchDeg = (
    (toggles.rcsGimbalLock ? 0.12 : 1.84) +
    Math.sin(tick * 0.4) * (burnActive ? 0.35 : 0.08)
  ).toFixed(2);
  const yawDeg = (
    (toggles.starTrackerOptical ? -0.04 : 0.92) +
    Math.cos(tick * 0.3) * 0.06
  ).toFixed(2);
  const rollDeg = (0.08 + Math.sin(tick * 0.2) * 0.05).toFixed(2);

  const handleStageMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 720;
    const ny = ((e.clientY - rect.top) / rect.height) * 420;
    const auX = ((nx - 140) / 380).toFixed(3);
    const auY = ((210 - ny) / 380).toFixed(3);
    const distPx = Math.hypot(nx - 560, ny - 150);
    const rangeKm = Math.round(distPx * 18400).toLocaleString('en-US');
    setProbe({ x: nx, y: ny, auX, auY, rangeKm });
  };

  // Dual-axis waveform SVG bounds
  const chartW = 760;
  const chartH = 165;
  const padL = 44;
  const padR = 44;
  const padT = 16;
  const padB = 26;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const tempPoints = waveforms
    .map((w, i) => {
      const x = padL + (i / Math.max(1, waveforms.length - 1)) * innerW;
      const y =
        padT + innerH - ((w.chamberTempK - 1080) / (1260 - 1080)) * innerH;
      return `${x.toFixed(1)},${Math.max(padT, Math.min(padT + innerH, y)).toFixed(1)}`;
    })
    .join(' ');

  const effPoints = waveforms
    .map((w, i) => {
      const x = padL + (i / Math.max(1, waveforms.length - 1)) * innerW;
      const y = padT + innerH - ((w.ispEffPct - 86) / (98 - 86)) * innerH;
      return `${x.toFixed(1)},${Math.max(padT, Math.min(padT + innerH, y)).toFixed(1)}`;
    })
    .join(' ');

  const hoveredSample =
    chartHoverIdx !== null
      ? waveforms[chartHoverIdx]
      : waveforms[waveforms.length - 1];

  return (
    <div className="space-y-6">
      {/* Main Split Workspace: Left Diagnostic Rail + Center Orbital Stage */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left Diagnostic Side-Rail */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <HudCard
            title={`Critical Lifelines — ${profile.operatorName || 'Flight Director'}`}
            tier={
              condition === 'emergency'
                ? 'emergency'
                : condition === 'advisory' ||
                    o2BelowPersonalFloor ||
                    hrAbovePersonalCeiling ||
                    healthyCount < crew.length
                  ? 'warning'
                  : 'default'
            }
            rightSlot={<StatusChip status={condition} />}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">CABIN O2 PARTIAL</div>
                <div className="mt-1.5 flex items-baseline">
                  <span
                    className="telemetry-lg"
                    style={{
                      color:
                        condition === 'emergency'
                          ? '#DC2626'
                          : condition === 'advisory' || o2BelowPersonalFloor
                            ? '#D97706'
                            : accentHex,
                    }}
                  >
                    {cabinO2Formatted.value}
                  </span>
                  <span className="telemetry-sm text-[#64748B] ml-1.5">
                    {cabinO2Formatted.unitLabel}
                  </span>
                </div>
                {profile.showExplanations && (
                  <div className="mt-1 text-xs text-[#475569]">
                    {profile.guideLanguage === 'tr'
                      ? `Solunabilir O₂ (eşik ≥ ${profile.o2AlertThresholdKpa} kPa)`
                      : `Breathable O₂ (floor ≥ ${profile.o2AlertThresholdKpa} kPa)`}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onInspectCrewHealth}
                className="hud-trough p-3 text-left hover:border-[#0284C7] transition-colors focus-visible:outline-2 focus-visible:outline-[#0284C7]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="label-caps text-[#475569]">CREW MEAN HR</span>
                  <span className="text-[10px] font-mono font-semibold text-[#0284C7]">
                    {healthyCount}/{crew.length} OK →
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline">
                  <span
                    className={`telemetry-lg ${
                      condition === 'emergency'
                        ? 'text-[#DC2626]'
                        : condition === 'advisory' ||
                            hrAbovePersonalCeiling ||
                            healthyCount < crew.length
                          ? 'text-[#D97706]'
                          : 'text-[#059669]'
                    }`}
                  >
                    {activeCrew.length > 0 ? avgHeartRate : '--'}
                  </span>
                  <span className="telemetry-sm text-[#64748B] ml-1.5">bpm</span>
                </div>
                {profile.showExplanations && (
                  <div className="mt-1 text-xs text-[#475569]">
                    {profile.guideLanguage === 'tr'
                      ? 'Sağlık sensörlerini yönetmek için tıkla'
                      : 'Click to inspect & adjust crew sensors'}
                  </div>
                )}
              </button>

              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">HULL PRESSURE</div>
                <div className="mt-1.5 flex items-baseline">
                  <span
                    className={`telemetry-md font-semibold ${
                      condition === 'emergency'
                        ? 'text-[#DC2626]'
                        : 'text-[#0F172A]'
                    }`}
                  >
                    {cabinPressureFormatted.value}
                  </span>
                  <span className="telemetry-sm text-[#64748B] ml-1.5">
                    {cabinPressureFormatted.unitLabel}
                  </span>
                </div>
                {profile.showExplanations && (
                  <div className="mt-1 text-[11px] text-[#475569]">
                    {profile.guideLanguage === 'tr'
                      ? 'Toplam kapalı kabin basıncı'
                      : 'Total sealed cabin air pressure'}
                  </div>
                )}
              </div>

              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">SOLAR RAD FLUX</div>
                <div className="mt-1.5 flex items-baseline">
                  <span
                    className="telemetry-md font-semibold"
                    style={{
                      color:
                        condition === 'emergency'
                          ? '#DC2626'
                          : condition === 'advisory'
                            ? '#D97706'
                            : accentHex,
                    }}
                  >
                    {radFlux}
                  </span>
                  <span className="telemetry-sm text-[#64748B] ml-1.5">
                    mSv/h
                  </span>
                </div>
                {profile.showExplanations && (
                  <div className="mt-1 text-[11px] text-[#475569]">
                    {profile.guideLanguage === 'tr'
                      ? 'Gövdeye çarpan radyasyon akısı'
                      : 'Ionizing radiation hitting hull'}
                  </div>
                )}
              </div>
            </div>
          </HudCard>

          <HudCard
            title="Flight Control Subsystems"
            tier="default"
            rightSlot={
              <span className="label-caps text-[#0284C7]">
                {Object.values(toggles).filter(Boolean).length}/10 ACTIVE
              </span>
            }
          >
            <div className="divide-y divide-[#E2E8F0]">
              <HudToggle
                label="RCS Gimbal Lock"
                sublabel="Attitude authority damper"
                checked={toggles.rcsGimbalLock}
                onChange={(v) => onToggle('rcsGimbalLock', v)}
              />
              <HudToggle
                label="ECLSS Auto-Scrub"
                sublabel="CO2 amine bed regeneration"
                checked={toggles.eclssAutoScrub}
                onChange={(v) => onToggle('eclssAutoScrub', v)}
              />
              <HudToggle
                label="Star Tracker Optical"
                sublabel="Autonomous celestial fix"
                checked={toggles.starTrackerOptical}
                onChange={(v) => onToggle('starTrackerOptical', v)}
              />
              <HudToggle
                label="Thermal Loop B"
                sublabel="Redundant ammonia radiator"
                checked={toggles.thermalLoopB}
                onChange={(v) => onToggle('thermalLoopB', v)}
              />
            </div>
          </HudCard>
        </div>

        {/* Center Orbital & Trajectory Canvas Stage (8 cols) */}
        <div className="xl:col-span-8 flex flex-col">
          <HudCard
            title="Heliocentric Transfer Trajectory & Vector HUD"
            tier={burnActive ? 'focused' : 'default'}
            className="flex-1"
            rightSlot={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.max(0.8, Number((z - 0.15).toFixed(2))))
                  }
                  aria-label="Zoom out trajectory"
                  className="p-1.5 rounded-[4px] bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0284C7] hover:border-[#0284C7] transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))))
                  }
                  aria-label="Zoom in trajectory"
                  className="p-1.5 rounded-[4px] bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0284C7] hover:border-[#0284C7] transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  aria-label="Reset trajectory zoom"
                  className="p-1.5 rounded-[4px] bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0284C7] hover:border-[#0284C7] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            }
          >
            {/* Layer Filter Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ['trajectory', 'Transfer Arc'],
                    ['thermalVector', 'Thrust Vector'],
                    ['debrisField', 'Micrometeor Corridor'],
                    ['commsCone', 'Earth Comms Cone'],
                  ] as const
                ).map(([key, label]) => {
                  const active = layers[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                      className={`px-2.5 py-1 rounded-[4px] label-caps border whitespace-nowrap shrink-0 transition-colors ${
                        active
                          ? 'bg-[#E0F2FE] border-[#0284C7]/45 text-[#0284C7]'
                          : 'bg-[#F4F9FD] border-[#CBD5E1] text-[#475569] hover:text-[#0F172A]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#475569]">
                <Crosshair className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>
                  {probe
                    ? `X ${probe.auX} AU · Y ${probe.auY} AU · ΔMars ${probe.rangeKm} km`
                    : 'Hover stage for crosshair probe'}
                </span>
              </div>
            </div>

            {/* Interactive SVG Orbital Map (Bright Daylight Sky Canvas) */}
            <div className="relative rounded-[6px] border border-[#CBD5E1] bg-[#F0F9FF] hud-grid-bg overflow-hidden">
              <svg
                viewBox="0 0 720 380"
                className="w-full h-[320px] md:h-[360px] cursor-crosshair select-none"
                onMouseMove={handleStageMove}
                onMouseLeave={() => setProbe(null)}
              >
                <defs>
                  <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient
                    id="commsBeam"
                    x1="0%"
                    y1="100%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0.04" />
                  </linearGradient>
                </defs>

                <g
                  transform={`translate(${360 * (1 - zoom)}, ${190 * (1 - zoom)}) scale(${zoom})`}
                >
                  {/* Orbital Grid Rings */}
                  <circle
                    cx="130"
                    cy="290"
                    r="180"
                    fill="none"
                    stroke="#94A3B8"
                    strokeOpacity="0.45"
                    strokeWidth="0.9"
                    strokeDasharray="4 6"
                  />
                  <circle
                    cx="130"
                    cy="290"
                    r="340"
                    fill="none"
                    stroke="#94A3B8"
                    strokeOpacity="0.45"
                    strokeWidth="0.9"
                    strokeDasharray="4 6"
                  />
                  <circle
                    cx="130"
                    cy="290"
                    r="490"
                    fill="none"
                    stroke="#94A3B8"
                    strokeOpacity="0.45"
                    strokeWidth="0.9"
                    strokeDasharray="4 6"
                  />

                  {/* Earth Comms Cone */}
                  {layers.commsCone && (
                    <polygon
                      points="156,264 388,164 414,208"
                      fill="url(#commsBeam)"
                      stroke="#4F46E5"
                      strokeOpacity="0.4"
                      strokeWidth="1"
                      strokeDasharray="3 4"
                    />
                  )}

                  {/* Micrometeor Debris Corridor */}
                  {layers.debrisField && (
                    <g opacity="0.88">
                      <path
                        d="M 240 120 Q 380 110 490 190"
                        fill="none"
                        stroke="#D97706"
                        strokeWidth="1.2"
                        strokeDasharray="2 6"
                      />
                      <circle cx="318" cy="122" r="2.4" fill="#D97706" />
                      <circle cx="364" cy="128" r="2.0" fill="#D97706" />
                      <circle cx="428" cy="148" r="2.6" fill="#D97706" />
                      <text
                        x="300"
                        y="108"
                        fill="#B45309"
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="JetBrains Mono"
                        letterSpacing="0.08em"
                      >
                        CORRIDOR DEBRIS DENSITY +1.2%
                      </text>
                    </g>
                  )}

                  {/* Sun Reference */}
                  <circle cx="130" cy="290" r="34" fill="url(#sunGlow)" />
                  <circle cx="130" cy="290" r="7" fill="#F59E0B" />
                  <text
                    x="105"
                    y="314"
                    fill="#475569"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="JetBrains Mono"
                  >
                    SOL REF
                  </text>

                  {/* Earth Departure Node */}
                  <circle
                    cx="156"
                    cy="264"
                    r="9"
                    fill="#FFFFFF"
                    stroke="#4F46E5"
                    strokeWidth="2.2"
                  />
                  <circle cx="156" cy="264" r="3.8" fill="#4F46E5" />
                  <text
                    x="170"
                    y="274"
                    fill="#312E81"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="JetBrains Mono"
                  >
                    EARTH (DSN LINK)
                  </text>

                  {/* Hohmann Transfer Trajectory Arc */}
                  {layers.trajectory && (
                    <>
                      <path
                        d="M 156 264 Q 335 120 568 148"
                        fill="none"
                        stroke="#4F46E5"
                        strokeWidth="1.75"
                        strokeDasharray="6 4"
                      />
                      <path
                        d="M 156 264 Q 262 178 394 172"
                        fill="none"
                        stroke={accentHex}
                        strokeWidth="2.75"
                      />
                    </>
                  )}

                  {/* Target Orbit & Capture Node */}
                  <circle
                    cx="568"
                    cy="148"
                    r="24"
                    fill="none"
                    stroke="#DC2626"
                    strokeOpacity="0.4"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx="568"
                    cy="148"
                    r="9"
                    fill="#FFFFFF"
                    stroke="#DC2626"
                    strokeWidth="2.2"
                  />
                  <circle cx="568" cy="148" r="3.8" fill="#DC2626" />
                  <text
                    x="518"
                    y="116"
                    fill="#0F172A"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="JetBrains Mono"
                  >
                    {missionPreset.targetNode}
                  </text>

                  {/* Spacecraft Active Position */}
                  <g transform="translate(394, 172)">
                    {layers.thermalVector && (
                      <>
                        <line
                          x1="0"
                          y1="0"
                          x2={burnActive ? '62' : '42'}
                          y2={burnActive ? '-18' : '-12'}
                          stroke={burnActive ? accentHex : '#059669'}
                          strokeWidth={burnActive ? '2.5' : '1.75'}
                        />
                        <polygon
                          points={
                            burnActive
                              ? '64,-18 54,-20 57,-12'
                              : '44,-12 36,-14 38,-8'
                          }
                          fill={burnActive ? accentHex : '#059669'}
                        />
                      </>
                    )}
                    <circle
                      r="16"
                      fill="rgba(255,255,255,0.65)"
                      stroke={condition === 'emergency' ? '#DC2626' : accentHex}
                      strokeOpacity="0.55"
                      strokeWidth="1.25"
                    />
                    <polygon
                      points="10,-3 -6,-6 -3,0 -6,6"
                      fill="#FFFFFF"
                      stroke={accentHex}
                      strokeWidth="1.6"
                    />
                    <text
                      x="-28"
                      y="30"
                      fill={accentHex}
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="JetBrains Mono"
                    >
                      {profile.vesselName || 'ARTEMIS-IV'} ·{' '}
                      {missionPreset.orbitalVelocity}
                    </text>
                  </g>

                  {/* Burn Node Marker */}
                  <g transform="translate(465, 152)">
                    <rect
                      x="-4"
                      y="-4"
                      width="8"
                      height="8"
                      fill="#FFFFFF"
                      stroke="#0284C7"
                      strokeWidth="1.75"
                      transform="rotate(45)"
                    />
                    <text
                      x="-18"
                      y="-12"
                      fill="#475569"
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="JetBrains Mono"
                    >
                      MCC-04 BURN
                    </text>
                  </g>
                </g>

                {/* Crosshair Probe Overlay */}
                {probe && (
                  <g pointerEvents="none">
                    <line
                      x1={probe.x}
                      y1="0"
                      x2={probe.x}
                      y2="380"
                      stroke="#0284C7"
                      strokeOpacity="0.45"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="0"
                      y1={probe.y}
                      x2="720"
                      y2={probe.y}
                      stroke="#0284C7"
                      strokeOpacity="0.45"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={probe.x}
                      cy={probe.y}
                      r="4"
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="1.5"
                    />
                  </g>
                )}
              </svg>

              {/* Corner Attitude & Vector Readout Overlay */}
              <div className="grid grid-cols-3 gap-2 p-3 border-t border-[#CBD5E1] bg-white/95">
                <div>
                  <span className="label-caps text-[#475569]">PITCH</span>
                  <div className="telemetry-sm text-[#0284C7] font-semibold mt-0.5">
                    {pitchDeg}°
                  </div>
                </div>
                <div>
                  <span className="label-caps text-[#475569]">YAW</span>
                  <div className="telemetry-sm text-[#0284C7] font-semibold mt-0.5">
                    {yawDeg}°
                  </div>
                </div>
                <div>
                  <span className="label-caps text-[#475569]">ROLL</span>
                  <div className="telemetry-sm text-[#0284C7] font-semibold mt-0.5">
                    {rollDeg}°
                  </div>
                </div>
              </div>
            </div>

            {/* Burn Countdown & Vector Alignment Challenge Strip */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 p-3 rounded-[6px] bg-[#F4F9FD] border border-[#D5E5F2]">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <div className="label-caps text-[#475569]">
                    MCC-04 BURN COUNTDOWN
                  </div>
                  <div className="telemetry-md font-semibold text-[#0F172A] mt-0.5 tabular-nums">
                    {formatCountdown(burnCountdownSec)}
                  </div>
                </div>
                <div>
                  <div className="label-caps text-[#475569]">REQUIRED Δv</div>
                  <div className="telemetry-md font-semibold text-[#0284C7] mt-0.5 tabular-nums">
                    142.8 <span className="text-xs text-[#64748B]">m/s</span>
                  </div>
                </div>
                <div>
                  <div className="label-caps text-[#475569]">THROTTLE</div>
                  <div className="telemetry-md font-semibold text-[#0F172A] mt-0.5 tabular-nums">
                    {burnActive ? `${burnThrottlePct}%` : '0%'}
                  </div>
                </div>
                <div>
                  <div className="label-caps text-[#475569]">
                    {isTr ? 'VEKTÖR HİZALAMA' : 'ALIGNMENT'}
                  </div>
                  <div
                    className={`telemetry-md font-semibold mt-0.5 tabular-nums ${
                      alignmentPct === 100
                        ? 'text-[#059669]'
                        : 'text-[#D97706]'
                    }`}
                  >
                    {alignmentPct}%
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {orbitalAlignedClaimed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[#ECFDF5] border border-[#6EE7B7] text-[#047857] text-xs font-semibold whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isTr ? 'Vektör Kilidi Açıldı (+50 XP)' : 'Vector Lock Verified (+50 XP)'}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!vectorReady}
                    onClick={() => onClaimOrbitalAlignment?.()}
                    title={
                      vectorReady
                        ? isTr
                          ? '%100 yörünge vektör kilidini onayla ve +50 XP kazan'
                          : 'Verify 100% vector alignment for +50 XP'
                        : isTr
                          ? 'RCS Gimbal, Star Tracker ve Thermal Loop B açık olmalı'
                          : 'Enable RCS Gimbal, Star Tracker & Thermal Loop B'
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-colors ${
                      vectorReady
                        ? 'bg-[#059669] text-white hover:bg-[#047857] shadow-sm'
                        : 'bg-[#E2E8F0] text-[#64748B] cursor-not-allowed'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>
                      {isTr
                        ? vectorReady
                          ? 'Vektör Kilidini Doğrula (+50 XP)'
                          : '3 Alt Sistemi Aç (%100)'
                        : vectorReady
                          ? 'Verify Vector Lock (+50 XP)'
                          : 'Enable 3 Subsystems (100%)'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onToggleBurn}
                  className={`px-4 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7] ${
                    burnActive
                      ? 'bg-[#E0F2FE] border border-[#0284C7] text-[#0284C7] hover:bg-[#BAE6FD]/60'
                      : 'bg-[#0284C7] text-white hover:bg-[#0369A1] shadow-sm'
                  }`}
                >
                  {burnActive ? 'Hold Burn' : 'Engage Burn'}
                </button>
              </div>
            </div>
          </HudCard>
        </div>
      </div>

      {/* Bottom Time-Series & Multi-Channel Telemetry Tray */}
      <HudCard
        title="Propulsion Chamber Thermal & Isp Efficiency Telemetry"
        rightSlot={
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-[#0284C7] font-semibold">
              TEMP: {hoveredSample?.chamberTempK} K
            </span>
            <span className="text-[#4F46E5] font-semibold">
              ISP EFF: {hoveredSample?.ispEffPct}%
            </span>
            <span className="text-[#475569] hidden sm:inline">
              {hoveredSample?.tLabel}
            </span>
          </div>
        }
      >
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full min-w-[540px] h-[170px] cursor-crosshair bg-[#F0F9FF] rounded-[6px] border border-[#D5E5F2]"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = ((e.clientX - rect.left) / rect.width) * chartW;
              const ratio = (relX - padL) / innerW;
              const idx = Math.round(ratio * (waveforms.length - 1));
              if (idx >= 0 && idx < waveforms.length) {
                setChartHoverIdx(idx);
              }
            }}
            onMouseLeave={() => setChartHoverIdx(null)}
          >
            {/* Horizontal Reference Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = padT + t * innerH;
              return (
                <line
                  key={t}
                  x1={padL}
                  y1={y}
                  x2={chartW - padR}
                  y2={y}
                  stroke="#CBD5E1"
                  strokeWidth="1"
                />
              );
            })}

            {/* Left Axis Labels (Temp K) */}
            <text
              x={padL - 8}
              y={padT + 4}
              textAnchor="end"
              fill="#475569"
              fontSize="10"
              fontFamily="JetBrains Mono"
            >
              1260K
            </text>
            <text
              x={padL - 8}
              y={padT + innerH}
              textAnchor="end"
              fill="#475569"
              fontSize="10"
              fontFamily="JetBrains Mono"
            >
              1080K
            </text>

            {/* Right Axis Labels (Isp %) */}
            <text
              x={chartW - padR + 8}
              y={padT + 4}
              textAnchor="start"
              fill="#4F46E5"
              fontSize="10"
              fontFamily="JetBrains Mono"
            >
              98%
            </text>
            <text
              x={chartW - padR + 8}
              y={padT + innerH}
              textAnchor="start"
              fill="#4F46E5"
              fontSize="10"
              fontFamily="JetBrains Mono"
            >
              86%
            </text>

            {/* Chamber Temp Polyline */}
            <polyline
              fill="none"
              stroke={condition === 'emergency' ? '#DC2626' : '#0284C7'}
              strokeWidth="2.25"
              points={tempPoints}
            />

            {/* Isp Efficiency Dashed Polyline */}
            <polyline
              fill="none"
              stroke="#4F46E5"
              strokeWidth="1.9"
              strokeDasharray="5 3"
              points={effPoints}
            />

            {/* Hover Crosshair Marker */}
            {chartHoverIdx !== null && waveforms[chartHoverIdx] && (
              <g>
                <line
                  x1={
                    padL +
                    (chartHoverIdx / Math.max(1, waveforms.length - 1)) * innerW
                  }
                  y1={padT}
                  x2={
                    padL +
                    (chartHoverIdx / Math.max(1, waveforms.length - 1)) * innerW
                  }
                  y2={padT + innerH}
                  stroke="#0284C7"
                  strokeOpacity="0.5"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={
                    padL +
                    (chartHoverIdx / Math.max(1, waveforms.length - 1)) * innerW
                  }
                  cy={
                    padT +
                    innerH -
                    ((waveforms[chartHoverIdx].chamberTempK - 1080) /
                      (1260 - 1080)) *
                      innerH
                  }
                  r="4"
                  fill="#0284C7"
                />
              </g>
            )}

            {/* X-axis timestamps */}
            {[0, 7, 14, 21, waveforms.length - 1].map((idx) => {
              const sample = waveforms[idx];
              if (!sample) return null;
              const x = padL + (idx / Math.max(1, waveforms.length - 1)) * innerW;
              return (
                <text
                  key={idx}
                  x={x}
                  y={chartH - 6}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                >
                  {sample.tLabel}
                </text>
              );
            })}
          </svg>
        </div>
      </HudCard>
    </div>
  );
};
