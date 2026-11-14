import React, { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import {
  CrewActivityLoad,
  CrewMember,
  CrewSensorControl,
  OperatorProfile,
  SubsystemToggles,
  SystemScrubbers,
  SystemSeverity,
} from '../../types/telemetry';
import { INITIAL_CREW_SENSORS } from '../../data/telemetryEngine';
import { formatBodyTemp, formatPressure } from '../../utils/unitFormatters';
import { HudCard, HudScrubber, HudToggle, StatusChip } from '../HudPrimitives';
import { FirstAidCrisisSimulator } from '../FirstAidCrisisSimulator';
import { AstronautWellnessGame } from '../AstronautWellnessGame';

interface CrewEvaScreenProps {
  crew: CrewMember[];
  selectedCrewId: string;
  onSelectCrew: (id: string) => void;
  crewSensorControls: Record<string, CrewSensorControl>;
  onCrewSensorChange: (
    crewId: string,
    patch: Partial<CrewSensorControl>
  ) => void;
  toggles: SubsystemToggles;
  onToggle: (key: keyof SubsystemToggles, val: boolean) => void;
  scrubbers: SystemScrubbers;
  onScrubberChange: (key: keyof SystemScrubbers, val: number) => void;
  condition: SystemSeverity;
  tick: number;
  profile: OperatorProfile;
  onFirstAidScore?: (points: number) => void;
  onWellnessXpEarned?: (xp: number, reason: string) => void;
  onOpenPsychAi?: (tab?: 'chat' | 'train') => void;
}

function buildEcgPath(
  phase: number,
  hr: number,
  noiseFilter: boolean,
  active: boolean
): string {
  const pts: string[] = [];
  const width = 140;
  const mid = 18;
  if (!active) {
    return `0,${mid} ${width},${mid}`;
  }
  const freq = Math.max(0.8, hr / 68);
  for (let x = 0; x <= width; x += 3) {
    const t = ((x / width) * 2.2 * freq + phase) % 1;
    let y = mid;
    if (t > 0.15 && t < 0.23) {
      y = mid - 3;
    } else if (t >= 0.3 && t < 0.34) {
      y = mid + 4;
    } else if (t >= 0.34 && t < 0.39) {
      y = mid - 14;
    } else if (t >= 0.39 && t < 0.44) {
      y = mid + 6;
    } else if (t >= 0.56 && t < 0.7) {
      y = mid - 4.5 * Math.sin(((t - 0.56) / 0.14) * Math.PI);
    }
    if (!noiseFilter) {
      y += Math.sin(x * 1.9 + phase * 18) * 2.2;
    }
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

export const CrewEvaScreen: React.FC<CrewEvaScreenProps> = ({
  crew,
  selectedCrewId,
  onSelectCrew,
  crewSensorControls,
  onCrewSensorChange,
  toggles,
  onToggle,
  scrubbers,
  onScrubberChange,
  condition,
  tick,
  profile,
  onFirstAidScore,
  onWellnessXpEarned,
  onOpenPsychAi,
}) => {
  const [airlockEqualizing, setAirlockEqualizing] = useState(false);

  const selectedCrew = useMemo(
    () => crew.find((c) => c.id === selectedCrewId) ?? crew[0],
    [crew, selectedCrewId]
  );

  const selectedSensor =
    crewSensorControls[selectedCrew.id] ??
    INITIAL_CREW_SENSORS[selectedCrew.id] ?? {
      o2FlowRateLpm: 1.8,
      coolingLoopPct: 65,
      activityLoad: 'nominal' as CrewActivityLoad,
      sensorActive: true,
      sensorNoiseFilter: true,
    };

  const radarAxes = useMemo(() => {
    if (!selectedCrew.sensorActive) {
      return [
        { label: 'O2 SAT', value: 0, max: 100 },
        { label: 'CO2 SCRUB', value: 0, max: 100 },
        { label: 'SUIT SEAL', value: 0, max: 100 },
        { label: 'THERM LOOP', value: 0, max: 100 },
        { label: 'HYDRATION', value: 0, max: 100 },
        { label: 'RAD SHIELD', value: 0, max: 100 },
      ];
    }
    const co2Score = Math.max(
      45,
      Math.min(100, 100 - ((selectedCrew.co2Ppm - 380) / 700) * 50)
    );
    const radScore = Math.max(
      40,
      Math.min(100, 100 - ((selectedCrew.radDoseMsv - 12) / 20) * 50)
    );
    return [
      { label: 'O2 SAT', value: selectedCrew.spo2, max: 100 },
      { label: 'CO2 SCRUB', value: co2Score, max: 100 },
      { label: 'SUIT SEAL', value: selectedCrew.suitIntegrityPct, max: 100 },
      { label: 'THERM LOOP', value: selectedCrew.thermalLoopPct, max: 100 },
      { label: 'HYDRATION', value: selectedCrew.hydrationPct, max: 100 },
      { label: 'RAD SHIELD', value: radScore, max: 100 },
    ];
  }, [selectedCrew]);

  const cx = 140;
  const cy = 130;
  const maxR = 88;

  const radarPolygon = radarAxes
    .map((axis, i) => {
      const angle = (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
      const r = (axis.value / axis.max) * maxR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const isTr = profile.guideLanguage === 'tr';

  const hasEmergencyCrew = crew.some((c) => c.status === 'emergency');
  const hasAdvisoryCrew = crew.some(
    (c) => !c.sensorActive || c.status === 'advisory'
  );
  const screenPsychState =
    hasEmergencyCrew || condition === 'emergency'
      ? 'emergency'
      : hasAdvisoryCrew || condition === 'advisory'
        ? 'advisory'
        : 'nominal';

  return (
    <div className="space-y-6">
      {/* Color Psychology Cognitive Ergonomics Strip */}
      <div
        className={`p-3.5 rounded-[6px] border flex flex-wrap items-center justify-between gap-4 transition-colors duration-200 ${
          screenPsychState === 'emergency'
            ? 'bg-[#FEF2F2] border-[#FCA5A5]'
            : screenPsychState === 'advisory'
              ? 'bg-[#FFFBEB] border-[#FCD34D]'
              : 'bg-gradient-to-r from-[#ECFDF5] via-[#F0F9FF] to-white border-[#7DD3FC]'
        }`}
      >
        <div className="space-y-0.5">
          <div
            className={`label-caps ${
              screenPsychState === 'emergency'
                ? 'text-[#B91C1C]'
                : screenPsychState === 'advisory'
                  ? 'text-[#B45309]'
                  : 'text-[#0284C7]'
            }`}
          >
            {isTr
              ? 'RENK PSİKOLOJİSİ VE BİLİŞSEL ERGONOMİ MODU'
              : 'COLOR PSYCHOLOGY & COGNITIVE ERGONOMICS'}
          </div>
          <p className="text-xs text-[#334155]">
            {screenPsychState === 'emergency'
              ? isTr
                ? 'Mercan Kırmızısı (Acil Triyaj): Çevresel dikkat dağınıklığını keser ve odağı hayati ilkyardım kontrollerine kilitler.'
                : 'Urgent Coral Red (Critical Triage): Suppresses peripheral clutter and locks motor focus onto life-saving interventions.'
              : screenPsychState === 'advisory'
                ? isTr
                  ? 'Güneş Kehribarı (Seçici Dikkat): Panik yaratmadan erken sapmaları fark ettirir ve önleyici ayar yapmaya yönlendirir.'
                  : 'Vigilant Amber (Preventive Caution): Elevates selective attention without inducing panic so drifts are corrected early.'
                : isTr
                  ? 'Ferah Gökyüzü & Nane Yeşili (İç Açıcı Bilişsel Sakinlik): Stresi düşük tutar, uzun süreli izlemede göz yorgunluğunu azaltır.'
                  : 'Sky Glacier & Bio-Vital Mint: Keeps cortisol low, boosts visual clarity, and signals physiological homeostasis across all 4 crew.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono font-semibold shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[#0284C7]">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0284C7]" />
            {isTr ? 'Sakin Odak' : 'Calm Focus'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#059669]">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#059669]" />
            {isTr ? 'Biyolojik Güven' : 'Bio-Safety'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#D97706]">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#D97706]" />
            {isTr ? 'Erken Uyarı' : 'Vigilance'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#DC2626]">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DC2626]" />
            {isTr ? 'Acil Triyaj' : 'Urgent Triage'}
          </span>
          {onOpenPsychAi && (
            <div className="flex items-center gap-1.5 ml-1 font-sans">
              <button
                type="button"
                onClick={() => onOpenPsychAi('chat')}
                className="px-2.5 py-1 rounded-[4px] bg-[#0284C7] text-white text-[11px] font-semibold hover:bg-[#0369A1] transition-colors"
              >
                {isTr ? 'Aura-Psy Sohbet' : 'Aura-Psy Chat'}
              </button>
              <button
                type="button"
                onClick={() => onOpenPsychAi('train')}
                className="px-2.5 py-1 rounded-[4px] bg-white border border-[#0284C7] text-[#0284C7] text-[11px] font-semibold hover:bg-[#E0F2FE] transition-colors"
              >
                {isTr ? 'AI Eğit' : 'Train AI'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Crew Biometric Health Indicator Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {crew.map((member) => {
          const isSelected = member.id === selectedCrew.id;
          const effectiveStatus: SystemSeverity = !member.sensorActive
            ? 'advisory'
            : member.heartRate > profile.hrAlertThresholdBpm &&
                member.status === 'nominal'
              ? 'advisory'
              : member.status;

          const cardTier =
            effectiveStatus === 'emergency'
              ? 'emergency'
              : effectiveStatus === 'advisory'
                ? 'warning'
                : isSelected
                  ? 'focused'
                  : 'default';

          const ecgColor = !member.sensorActive
            ? '#64748B'
            : effectiveStatus === 'emergency'
              ? '#DC2626'
              : effectiveStatus === 'advisory'
                ? '#D97706'
                : '#059669';

          const suitFormatted = formatPressure(
            member.suitPressure,
            profile.pressureUnit,
            1
          );
          const tempFormatted = formatBodyTemp(
            member.coreTemp,
            profile.tempUnit
          );

          return (
            <div
              key={member.id}
              onClick={() => onSelectCrew(member.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectCrew(member.id);
                }
              }}
              role="button"
              tabIndex={0}
              className="text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0284C7] rounded-[6px]"
            >
              <HudCard
                title={member.callsign}
                tier={cardTier}
                rightSlot={
                  <StatusChip
                    status={effectiveStatus}
                    label={!member.sensorActive ? 'SENSOR OFF' : undefined}
                  />
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-base font-semibold text-[#0F172A]">
                      {member.name}
                    </div>
                    <div className="text-xs text-[#475569] mt-0.5">
                      {member.role} · {member.station}
                    </div>
                  </div>
                </div>

                {/* Live ECG Sensor Strip */}
                <div className="mt-3 hud-trough px-2 py-1.5 flex items-center justify-between gap-2">
                  <svg
                    viewBox="0 0 140 36"
                    className="w-full h-9 overflow-visible"
                    aria-hidden="true"
                  >
                    <polyline
                      fill="none"
                      stroke={ecgColor}
                      strokeWidth="1.8"
                      points={buildEcgPath(
                        member.ecgPhase + tick * 0.08,
                        member.heartRate,
                        member.sensorNoiseFilter,
                        member.sensorActive
                      )}
                    />
                  </svg>
                  <div className="text-right shrink-0">
                    <span
                      className="telemetry-md font-semibold"
                      style={{ color: ecgColor }}
                    >
                      {member.sensorActive ? member.heartRate : '--'}
                    </span>
                    <span className="text-[11px] font-mono text-[#64748B] ml-1">
                      bpm
                    </span>
                  </div>
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#E2E8F0]">
                  <div>
                    <div className="label-caps text-[#475569]">SPO2</div>
                    <div
                      className={`telemetry-sm mt-0.5 font-semibold ${
                        !member.sensorActive
                          ? 'text-[#64748B]'
                          : member.spo2 < 95
                            ? 'text-[#D97706]'
                            : 'text-[#059669]'
                      }`}
                    >
                      {member.sensorActive ? `${member.spo2.toFixed(1)}%` : '--'}
                    </div>
                  </div>
                  <div>
                    <div className="label-caps text-[#475569]">CORE</div>
                    <div className="telemetry-sm text-[#0F172A] mt-0.5 font-semibold">
                      {member.sensorActive
                        ? `${tempFormatted.value}${tempFormatted.unitLabel}`
                        : '--'}
                    </div>
                  </div>
                  <div>
                    <div className="label-caps text-[#475569]">SUIT</div>
                    <div className="telemetry-sm text-[#0284C7] mt-0.5 font-semibold">
                      {suitFormatted.value} {suitFormatted.unitLabel}
                    </div>
                  </div>
                </div>
              </HudCard>
            </div>
          );
        })}
      </div>

      {/* Gamified Astronaut Character Exercise & Space Diet Studio */}
      <AstronautWellnessGame
        crewMember={selectedCrew}
        sensorControl={selectedSensor}
        onCrewSensorChange={onCrewSensorChange}
        guideLanguage={profile.guideLanguage}
        onWellnessXpEarned={onWellnessXpEarned}
      />

      {/* Gamified First-Aid Crisis Simulation Videos */}
      <FirstAidCrisisSimulator
        crewMember={selectedCrew}
        sensorControl={selectedSensor}
        onCrewSensorChange={onCrewSensorChange}
        guideLanguage={profile.guideLanguage}
        onScoreEarned={onFirstAidScore}
      />

      {/* Interactive Biometric Sensor Controls + 6-Axis Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Biometric Health Sensor Interaction Console */}
        <div className="lg:col-span-6 flex flex-col">
          <HudCard
            title={`Health Sensor Controls — ${selectedCrew.name}`}
            tier={!selectedCrew.sensorActive ? 'warning' : 'focused'}
            className="flex-1"
            rightSlot={
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#0284C7]" />
                <span className="label-caps text-[#0284C7]">
                  {selectedCrew.callsign}
                </span>
              </div>
            }
          >
            <div className="space-y-4">
              {profile.showExplanations && (
                <p className="text-xs text-[#475569] leading-relaxed">
                  {isTr
                    ? 'Seçili astronotun O₂ besleme vanası, soğutma döngüsü ve metabolik yük sensörlerini değiştirerek sağlık belirteçlerinin canlı tepkisini test edin.'
                    : 'Adjust the selected crew member’s suit O₂ regulator, cooling garment flow, and biometric sensors to see live health indicator responses.'}
                </p>
              )}

              {/* Activity / Metabolic Sensor Mode */}
              <div>
                <div className="label-caps text-[#475569] mb-2">
                  {isTr
                    ? 'METABOLİK / FİZİKSEL YÜK SENSÖRÜ'
                    : 'METABOLIC WORKLOAD SENSOR'}
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 hud-trough">
                  {(
                    [
                      ['resting', isTr ? 'Dinlenme' : 'Resting'],
                      ['nominal', isTr ? 'Normal Nöbet' : 'Nominal'],
                      ['eva-exertion', isTr ? 'EVA Eforu' : 'EVA Exertion'],
                    ] as Array<[CrewActivityLoad, string]>
                  ).map(([mode, label]) => {
                    const active = selectedSensor.activityLoad === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() =>
                          onCrewSensorChange(selectedCrew.id, {
                            activityLoad: mode,
                          })
                        }
                        className={`py-2 px-2 rounded-[4px] text-xs font-medium whitespace-nowrap transition-colors ${
                          active
                            ? 'bg-[#E0F2FE] text-[#0284C7] border border-[#0284C7]/45 font-semibold'
                            : 'text-[#475569] hover:text-[#0F172A]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Sensor Regulators */}
              <div className="hud-trough px-3 py-2 divide-y divide-[#E2E8F0]">
                <HudScrubber
                  label={
                    isTr
                      ? 'Giysi O₂ Besleme Debisi'
                      : 'Suit O₂ Feed Flow Rate'
                  }
                  value={selectedSensor.o2FlowRateLpm}
                  min={0.6}
                  max={3.0}
                  step={0.1}
                  unit="L/m"
                  onChange={(v) =>
                    onCrewSensorChange(selectedCrew.id, { o2FlowRateLpm: v })
                  }
                />
                <HudScrubber
                  label={
                    isTr
                      ? 'Sıvı Soğutma Döngüsü (LCG)'
                      : 'Liquid Cooling Loop Flow'
                  }
                  value={selectedSensor.coolingLoopPct}
                  min={10}
                  max={100}
                  step={2}
                  unit="%"
                  onChange={(v) =>
                    onCrewSensorChange(selectedCrew.id, { coolingLoopPct: v })
                  }
                />
              </div>

              {/* Sensor Bus & Signal Processing Switches */}
              <div className="border-t border-[#E2E8F0] pt-1">
                <HudToggle
                  label={
                    isTr
                      ? 'Biyometrik Sensör Hattı (ECG / SpO₂)'
                      : 'Biometric Sensor Bus (ECG / SpO₂)'
                  }
                  sublabel={
                    isTr
                      ? 'Kapalıyken sağlık verisi akışı kesilir'
                      : 'Disabling simulates medical telemetry sensor dropout'
                  }
                  checked={selectedSensor.sensorActive}
                  onChange={(v) =>
                    onCrewSensorChange(selectedCrew.id, { sensorActive: v })
                  }
                />
                <HudToggle
                  label={
                    isTr
                      ? 'Kalman Gürültü Filtresi'
                      : 'Kalman Signal Noise Filter'
                  }
                  sublabel={
                    isTr
                      ? 'Kapalıyken ham filtrelenmemiş EKG sinyali gösterilir'
                      : 'Toggle raw unfiltered PPG/ECG jitter on vital waveform'
                  }
                  checked={selectedSensor.sensorNoiseFilter}
                  onChange={(v) =>
                    onCrewSensorChange(selectedCrew.id, {
                      sensorNoiseFilter: v,
                    })
                  }
                />
              </div>

              {/* Quick Sensor Simulation Triggers */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    onCrewSensorChange(selectedCrew.id, {
                      o2FlowRateLpm: 0.9,
                      coolingLoopPct: 24,
                      activityLoad: 'eva-exertion',
                      sensorActive: true,
                    })
                  }
                  className="px-3 py-2 rounded-[6px] bg-[#FEF3C7] border border-[#F59E0B] text-[#B45309] text-xs font-semibold hover:bg-[#FDE68A] transition-colors"
                >
                  {isTr ? 'Hipoksi / Isı Testi' : 'Test Hypoxia & Heat'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onCrewSensorChange(selectedCrew.id, {
                      o2FlowRateLpm: 1.9,
                      coolingLoopPct: 68,
                      activityLoad: 'nominal',
                      sensorActive: true,
                      sensorNoiseFilter: true,
                    })
                  }
                  className="px-3 py-2 rounded-[6px] bg-[#0284C7] text-white text-xs font-semibold hover:bg-[#0369A1] shadow-sm transition-all"
                >
                  {isTr ? 'Sensörleri Kalibre Et' : 'Calibrate Nominal'}
                </button>
              </div>
            </div>
          </HudCard>
        </div>

        {/* 6-Axis Radar Calibration Chart */}
        <div className="lg:col-span-6 flex flex-col">
          <HudCard
            title={`Suit & Metabolic Calibration — ${selectedCrew.name}`}
            tier="default"
            className="flex-1"
            rightSlot={
              <span className="label-caps text-[#0284C7]">
                6-AXIS BIOMETRIC TELEMETRY
              </span>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1">
              <div className="sm:col-span-7 flex justify-center">
                <svg
                  viewBox="0 0 280 260"
                  className="w-full max-w-[290px] h-[250px]"
                >
                  {[0.33, 0.66, 1].map((scale) => {
                    const ringPts = radarAxes
                      .map((_, i) => {
                        const angle =
                          (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
                        const x = cx + Math.cos(angle) * maxR * scale;
                        const y = cy + Math.sin(angle) * maxR * scale;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ');
                    return (
                      <polygon
                        key={scale}
                        points={ringPts}
                        fill="none"
                        stroke="#CBD5E1"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {radarAxes.map((axis, i) => {
                    const angle =
                      (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
                    const x2 = cx + Math.cos(angle) * maxR;
                    const y2 = cy + Math.sin(angle) * maxR;
                    const lx = cx + Math.cos(angle) * (maxR + 22);
                    const ly = cy + Math.sin(angle) * (maxR + 18);
                    return (
                      <g key={axis.label}>
                        <line
                          x1={cx}
                          y1={cy}
                          x2={x2}
                          y2={y2}
                          stroke="#CBD5E1"
                          strokeWidth="1"
                        />
                        <text
                          x={lx}
                          y={ly + 3}
                          textAnchor="middle"
                          fill="#475569"
                          fontSize="9"
                          fontWeight="600"
                          fontFamily="JetBrains Mono"
                        >
                          {axis.label}
                        </text>
                      </g>
                    );
                  })}

                  <polygon
                    points={radarPolygon}
                    fill={
                      selectedCrew.status === 'emergency'
                        ? 'rgba(220, 38, 38, 0.20)'
                        : 'rgba(2, 132, 199, 0.18)'
                    }
                    stroke={
                      selectedCrew.status === 'emergency'
                        ? '#DC2626'
                        : '#0284C7'
                    }
                    strokeWidth="2.2"
                  />

                  {radarAxes.map((axis, i) => {
                    const angle =
                      (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
                    const r = (axis.value / axis.max) * maxR;
                    return (
                      <circle
                        key={axis.label}
                        cx={cx + Math.cos(angle) * r}
                        cy={cy + Math.sin(angle) * r}
                        r="3.2"
                        fill="#0284C7"
                        stroke="#FFFFFF"
                        strokeWidth="1.2"
                      />
                    );
                  })}
                </svg>
              </div>

              <div className="sm:col-span-5 space-y-2.5">
                {radarAxes.map((axis) => (
                  <div
                    key={axis.label}
                    className="hud-trough px-3 py-2 flex items-center justify-between"
                  >
                    <span className="label-caps text-[#475569]">
                      {axis.label}
                    </span>
                    <span className="telemetry-sm text-[#0284C7] font-semibold">
                      {selectedCrew.sensorActive
                        ? `${axis.value.toFixed(1)}%`
                        : '--'}
                    </span>
                  </div>
                ))}
                <div className="hud-trough px-3 py-2 flex items-center justify-between">
                  <span className="label-caps text-[#475569]">CO₂ / RAD</span>
                  <span
                    className={`telemetry-sm font-semibold ${
                      condition === 'emergency'
                        ? 'text-[#DC2626]'
                        : 'text-[#0F172A]'
                    }`}
                  >
                    {selectedCrew.co2Ppm} ppm
                  </span>
                </div>
              </div>
            </div>
          </HudCard>
        </div>
      </div>

      {/* EVA Airlock & Suit Life Support Controls */}
      <HudCard
        title="Airlock Module 2 & EVA Suit Pre-Breathe"
        tier={airlockEqualizing ? 'focused' : 'default'}
        rightSlot={
          <StatusChip
            status={toggles.airlockOuterSeal ? 'nominal' : 'advisory'}
            label={toggles.airlockOuterSeal ? 'SEAL LOCKED' : 'SEAL UNLOCKED'}
          />
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">CHAMBER</div>
                <div className="telemetry-md font-semibold text-[#0284C7] mt-1">
                  {
                    formatPressure(
                      airlockEqualizing ? scrubbers.airlockTargetKpa : 44.2,
                      profile.pressureUnit,
                      1
                    ).value
                  }{' '}
                  <span className="text-xs text-[#64748B]">
                    {profile.pressureUnit}
                  </span>
                </div>
              </div>
              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">CO2 PARTIAL</div>
                <div className="telemetry-md font-semibold text-[#059669] mt-1">
                  {selectedCrew.co2Ppm}{' '}
                  <span className="text-xs text-[#64748B]">ppm</span>
                </div>
              </div>
              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">O2 RESERVE</div>
                <div className="telemetry-md font-semibold text-[#0F172A] mt-1">
                  06:42 <span className="text-xs text-[#64748B]">hrs</span>
                </div>
              </div>
            </div>

            <HudScrubber
              label="Target Airlock Pressure"
              value={scrubbers.airlockTargetKpa}
              min={25.0}
              max={101.3}
              step={0.5}
              unit="kPa"
              onChange={(v) => onScrubberChange('airlockTargetKpa', v)}
            />
          </div>

          <div className="lg:col-span-6 space-y-3">
            <div className="hud-trough px-3 divide-y divide-[#E2E8F0]">
              <HudToggle
                label="Outer Hatch Mechanical Seal"
                sublabel="Dual-redundant pressure dogging latches"
                checked={toggles.airlockOuterSeal}
                onChange={(v) => onToggle('airlockOuterSeal', v)}
              />
              <HudToggle
                label="Suit Umbilical Power & O2"
                sublabel="Ship-to-PLSS high-pressure feed"
                checked={toggles.evaUmbilical}
                onChange={(v) => onToggle('evaUmbilical', v)}
              />
              <HudToggle
                label="Sublimator Water Cooling"
                sublabel="Liquid cooling garment loop (affects EVA-04 temp)"
                checked={toggles.sublimatorCooling}
                onChange={(v) => onToggle('sublimatorCooling', v)}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs font-mono text-[#475569]">
                {airlockEqualizing
                  ? `Equalizing chamber to ${scrubbers.airlockTargetKpa.toFixed(1)} kPa`
                  : 'Chamber holding intermediate pre-breathe pressure'}
              </span>
              <button
                type="button"
                onClick={() => setAirlockEqualizing((e) => !e)}
                className={`px-4 py-2 rounded-[6px] text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  airlockEqualizing
                    ? 'bg-[#E0F2FE] border border-[#0284C7] text-[#0284C7] hover:bg-[#BAE6FD]/60'
                    : 'bg-[#0284C7] text-white hover:bg-[#0369A1] shadow-sm'
                }`}
              >
                {airlockEqualizing ? 'Hold Pressure' : 'Equalize Chamber'}
              </button>
            </div>
          </div>
        </div>
      </HudCard>
    </div>
  );
};
