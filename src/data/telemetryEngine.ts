import {
  CrewMember,
  CrewSensorControl,
  SubsystemToggles,
  SystemScrubbers,
  SystemSeverity,
  TelemetryPacket,
  TerrainCell,
  WaveformSample,
} from '../types/telemetry';

export const INITIAL_CREW: CrewMember[] = [
  {
    id: 'cdr-01',
    callsign: 'ARTEMIS-01',
    name: 'Elena Vance',
    role: 'Mission Commander',
    station: 'Flight Deck · Seat A',
    heartRate: 68,
    spo2: 99.1,
    coreTemp: 36.8,
    suitPressure: 101.3,
    co2Ppm: 410,
    radDoseMsv: 14.2,
    hydrationPct: 94,
    thermalLoopPct: 96,
    suitIntegrityPct: 99,
    ecgPhase: 0,
    sensorActive: true,
    sensorNoiseFilter: true,
    status: 'nominal',
  },
  {
    id: 'plt-02',
    callsign: 'ARTEMIS-02',
    name: 'Marcus Chen',
    role: 'Flight Pilot',
    station: 'Flight Deck · Seat B',
    heartRate: 72,
    spo2: 98.7,
    coreTemp: 36.9,
    suitPressure: 101.2,
    co2Ppm: 425,
    radDoseMsv: 14.4,
    hydrationPct: 91,
    thermalLoopPct: 95,
    suitIntegrityPct: 99,
    ecgPhase: 1.4,
    sensorActive: true,
    sensorNoiseFilter: true,
    status: 'nominal',
  },
  {
    id: 'fe-03',
    callsign: 'ARTEMIS-03',
    name: 'Aria Lindqvist',
    role: 'Flight Engineer',
    station: 'ECLSS & Propulsion Bay',
    heartRate: 64,
    spo2: 99.4,
    coreTemp: 36.7,
    suitPressure: 101.3,
    co2Ppm: 398,
    radDoseMsv: 13.9,
    hydrationPct: 96,
    thermalLoopPct: 97,
    suitIntegrityPct: 98,
    ecgPhase: 2.7,
    sensorActive: true,
    sensorNoiseFilter: true,
    status: 'nominal',
  },
  {
    id: 'eva-04',
    callsign: 'ARTEMIS-04',
    name: 'Tariq Al-Mansoor',
    role: 'EVA Payload Specialist',
    station: 'Airlock Module 2',
    heartRate: 84,
    spo2: 97.8,
    coreTemp: 37.1,
    suitPressure: 29.8,
    co2Ppm: 495,
    radDoseMsv: 16.8,
    hydrationPct: 86,
    thermalLoopPct: 89,
    suitIntegrityPct: 97,
    ecgPhase: 3.9,
    sensorActive: true,
    sensorNoiseFilter: true,
    status: 'nominal',
  },
];

export const INITIAL_CREW_SENSORS: Record<string, CrewSensorControl> = {
  'cdr-01': {
    o2FlowRateLpm: 1.9,
    coolingLoopPct: 68,
    activityLoad: 'nominal',
    sensorActive: true,
    sensorNoiseFilter: true,
  },
  'plt-02': {
    o2FlowRateLpm: 1.8,
    coolingLoopPct: 65,
    activityLoad: 'nominal',
    sensorActive: true,
    sensorNoiseFilter: true,
  },
  'fe-03': {
    o2FlowRateLpm: 1.9,
    coolingLoopPct: 70,
    activityLoad: 'resting',
    sensorActive: true,
    sensorNoiseFilter: true,
  },
  'eva-04': {
    o2FlowRateLpm: 2.2,
    coolingLoopPct: 62,
    activityLoad: 'eva-exertion',
    sensorActive: true,
    sensorNoiseFilter: true,
  },
};

export const INITIAL_TOGGLES: SubsystemToggles = {
  rcsGimbalLock: true,
  eclssAutoScrub: true,
  starTrackerOptical: true,
  thermalLoopB: true,
  solarArrayTrack: true,
  kilopowerBus: true,
  highGainDish: true,
  airlockOuterSeal: true,
  evaUmbilical: false,
  sublimatorCooling: true,
};

export const INITIAL_SCRUBBERS: SystemScrubbers = {
  o2MixPct: 21.2,
  coolantFlowLpm: 18.4,
  radiatorLouverDeg: 64,
  airlockTargetKpa: 29.6,
  burnThrottlePct: 88,
};

