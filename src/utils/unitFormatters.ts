import {
  HudAccentId,
  MissionPresetId,
  OperatorProfile,
  PressureUnit,
  TempUnit,
} from '../types/telemetry';

export const DEFAULT_OPERATOR_PROFILE: OperatorProfile = {
  operatorName: 'Flight Director',
  callsign: 'FD-ALPHA',
  vesselName: 'ARTEMIS-IV',
  missionPreset: 'mars-transit',
  pressureUnit: 'kPa',
  tempUnit: 'metric',
  hudAccent: 'cyan',
  guideLanguage: 'en',
  showExplanations: true,
  o2AlertThresholdKpa: 19.0,
  hrAlertThresholdBpm: 105,
};

export const HUD_ACCENTS: Record<
  HudAccentId,
  { label: string; hex: string; softBg: string; border: string }
> = {
  cyan: {
    label: 'Sky Ocean Blue',
    hex: '#0284C7',
    softBg: 'rgba(2, 132, 199, 0.10)',
    border: 'rgba(2, 132, 199, 0.45)',
  },
  emerald: {
    label: 'Mint Emerald',
    hex: '#059669',
    softBg: 'rgba(5, 150, 105, 0.12)',
    border: 'rgba(5, 150, 105, 0.45)',
  },
  amber: {
    label: 'Sunlit Amber',
    hex: '#D97706',
    softBg: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.45)',
  },
  indigo: {
    label: 'Horizon Indigo',
    hex: '#4F46E5',
    softBg: 'rgba(79, 70, 229, 0.12)',
    border: 'rgba(79, 70, 229, 0.45)',
  },
};

export const MISSION_PRESETS: Record<
  MissionPresetId,
  {
    label: string;
    phaseLabel: string;
    targetNode: string;
    baseRttTenths: number;
    orbitalVelocity: string;
    landingZoneTitle: string;
  }
> = {
  'mars-transit': {
    label: 'Mars Transit (Arcadia)',
    phaseLabel: 'MARS TRANSIT · SOL 142',
    targetNode: 'MARS SOI · ARCADIA',
    baseRttTenths: 8624, // ~14m 22s RTT
    orbitalVelocity: '28.4 km/s',
    landingZoneTitle:
      'Arcadia Planitia Landing Zone — Subsurface H2O Ice & Slope Heatmap',
  },
  'lunar-pole': {
    label: 'Lunar South Pole (Shackleton)',
    phaseLabel: 'LUNAR ORBIT · DAY 06',
    targetNode: 'LUNA SOI · SHACKLETON',
    baseRttTenths: 26, // ~2.6s RTT
    orbitalVelocity: '1.68 km/s',
    landingZoneTitle:
      'Shackleton Crater Rim — Permanently Shadowed Ice & Slope Heatmap',
  },
  'jovian-relay': {
    label: 'Jovian Relay (Europa Orbit)',
    phaseLabel: 'JOVIAN CRUISE · DAY 614',
    targetNode: 'EUROPA SOI · CONAMARA',
    baseRttTenths: 44120, // ~73m 32s RTT
    orbitalVelocity: '13.7 km/s',
    landingZoneTitle:
      'Conamara Chaos Surface — Cryogenic Ice Crust & Slope Heatmap',
  },
};

export function formatPressure(
  kpaValue: number,
  unit: PressureUnit,
  decimals = 1
): { value: string; unitLabel: string } {
  if (unit === 'psi') {
    const psi = kpaValue * 0.145038;
    return { value: psi.toFixed(decimals), unitLabel: 'psi' };
  }
  return { value: kpaValue.toFixed(decimals), unitLabel: 'kPa' };
}

export function formatBodyTemp(
  celsiusValue: number,
  unit: TempUnit
): { value: string; unitLabel: string } {
  if (unit === 'imperial') {
    const f = (celsiusValue * 9) / 5 + 32;
    return { value: f.toFixed(1), unitLabel: '°F' };
  }
  return { value: celsiusValue.toFixed(1), unitLabel: '°C' };
}

export function formatKelvinTemp(
  kelvinValue: number,
  unit: TempUnit
): { value: string; unitLabel: string } {
  if (unit === 'imperial') {
    const f = ((kelvinValue - 273.15) * 9) / 5 + 32;
    return { value: Math.round(f).toString(), unitLabel: '°F' };
  }
  return { value: Math.round(kelvinValue).toString(), unitLabel: 'K' };
}
