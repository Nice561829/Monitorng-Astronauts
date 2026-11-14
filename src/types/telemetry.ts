export type SystemSeverity = 'nominal' | 'advisory' | 'emergency';

export type ScreenId =
  | 'flight-deck'
  | 'crew-eva'
  | 'systems-power'
  | 'comms-surface';

export type MissionPresetId = 'mars-transit' | 'lunar-pole' | 'jovian-relay';
export type PressureUnit = 'kPa' | 'psi';
export type TempUnit = 'metric' | 'imperial';
export type HudAccentId = 'cyan' | 'emerald' | 'amber' | 'indigo';
export type GuideLanguage = 'en' | 'tr';

export interface OperatorProfile {
  operatorName: string;
  callsign: string;
  vesselName: string;
  missionPreset: MissionPresetId;
  pressureUnit: PressureUnit;
  tempUnit: TempUnit;
  hudAccent: HudAccentId;
  guideLanguage: GuideLanguage;
  showExplanations: boolean;
  o2AlertThresholdKpa: number;
  hrAlertThresholdBpm: number;
}

export type CrewActivityLoad = 'resting' | 'nominal' | 'eva-exertion';

export interface CrewSensorControl {
  o2FlowRateLpm: number;
  coolingLoopPct: number;
  activityLoad: CrewActivityLoad;
  sensorActive: boolean;
  sensorNoiseFilter: boolean;
}

export interface CrewMember {
  id: string;
  callsign: string;
  name: string;
  role: string;
  station: string;
  heartRate: number;
  spo2: number;
  coreTemp: number;
  suitPressure: number;
  co2Ppm: number;
  radDoseMsv: number;
  hydrationPct: number;
  thermalLoopPct: number;
  suitIntegrityPct: number;
  ecgPhase: number;
  sensorActive: boolean;
  sensorNoiseFilter: boolean;
  status: SystemSeverity;
}

export interface SubsystemToggles {
  rcsGimbalLock: boolean;
  eclssAutoScrub: boolean;
  starTrackerOptical: boolean;
  thermalLoopB: boolean;
  solarArrayTrack: boolean;
  kilopowerBus: boolean;
  highGainDish: boolean;
  airlockOuterSeal: boolean;
  evaUmbilical: boolean;
  sublimatorCooling: boolean;
}

export interface SystemScrubbers {
  o2MixPct: number;
  coolantFlowLpm: number;
  radiatorLouverDeg: number;
  airlockTargetKpa: number;
  burnThrottlePct: number;
}

export interface TelemetryPacket {
  id: string;
  timestampMet: string;
  frameCode: string;
  destination: string;
  sizeKb: number;
  progressPct: number;
  status: 'transmitting' | 'acknowledged' | 'queued';
}

export interface TerrainCell {
  row: number;
  col: number;
  sectorId: string;
  elevationM: number;
  slopeDeg: number;
  icePct: number;
  solarHours: number;
  thermalK: number;
}

export interface WaveformSample {
  tLabel: string;
  chamberTempK: number;
  ispEffPct: number;
  theoreticalEffPct: number;
  rcsPressureBar: number;
}

export type PsychAiPersona =
  | 'calm-therapist'
  | 'triage-coach'
  | 'cognitive-analyst';

export type PsychAiMood =
  | 'calm'
  | 'focused'
  | 'vigilant'
  | 'stressed'
  | 'critical';

export type PsychColorTone = 'sky-mint' | 'amber' | 'coral';

export interface PsychAiTrainingRule {
  id: string;
  text: string;
  enabled: boolean;
  category: 'biometric' | 'color-psych' | 'triage' | 'communication';
}

export interface PsychAiTrainingConfig {
  persona: PsychAiPersona;
  empathyLevel: number;
  proactiveSensorHints: boolean;
  colorPsychFeedback: boolean;
  breathingCueAuto: boolean;
  customRules: PsychAiTrainingRule[];
  trainingScore: number;
  updatedAt: string | null;
}

export interface PsychAiSuggestedAction {
  type: 'none' | 'calibrate_crew' | 'breathing_cue' | 'focus_first_aid';
  crewId?: string;
  label?: string;
  o2FlowRateLpm?: number;
  coolingLoopPct?: number;
  activityLoad?: CrewActivityLoad;
}

export interface PsychAiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mood?: PsychAiMood;
  psychColor?: PsychColorTone;
  coachingTip?: string;
  suggestedAction?: PsychAiSuggestedAction;
}

export type MissionLogCategory = 'alert' | 'status' | 'quest';

export interface MissionLogEntry {
  id: string;
  met: string;
  wallTime: string;
  category: MissionLogCategory;
  severity: SystemSeverity;
  source: string;
  title: string;
  detail: string;
  xpDelta?: number;
}

export interface TelemetryHealthPoint {
  step: number;
  met: string;
  healthScore: number;
  alertIntensity: number;
  severity: SystemSeverity;
  activeAlerts: number;
}