export const INITIAL_PACKETS: TelemetryPacket[] = [
  {
    id: 'PKT-9042',
    timestampMet: 'T+142:17:48.1',
    frameCode: 'NAV-VECTOR-SYNC',
    destination: 'DSN-MADRID-65',
    sizeKb: 128.4,
    progressPct: 100,
    status: 'acknowledged',
  },
  {
    id: 'PKT-9043',
    timestampMet: 'T+142:18:02.6',
    frameCode: 'ECLSS-BIO-TELEM',
    destination: 'DSN-GOLDSTONE-14',
    sizeKb: 64.0,
    progressPct: 68,
    status: 'transmitting',
  },
  {
    id: 'PKT-9044',
    timestampMet: 'T+142:18:04.0',
    frameCode: 'SPEC-MAP-ARCADIA',
    destination: 'DSN-CANBERRA-43',
    sizeKb: 256.8,
    progressPct: 18,
    status: 'transmitting',
  },
];

export function generateInitialWaveforms(): WaveformSample[] {
  const samples: WaveformSample[] = [];
  for (let i = 0; i < 28; i++) {
    const mins = 27 - i;
    const tLabel = `-${String(mins).padStart(2, '0')}m`;
    const baseTemp = 1140 + Math.sin(i * 0.45) * 26 + (i > 20 ? (i - 20) * 3 : 0);
    const theoreticalEff = 94.8 - i * 0.04;
    const empEff = theoreticalEff - 1.2 + Math.cos(i * 0.5) * 0.7;
    samples.push({
      tLabel,
      chamberTempK: Number(baseTemp.toFixed(1)),
      ispEffPct: Number(empEff.toFixed(2)),
      theoreticalEffPct: Number(theoreticalEff.toFixed(2)),
      rcsPressureBar: Number((214.5 + Math.sin(i * 0.35) * 2.8).toFixed(1)),
    });
  }
  return samples;
}

export function generateArcadiaTerrain(): TerrainCell[] {
  const cells: TerrainCell[] = [];
  const rows = 10;
  const cols = 16;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wave =
        Math.sin(r * 0.65 + c * 0.35) * 0.45 +
        Math.cos(c * 0.45 - r * 0.25) * 0.35 +
        0.5;
      const clamped = Math.max(0.05, Math.min(0.98, wave));
      const elevationM = Math.round(-3820 + clamped * 460);
      const slopeDeg = Number((1.2 + Math.abs(Math.sin(r * 1.1 + c * 0.7)) * 11.4).toFixed(1));
      const icePct = Number((4.5 + (1 - clamped) * 28.4).toFixed(1));
      const solarHours = Number((10.2 + clamped * 3.1).toFixed(1));
      const thermalK = Math.round(198 + clamped * 38);
      cells.push({
        row: r,
        col: c,
        sectorId: `B4-${String.fromCharCode(65 + r)}${String(c + 1).padStart(2, '0')}`,
        elevationM,
        slopeDeg,
        icePct,
        solarHours,
        thermalK,
      });
    }
  }
  return cells;
}

export function formatMet(totalDeciseconds: number): string {
  const ds = totalDeciseconds % 10;
  const totalSec = Math.floor(totalDeciseconds / 10);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  return `T+${String(h).padStart(3, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ds}`;
}

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return `T-${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function applyConditionToCrew(
  crew: CrewMember[],
  condition: SystemSeverity,
  tick: number,
  crewSensors?: Record<string, CrewSensorControl>,
  toggles?: SubsystemToggles,
  scrubbers?: SystemScrubbers
): CrewMember[] {
  return crew.map((member, idx) => {
    const sensorCtrl = crewSensors?.[member.id] ?? INITIAL_CREW_SENSORS[member.id];
    const wave = Math.sin(tick * 0.4 + idx * 1.3);
    const noise = sensorCtrl?.sensorNoiseFilter
      ? 0
      : Math.sin(tick * 2.7 + idx * 3.1) * 3.5;

    const hrBoost = condition === 'emergency' ? 26 : condition === 'advisory' ? 10 : 0;
    const spo2Drop = condition === 'emergency' ? 3.5 : condition === 'advisory' ? 1.0 : 0;
    const tempBoost = condition === 'emergency' ? 0.6 : condition === 'advisory' ? 0.25 : 0;
    const co2Boost = condition === 'emergency' ? 420 : condition === 'advisory' ? 160 : 0;
    const radBoost = condition === 'emergency' ? 12.6 : condition === 'advisory' ? 3.2 : 0;

    // Interactive sensor modifiers
    const activityHrMod =
      sensorCtrl?.activityLoad === 'eva-exertion'
        ? 18
        : sensorCtrl?.activityLoad === 'resting'
          ? -8
          : 0;
    const activityTempMod =
      sensorCtrl?.activityLoad === 'eva-exertion'
        ? 0.4
        : sensorCtrl?.activityLoad === 'resting'
          ? -0.2
          : 0;
    const activityCo2Mod =
      sensorCtrl?.activityLoad === 'eva-exertion'
        ? 145
        : sensorCtrl?.activityLoad === 'resting'
          ? -45
          : 0;

    // O2 flow regulator response (1.8 L/min baseline; below 1.3 drops SpO2 and spikes HR)
    const o2Flow = sensorCtrl?.o2FlowRateLpm ?? 1.8;
    const o2FlowSpo2Mod =
      o2Flow < 1.5 ? (o2Flow - 1.5) * 6.5 : Math.min(0.8, (o2Flow - 1.5) * 0.6);
    const o2FlowHrMod = o2Flow < 1.4 ? (1.4 - o2Flow) * 28 : 0;

    // Cabin O2 mix & ECLSS scrubber impact
    const cabinMixMod = scrubbers ? (scrubbers.o2MixPct - 21.2) * 0.35 : 0;
    const eclssCo2Mod = toggles && !toggles.eclssAutoScrub ? 260 : 0;

    // Cooling loop response (65% baseline; lower cooling heats core temp, higher cools down)
    const coolPct = sensorCtrl?.coolingLoopPct ?? 65;
    const sublimatorBoost = toggles && !toggles.sublimatorCooling && idx === 3 ? 0.6 : 0;
    const coolTempMod = ((65 - coolPct) / 100) * 1.6 + sublimatorBoost;
    const coolHrMod = coolTempMod > 0.35 ? coolTempMod * 14 : 0;

    const computedHr = Math.round(
      66 +
        idx * 2 +
        activityHrMod +
        hrBoost +
        o2FlowHrMod +
        coolHrMod +
        wave * (condition === 'emergency' ? 4 : 1.8) +
        noise
    );

    const computedSpo2 = Number(
      Math.min(
        99.9,
        Math.max(
          82.0,
          99.0 - spo2Drop + o2FlowSpo2Mod + cabinMixMod + wave * 0.18 + (noise !== 0 ? noise * 0.15 : 0)
        )
      ).toFixed(1)
    );

    const computedTemp = Number(
      Math.min(
        39.8,
        Math.max(35.6, 36.8 + activityTempMod + tempBoost + coolTempMod + wave * 0.06)
      ).toFixed(1)
    );

    const computedCo2 = Math.round(
      405 + activityCo2Mod + co2Boost + eclssCo2Mod + wave * 10
    );

    const computedSuitKpa =
      idx === 3 && scrubbers ? scrubbers.airlockTargetKpa : member.suitPressure;

    // Compute live health status directly from biometric sensor thresholds
    let memberStatus: SystemSeverity = 'nominal';
    if (
      condition === 'emergency' ||
      computedSpo2 < 92.0 ||
      computedHr >= 120 ||
      computedTemp >= 38.2
    ) {
      memberStatus = 'emergency';
    } else if (
      condition === 'advisory' ||
      computedSpo2 < 95.5 ||
      computedHr >= 100 ||
      computedTemp >= 37.6 ||
      computedCo2 >= 700
    ) {
      memberStatus = 'advisory';
    }

    return {
      ...member,
      heartRate: computedHr,
      spo2: computedSpo2,
      coreTemp: computedTemp,
      suitPressure: computedSuitKpa,
      co2Ppm: computedCo2,
      radDoseMsv: Number(
        ((idx === 3 ? 16.5 : 14.1) + radBoost + (tick % 5) * 0.01).toFixed(2)
      ),
      thermalLoopPct: Math.min(100, Math.max(25, Math.round(coolPct + 25))),
      hydrationPct:
        sensorCtrl?.activityLoad === 'eva-exertion' ? 84 : member.hydrationPct,
      suitIntegrityPct:
        condition === 'emergency' && idx === 3
          ? 84
          : condition === 'advisory' && idx === 3
            ? 93
            : 98 + (idx % 2),
      sensorActive: sensorCtrl?.sensorActive ?? true,
      sensorNoiseFilter: sensorCtrl?.sensorNoiseFilter ?? true,
      status: memberStatus,
    };
  });
}
