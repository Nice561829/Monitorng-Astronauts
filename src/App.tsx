import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Brain } from 'lucide-react';
import {
  generateArcadiaTerrain,
  generateInitialWaveforms,
  INITIAL_CREW,
  INITIAL_CREW_SENSORS,
  INITIAL_PACKETS,
  INITIAL_SCRUBBERS,
  INITIAL_TOGGLES,
} from './data/telemetryEngine';
import {
  loadSavedProfile,
  useTelemetryReceiver,
} from './services/telemetryClient';
import {
  loadSavedPsychTraining,
  savePsychTraining,
} from './services/psychAiClient';
import {
  CrewSensorControl,
  MissionLogCategory,
  MissionLogEntry,
  OperatorProfile,
  PsychAiTrainingConfig,
  ScreenId,
  SubsystemToggles,
  SystemScrubbers,
  SystemSeverity,
  TelemetryHealthPoint,
  TerrainCell,
} from './types/telemetry';
import { TopNavHeader } from './components/TopNavHeader';
import {
  MissionGamificationBar,
  MissionQuest,
} from './components/MissionGamificationBar';
import { AchievementsModal } from './components/AchievementsModal';
import { MissionLog } from './components/MissionLog';
import { FlightDeckScreen } from './components/screens/FlightDeckScreen';
import { CrewEvaScreen } from './components/screens/CrewEvaScreen';
import { SystemsPowerScreen } from './components/screens/SystemsPowerScreen';
import { CommsSurfaceScreen } from './components/screens/CommsSurfaceScreen';
import { AbortConfirmModal } from './components/AbortConfirmModal';
import { GlossaryAndIngestModal } from './components/GlossaryAndIngestModal';
import { PersonalizeModal } from './components/PersonalizeModal';
import { PsychAiStudioDrawer } from './components/PsychAiStudioDrawer';
import { playQuestChime, playSuccessPing } from './utils/soundFx';

const GAMIFICATION_STORAGE_KEY = 'aerohud_gamification_v1';
const MISSION_LOG_STORAGE_KEY = 'aerohud_mission_log_v1';

function loadMissionLog(): MissionLogEntry[] {
  try {
    const raw = window.localStorage.getItem(MISSION_LOG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 120);
    }
  } catch {
    // ignore storage errors
  }
  return [
    {
      id: 'log-boot-1',
      met: 'T+142:18:04.2',
      wallTime: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      category: 'status',
      severity: 'nominal',
      source: 'ECLSS-BUS',
      title: 'Telemetry Console Synchronized',
      detail:
        'SSE downlink active at 1 Hz; all primary life-support and flight-deck channels initialized.',
    },
  ];
}

interface GamificationState {
  xp: number;
  streak: number;
  completedIds: string[];
  unlockedAchievements: string[];
  scoutLockedSectorId?: string | null;
}

function loadGamification(): GamificationState {
  try {
    const raw = window.localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GamificationState>;
      return {
        xp: typeof parsed.xp === 'number' ? parsed.xp : 40,
        streak: typeof parsed.streak === 'number' ? parsed.streak : 1,
        completedIds: Array.isArray(parsed.completedIds)
          ? parsed.completedIds
          : [],
        unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
          ? parsed.unlockedAchievements
          : [],
        scoutLockedSectorId:
          typeof parsed.scoutLockedSectorId === 'string'
            ? parsed.scoutLockedSectorId
            : null,
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    xp: 40,
    streak: 1,
    completedIds: [],
    unlockedAchievements: [],
    scoutLockedSectorId: null,
  };
}

const SEED_HEALTH_HISTORY: TelemetryHealthPoint[] = Array.from(
  { length: 18 },
  (_, idx) => {
    const isAdvisoryPeak = idx === 6 || idx === 7;
    const isMinorRipple = idx === 12;
    const sec = 46 + idx;
    const min = 17 + Math.floor(sec / 60);
    const remSec = sec % 60;
    return {
      step: idx - 18,
      met: `T+142:${String(min).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`,
      healthScore: isAdvisoryPeak ? 74 : isMinorRipple ? 87 : 95 + (idx % 3),
      alertIntensity: isAdvisoryPeak ? 58 : isMinorRipple ? 26 : 6 + (idx % 4),
      severity: isAdvisoryPeak ? 'advisory' : 'nominal',
      activeAlerts: isAdvisoryPeak ? 1 : 0,
    };
  }
);

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('flight-deck');
  const [selectedCrewId, setSelectedCrewId] = useState(INITIAL_CREW[0].id);
  const [abortModalOpen, setAbortModalOpen] = useState(false);
  const [glossaryModalOpen, setGlossaryModalOpen] = useState(false);
  const [personalizeModalOpen, setPersonalizeModalOpen] = useState(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [psychAiOpen, setPsychAiOpen] = useState(false);
  const [psychAiTab, setPsychAiTab] = useState<'chat' | 'train'>('chat');
  const [psychTraining, setPsychTraining] = useState<PsychAiTrainingConfig>(
    () => loadSavedPsychTraining()
  );

  const [gamification, setGamification] = useState<GamificationState>(() =>
    loadGamification()
  );
  const [missionLog, setMissionLog] = useState<MissionLogEntry[]>(() =>
    loadMissionLog()
  );
  const [healthHistory, setHealthHistory] = useState<TelemetryHealthPoint[]>(
    () => SEED_HEALTH_HISTORY
  );
  const [lastRewardBanner, setLastRewardBanner] = useState<string | null>(null);
  const bannerTimerRef = useRef<number | null>(null);

  const initialSavedProfile = useMemo(() => loadSavedProfile(), []);

  const {
    frame,
    terrain: serverTerrain,
    connectionState,
    framesReceived,
    ingestProfile,
    ingestToggle,
    ingestScrubber,
    ingestCrewSensor,
    ingestCondition,
    ingestBurnToggle,
    ingestSensorFrame,
    dispatchTelemetryBurst,
  } = useTelemetryReceiver();

  const fallbackTerrain = useMemo(() => generateArcadiaTerrain(), []);
  const fallbackWaveforms = useMemo(() => generateInitialWaveforms(), []);

  const condition: SystemSeverity = frame?.condition ?? 'nominal';
  const profile: OperatorProfile = frame?.profile ?? initialSavedProfile;
  const metFormatted = frame?.metFormatted ?? 'T+142:18:04.2';
  const rttFormatted = frame?.rttFormatted ?? '+00:14:22.4 RTT';
  const tick = frame?.tick ?? 0;
  const toggles = frame?.toggles ?? INITIAL_TOGGLES;
  const scrubbers = frame?.scrubbers ?? INITIAL_SCRUBBERS;
  const crewSensorControls = frame?.crewSensorControls ?? INITIAL_CREW_SENSORS;
  const burnActive = frame?.burnActive ?? false;
  const burnCountdownSec = frame?.burnCountdownSec ?? 522;
  const crew = frame?.crew ?? INITIAL_CREW;
  const waveforms = frame?.waveforms ?? fallbackWaveforms;
  const packets = frame?.packets ?? INITIAL_PACKETS;
  const terrain = serverTerrain.length > 0 ? serverTerrain : fallbackTerrain;

  // Sync saved Psychological AI training config to backend on mount
  useEffect(() => {
    void savePsychTraining(psychTraining)
      .then((synced) => setPsychTraining(synced))
      .catch(() => {
        // Keep local training config if server is still warming up
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        GAMIFICATION_STORAGE_KEY,
        JSON.stringify(gamification)
      );
    } catch {
      // ignore storage errors
    }
  }, [gamification]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        MISSION_LOG_STORAGE_KEY,
        JSON.stringify(missionLog.slice(0, 120))
      );
    } catch {
      // ignore storage errors
    }
  }, [missionLog]);

  // Append a live system health & alert intensity point whenever telemetry tick advances
  const lastSampleTickRef = useRef<number>(-1);
  useEffect(() => {
    if (tick === lastSampleTickRef.current) return;
    lastSampleTickRef.current = tick;

    const busGen =
      (toggles.kilopowerBus ? 40.0 : 0) +
      (toggles.solarArrayTrack ? 28.4 : 11.2);
    let busDraw = 18.2;
    if (toggles.eclssAutoScrub) busDraw += 9.4;
    if (toggles.thermalLoopB) busDraw += 4.6;
    if (toggles.highGainDish) busDraw += 3.8;
    if (toggles.starTrackerOptical) busDraw += 1.4;
    busDraw += (scrubbers.coolantFlowLpm - 10) * 0.35;
    const busOverload = busDraw > busGen;

    const emergencyCrewCount = crew.filter(
      (c) => c.status === 'emergency'
    ).length;
    const advisoryCrewCount = crew.filter(
      (c) => !c.sensorActive || c.status === 'advisory'
    ).length;

    const condPenalty =
      condition === 'emergency' ? 46 : condition === 'advisory' ? 20 : 0;
    const crewPenalty = emergencyCrewCount * 16 + advisoryCrewCount * 7;
    const busPenalty = busOverload ? 14 : 0;
    const healthScore = Math.max(
      8,
      Math.min(100, Math.round(98 - condPenalty - crewPenalty - busPenalty))
    );

    const activeAlerts =
      (condition !== 'nominal' ? 1 : 0) +
      emergencyCrewCount +
      advisoryCrewCount +
      (busOverload ? 1 : 0);

    const baseAlertIntensity =
      condition === 'emergency'
        ? 86
        : condition === 'advisory'
          ? 56
          : 5 + (tick % 4);
    const alertIntensity = Math.min(
      100,
      baseAlertIntensity +
        emergencyCrewCount * 12 +
        advisoryCrewCount * 9 +
        (busOverload ? 18 : 0)
    );

    const pointSeverity: SystemSeverity =
      condition === 'emergency' || emergencyCrewCount > 0 || busOverload
        ? 'emergency'
        : condition === 'advisory' || advisoryCrewCount > 0
          ? 'advisory'
          : 'nominal';

    setHealthHistory((prev) => [
      ...prev.slice(-35),
      {
        step: tick,
        met: metFormatted.split('.')[0],
        healthScore,
        alertIntensity,
        severity: pointSeverity,
        activeAlerts,
      },
    ]);
  }, [
    tick,
    metFormatted,
    condition,
    crew,
    toggles,
    scrubbers.coolantFlowLpm,
  ]);

  const appendMissionLog = useCallback(
    (entry: {
      category: MissionLogCategory;
      severity: SystemSeverity;
      source: string;
      title: string;
      detail: string;
      xpDelta?: number;
    }) => {
      const newItem: MissionLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        met: metFormatted,
        wallTime: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        ...entry,
      };
      setMissionLog((prev) => [newItem, ...prev].slice(0, 120));
    },
    [metFormatted]
  );

  // Edge-triggered telemetry alerts & system status change loggers
  const prevConditionRef = useRef<SystemSeverity>(condition);
  const prevBurnRef = useRef<boolean>(burnActive);
  const prevTogglesRef = useRef<SubsystemToggles>(toggles);
  const prevOverloadRef = useRef<boolean>(false);
  const prevCrewStatusRef = useRef<Record<string, { status: SystemSeverity; sensorActive: boolean }>>({});

  useEffect(() => {
    if (prevConditionRef.current !== condition) {
      const from = prevConditionRef.current;
      prevConditionRef.current = condition;
      appendMissionLog({
        category: condition === 'nominal' ? 'status' : 'alert',
        severity: condition,
        source: 'SYSTEM-CTRL',
        title: `Condition changed: ${from.toUpperCase()} → ${condition.toUpperCase()}`,
        detail:
          condition === 'emergency'
            ? 'Emergency protocol active; automatic main engine burn hold enforced.'
            : condition === 'advisory'
              ? 'Preventive advisory state triggered across life-support & thermal telemetry.'
              : 'All spacecraft telemetry channels returned to nominal thresholds.',
      });
    }
  }, [condition, appendMissionLog]);

  useEffect(() => {
    if (prevBurnRef.current !== burnActive) {
      prevBurnRef.current = burnActive;
      appendMissionLog({
        category: 'status',
        severity: burnActive ? 'advisory' : 'nominal',
        source: 'FLIGHT-DECK',
        title: burnActive ? 'MCC-04 Engine Burn Engaged' : 'MCC-04 Engine Burn Held',
        detail: burnActive
          ? `Main propulsion active at ${scrubbers.burnThrottlePct}% throttle.`
          : 'Main propulsion returned to standby hold.',
      });
    }
  }, [burnActive, scrubbers.burnThrottlePct, appendMissionLog]);

  useEffect(() => {
    const prev = prevTogglesRef.current;
    (Object.keys(toggles) as Array<keyof SubsystemToggles>).forEach((key) => {
      if (prev[key] !== toggles[key]) {
        appendMissionLog({
          category: 'status',
          severity: toggles[key] ? 'nominal' : 'advisory',
          source: 'SUBSYSTEMS',
          title: `${key} ${toggles[key] ? 'Enabled' : 'Disabled'}`,
          detail: `Operator switched subsystem ${key} to ${toggles[key] ? 'ONLINE' : 'STANDBY'}.`,
        });
      }
    });
    prevTogglesRef.current = toggles;
  }, [toggles, appendMissionLog]);

  useEffect(() => {
    const busGen =
      (toggles.kilopowerBus ? 40.0 : 0) +
      (toggles.solarArrayTrack ? 28.4 : 11.2);
    let busDraw = 18.2;
    if (toggles.eclssAutoScrub) busDraw += 9.4;
    if (toggles.thermalLoopB) busDraw += 4.6;
    if (toggles.highGainDish) busDraw += 3.8;
    if (toggles.starTrackerOptical) busDraw += 1.4;
    busDraw += (scrubbers.coolantFlowLpm - 10) * 0.35;

    const overloaded = busDraw > busGen;
    if (overloaded !== prevOverloadRef.current) {
      prevOverloadRef.current = overloaded;
      appendMissionLog({
        category: overloaded ? 'alert' : 'status',
        severity: overloaded ? 'emergency' : 'nominal',
        source: 'POWER-BUS',
        title: overloaded ? 'Primary Power Bus Overload' : 'Primary Power Bus Balanced',
        detail: `Generation ${busGen.toFixed(1)} kW vs Load ${busDraw.toFixed(1)} kW.`,
      });
    }
  }, [toggles, scrubbers.coolantFlowLpm, appendMissionLog]);

  useEffect(() => {
    const prevMap = prevCrewStatusRef.current;
    const nextMap: Record<string, { status: SystemSeverity; sensorActive: boolean }> = {};

    crew.forEach((member) => {
      nextMap[member.id] = {
        status: member.status,
        sensorActive: member.sensorActive,
      };
      const prev = prevMap[member.id];
      if (!prev) return;

      if (prev.sensorActive !== member.sensorActive) {
        appendMissionLog({
          category: member.sensorActive ? 'status' : 'alert',
          severity: member.sensorActive ? 'nominal' : 'advisory',
          source: member.callsign,
          title: member.sensorActive
            ? `${member.name} Biometric Sensor Restored`
            : `${member.name} Biometric Sensor Offline`,
          detail: member.sensorActive
            ? 'ECG / SpO₂ sensor stream re-established.'
            : 'Biometric telemetry bus switched off; vital signs masked.',
        });
      } else if (prev.status !== member.status && member.status !== 'nominal') {
        appendMissionLog({
          category: 'alert',
          severity: member.status,
          source: member.callsign,
          title: `${member.name} Biometric ${member.status.toUpperCase()} Alert`,
          detail: `HR ${member.heartRate} bpm · SpO₂ ${member.spo2.toFixed(1)}% · Core ${member.coreTemp.toFixed(1)}°C`,
        });
      }
    });

    prevCrewStatusRef.current = nextMap;
  }, [crew, appendMissionLog]);

  const showReward = useCallback((message: string) => {
    setLastRewardBanner(message);
    if (bannerTimerRef.current) {
      window.clearTimeout(bannerTimerRef.current);
    }
    bannerTimerRef.current = window.setTimeout(() => {
      setLastRewardBanner(null);
    }, 4500);
  }, []);

  const completeQuest = useCallback(
    (questId: string, rewardXp: number, labelTr: string, labelEn: string) => {
      let didComplete = false;
      setGamification((prev) => {
        if (prev.completedIds.includes(questId)) return prev;
        didComplete = true;
        const nextStreak = prev.streak + 1;
        const msg =
          profile.guideLanguage === 'tr'
            ? `+${rewardXp} XP · ${labelTr} (${nextStreak}x Seri)`
            : `+${rewardXp} XP · ${labelEn} (${nextStreak}x Streak)`;
        showReward(msg);
        appendMissionLog({
          category: 'quest',
          severity: 'nominal',
          source: 'QUEST-HUB',
          title: `Quest Completed: ${labelEn}`,
          detail: `${labelTr} (${nextStreak}x combo streak active).`,
          xpDelta: rewardXp,
        });
        return {
          ...prev,
          xp: prev.xp + rewardXp,
          streak: nextStreak,
          completedIds: [...prev.completedIds, questId],
        };
      });
      if (didComplete) {
        playQuestChime(soundEnabled);
      }
    },
    [profile.guideLanguage, showReward, appendMissionLog, soundEnabled]
  );

  const handleAwardAchievement = useCallback(
    (
      achievementId: string,
      xpReward: number,
      titleTr: string,
      titleEn: string,
      sectorId?: string
    ) => {
      let unlockedNew = false;
      setGamification((prev) => {
        const alreadyUnlocked =
          prev.unlockedAchievements.includes(achievementId);
        const earned = alreadyUnlocked ? 0 : xpReward;
        const nextStreak = alreadyUnlocked ? prev.streak : prev.streak + 1;
        if (!alreadyUnlocked) {
          unlockedNew = true;
        }
        const msg =
          profile.guideLanguage === 'tr'
            ? alreadyUnlocked
              ? `${titleTr} Güncellendi`
              : `+${earned} XP · Rozet Açıldı: ${titleTr}!`
            : alreadyUnlocked
              ? `${titleEn} Updated`
              : `+${earned} XP · Badge Unlocked: ${titleEn}!`;
        showReward(msg);
        appendMissionLog({
          category: 'quest',
          severity: 'nominal',
          source: 'BADGE-CTRL',
          title: alreadyUnlocked
            ? `Sector Re-Locked: ${titleEn}`
            : `Badge Unlocked: ${titleEn}`,
          detail: titleTr,
          xpDelta: earned > 0 ? earned : undefined,
        });
        return {
          ...prev,
          xp: prev.xp + earned,
          streak: nextStreak,
          unlockedAchievements: alreadyUnlocked
            ? prev.unlockedAchievements
            : [...prev.unlockedAchievements, achievementId],
          scoutLockedSectorId: sectorId ?? prev.scoutLockedSectorId,
        };
      });
      if (unlockedNew) {
        playQuestChime(soundEnabled);
      } else {
        playSuccessPing(soundEnabled);
      }
    },
    [profile.guideLanguage, showReward, appendMissionLog, soundEnabled]
  );

  // Check coolant optimization quest whenever coolant flow / power bus changes
  useEffect(() => {
    const busGen =
      (toggles.kilopowerBus ? 40.0 : 0) +
      (toggles.solarArrayTrack ? 28.4 : 11.2);
    let busDraw = 18.2;
    if (toggles.eclssAutoScrub) busDraw += 9.4;
    if (toggles.thermalLoopB) busDraw += 4.6;
    if (toggles.highGainDish) busDraw += 3.8;
    if (toggles.starTrackerOptical) busDraw += 1.4;
    busDraw += (scrubbers.coolantFlowLpm - 10) * 0.35;

    if (scrubbers.coolantFlowLpm >= 20.0 && busGen >= busDraw) {
      completeQuest(
        'coolant-quest',
        80,
        'Soğutma & Güç Dengelendi',
        'Coolant & Power Balanced'
      );
    }
  }, [scrubbers.coolantFlowLpm, toggles, completeQuest]);

  const quests: MissionQuest[] = useMemo(
    () => [
      {
        id: 'burn-quest',
        screen: 'flight-deck',
        titleEn: 'Engage MCC-04 Burn',
        titleTr: 'MCC-04 İtki Ateşle',
        xp: 75,
        completed: gamification.completedIds.includes('burn-quest'),
      },
      {
        id: 'triage-quest',
        screen: 'crew-eva',
        titleEn: 'Solve First-Aid Crisis',
        titleTr: 'İlkyardım Krizini Çöz',
        xp: 150,
        completed: gamification.completedIds.includes('triage-quest'),
      },
      {
        id: 'coolant-quest',
        screen: 'systems-power',
        titleEn: 'Coolant ≥ 20 L/m',
        titleTr: 'Soğutma ≥ 20 L/m',
        xp: 80,
        completed: gamification.completedIds.includes('coolant-quest'),
      },
      {
        id: 'comms-quest',
        screen: 'comms-surface',
        titleEn: 'Transmit DSN Burst',
        titleTr: 'DSN Veri Paketi Gönder',
        xp: 75,
        completed: gamification.completedIds.includes('comms-quest'),
      },
      {
        id: 'psych-ai-quest',
        screen: 'crew-eva',
        titleEn: 'Train & Chat Psych AI',
        titleTr: "Psikolojik AI'ı Eğit",
        xp: 90,
        completed: gamification.completedIds.includes('psych-ai-quest'),
      },
      {
        id: 'wellness-quest',
        screen: 'crew-eva',
        titleEn: 'Character Fitness & Diet',
        titleTr: 'Karakter Egzersiz & Diyet',
        xp: 100,
        completed: gamification.completedIds.includes('wellness-quest'),
      },
    ],
    [gamification.completedIds]
  );

  const handleToggle = (key: keyof SubsystemToggles, val: boolean) => {
    void ingestToggle(key, val);
  };

  const handleScrubberChange = (key: keyof SystemScrubbers, val: number) => {
    void ingestScrubber(key, val);
  };

  const handleCrewSensorChange = (
    crewId: string,
    patch: Partial<CrewSensorControl>
  ) => {
    void ingestCrewSensor(crewId, patch);
  };

  const handleToggleBurn = () => {
    const nextBurn = !burnActive;
    void ingestBurnToggle(nextBurn);
    if (nextBurn) {
      completeQuest(
        'burn-quest',
        75,
        'Yörünge İtkisi Başlatıldı',
        'MCC-04 Burn Engaged'
      );
    }
  };

  const handleFirstAidScore = (points: number) => {
    playQuestChime(soundEnabled);
    setGamification((prev) => {
      const alreadyDone = prev.completedIds.includes('triage-quest');
      const bonus = alreadyDone ? 0 : 150;
      const earned = points + bonus;
      const nextStreak = prev.streak + 1;
      const msg =
        profile.guideLanguage === 'tr'
          ? `+${earned} XP · İlkyardım Müdahalesi Başarılı!`
          : `+${earned} XP · First-Aid Intervention Cleared!`;
      showReward(msg);
      appendMissionLog({
        category: 'quest',
        severity: 'nominal',
        source: 'TRIAGE-SIM',
        title: alreadyDone
          ? 'First-Aid Crisis Simulation Cleared'
          : 'Quest Completed: Solve First-Aid Crisis',
        detail: `Medical intervention protocol verified on Crew & EVA.`,
        xpDelta: earned,
      });
      return {
        ...prev,
        xp: prev.xp + earned,
        streak: nextStreak,
        completedIds: alreadyDone
          ? prev.completedIds
          : [...prev.completedIds, 'triage-quest'],
      };
    });
  };

  const handleWellnessXpEarned = (points: number, reason: string) => {
    playQuestChime(soundEnabled);
    setGamification((prev) => {
      const alreadyDone = prev.completedIds.includes('wellness-quest');
      const bonus = alreadyDone ? 0 : 100;
      const earned = points + bonus;
      const nextStreak = prev.streak + 1;
      showReward(`+${earned} XP · ${reason}`);
      appendMissionLog({
        category: 'quest',
        severity: 'nominal',
        source: 'CREW-WELLNESS',
        title: alreadyDone
          ? 'Astronaut Fitness & Nutrition Logged'
          : 'Quest Completed: Character Fitness & Diet',
        detail: reason,
        xpDelta: earned,
      });
      return {
        ...prev,
        xp: prev.xp + earned,
        streak: nextStreak,
        completedIds: alreadyDone
          ? prev.completedIds
          : [...prev.completedIds, 'wellness-quest'],
      };
    });
  };

  const handleDispatchPacket = (
    code: string,
    dest: string,
    size: number
  ) => {
    void dispatchTelemetryBurst(code, dest, size);
    appendMissionLog({
      category: 'status',
      severity: 'nominal',
      source: 'DSN-COMMS',
      title: `Telemetry Burst Dispatched (${code})`,
      detail: `Uplink frame ${size.toFixed(1)} KB queued to ${dest}.`,
    });
    completeQuest(
      'comms-quest',
      75,
      'DSN Veri Paketi İletildi',
      'DSN Telemetry Burst Sent'
    );
  };

  const handleOpenPsychAi = (tab: 'chat' | 'train' = 'chat') => {
    setPsychAiTab(tab);
    setPsychAiOpen(true);
  };

  const handleSavePsychTraining = async (next: PsychAiTrainingConfig) => {
    const saved = await savePsychTraining(next);
    setPsychTraining(saved);
  };

  const handlePsychAiReward = (kind: 'chat' | 'train') => {
    if (kind === 'train') {
      completeQuest(
        'psych-ai-quest',
        90,
        'Psikolojik AI Eğitildi',
        'Psychological AI Trained'
      );
    } else {
      completeQuest(
        'psych-ai-quest',
        90,
        'Aura-Psy Danışmanlığı Tamamlandı',
        'Aura-Psy Consultation Completed'
      );
    }
  };

  const handleConfirmAbort = () => {
    void ingestCondition('emergency');
    void ingestBurnToggle(false);
    setAbortModalOpen(false);
  };

  const ambientBgStyle = useMemo(() => {
    if (condition === 'emergency') {
      return {
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.16), transparent 62%)',
      };
    }
    if (condition === 'advisory') {
      return {
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.15), transparent 62%)',
      };
    }
    return {
      backgroundImage:
        'radial-gradient(circle at 18% 0%, rgba(14, 165, 233, 0.14), transparent 52%), radial-gradient(circle at 82% 8%, rgba(16, 185, 129, 0.10), transparent 48%)',
    };
  }, [condition]);

  const totalUnlockedAchievements = useMemo(() => {
    const ids = new Set<string>([
      ...gamification.unlockedAchievements,
      ...gamification.completedIds.filter((id) =>
        ['burn-quest', 'triage-quest', 'wellness-quest', 'psych-ai-quest'].includes(
          id
        )
      ),
    ]);
    if (gamification.xp >= 450) {
      ids.add('mars-pioneer');
    }
    return ids.size;
  }, [gamification.unlockedAchievements, gamification.completedIds, gamification.xp]);

  return (
    <div
      className="min-h-screen bg-[#EDF5FB] text-[#0F172A] flex flex-col transition-all duration-300"
      style={ambientBgStyle}
    >
      <TopNavHeader
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        metFormatted={metFormatted}
        rttFormatted={rttFormatted}
        condition={condition}
        onChangeCondition={(next) => void ingestCondition(next)}
        onTriggerAbortModal={() => setAbortModalOpen(true)}
        onOpenGlossary={() => setGlossaryModalOpen(true)}
        onOpenPersonalize={() => setPersonalizeModalOpen(true)}
        streamState={connectionState}
        profile={profile}
      />

      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 md:px-6 lg:px-10 py-6 pb-20">
        <MissionGamificationBar
          xp={gamification.xp}
          streak={gamification.streak}
          quests={quests}
          activeScreen={activeScreen}
          unlockedCount={totalUnlockedAchievements}
          totalAchievements={8}
          onOpenAchievements={() => {
            playSuccessPing(soundEnabled);
            setAchievementsModalOpen(true);
          }}
          soundEnabled={soundEnabled}
          onToggleSound={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (next) playSuccessPing(true);
          }}
          onNavigateScreen={setActiveScreen}
          onOpenPsychAi={handleOpenPsychAi}
          guideLanguage={profile.guideLanguage}
          lastRewardBanner={lastRewardBanner}
        />

        {activeScreen === 'flight-deck' && (
          <FlightDeckScreen
            condition={condition}
            crew={crew}
            toggles={toggles}
            onToggle={handleToggle}
            burnActive={burnActive}
            onToggleBurn={handleToggleBurn}
            burnCountdownSec={burnCountdownSec}
            burnThrottlePct={scrubbers.burnThrottlePct}
            waveforms={waveforms}
            tick={tick}
            cabinO2OffsetKpa={frame?.externalSensors.cabinO2OffsetKpa ?? 0}
            radiationSpikeMsv={frame?.externalSensors.radiationSpikeMsv ?? 0}
            profile={profile}
            onInspectCrewHealth={() => setActiveScreen('crew-eva')}
            orbitalAlignedClaimed={gamification.unlockedAchievements.includes(
              'orbital-align'
            )}
            onClaimOrbitalAlignment={() =>
              handleAwardAchievement(
                'orbital-align',
                50,
                'Kusursuz Vektör Kilidi',
                'Perfect Vector Lock'
              )
            }
          />
        )}

        {activeScreen === 'crew-eva' && (
          <CrewEvaScreen
            crew={crew}
            selectedCrewId={selectedCrewId}
            onSelectCrew={setSelectedCrewId}
            crewSensorControls={crewSensorControls}
            onCrewSensorChange={handleCrewSensorChange}
            toggles={toggles}
            onToggle={handleToggle}
            scrubbers={scrubbers}
            onScrubberChange={handleScrubberChange}
            condition={condition}
            tick={tick}
            profile={profile}
            onFirstAidScore={handleFirstAidScore}
            onWellnessXpEarned={handleWellnessXpEarned}
            onOpenPsychAi={handleOpenPsychAi}
          />
        )}

        {activeScreen === 'systems-power' && (
          <SystemsPowerScreen
            toggles={toggles}
            onToggle={handleToggle}
            scrubbers={scrubbers}
            onScrubberChange={handleScrubberChange}
            waveforms={waveforms}
            condition={condition}
            guideLanguage={profile.guideLanguage}
            systemsRankClaimed={gamification.unlockedAchievements.includes(
              'systems-s-rank'
            )}
            onClaimSystemsRank={() =>
              handleAwardAchievement(
                'systems-s-rank',
                60,
                'S-Sınıfı Mühendis',
                'S-Rank Systems Ace'
              )
            }
          />
        )}

        {activeScreen === 'comms-surface' && (
          <CommsSurfaceScreen
            rttFormatted={rttFormatted}
            packets={packets}
            onDispatchPacket={handleDispatchPacket}
            terrain={terrain}
            condition={condition}
            highGainDishEnabled={toggles.highGainDish}
            profile={profile}
            scoutLockedSectorId={gamification.scoutLockedSectorId ?? null}
            onLockLandingSector={(cell: TerrainCell, score: number) =>
              handleAwardAchievement(
                'ice-scout',
                70,
                `Arcadia Buz Kaşifi (${cell.sectorId} · %${score})`,
                `Arcadia Ice Scout (${cell.sectorId} · ${score}%)`,
                cell.sectorId
              )
            }
          />
        )}

        <div className="mt-6">
          <MissionLog
            entries={missionLog}
            healthHistory={healthHistory}
            onClearLog={() => setMissionLog([])}
            guideLanguage={profile.guideLanguage}
          />
        </div>
      </main>

      {/* Floating Psychological AI Launcher */}
      <button
        type="button"
        onClick={() => handleOpenPsychAi('chat')}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-[8px] bg-[#0284C7] text-white shadow-lg hover:bg-[#0369A1] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7]"
      >
        <Brain className="w-4 h-4" />
        <span className="text-xs font-semibold tracking-wide">
          {profile.guideLanguage === 'tr'
            ? `Aura-Psy · AI Sohbet (%${psychTraining.trainingScore})`
            : `Aura-Psy · Psych AI (${psychTraining.trainingScore}%)`}
        </span>
      </button>

      <PsychAiStudioDrawer
        open={psychAiOpen}
        onClose={() => setPsychAiOpen(false)}
        initialTab={psychAiTab}
        crew={crew}
        selectedCrewId={selectedCrewId}
        activeScreen={activeScreen}
        condition={condition}
        guideLanguage={profile.guideLanguage}
        trainingConfig={psychTraining}
        onSaveTraining={handleSavePsychTraining}
        onApplyCrewCalibration={handleCrewSensorChange}
        onNavigateScreen={setActiveScreen}
        onAiInteractionReward={handlePsychAiReward}
      />

      <AbortConfirmModal
        open={abortModalOpen}
        onClose={() => setAbortModalOpen(false)}
        onConfirmAbort={handleConfirmAbort}
      />

      <GlossaryAndIngestModal
        open={glossaryModalOpen}
        onClose={() => setGlossaryModalOpen(false)}
        frame={frame}
        connectionState={connectionState}
        framesReceived={framesReceived}
        guideLanguage={profile.guideLanguage}
        onIngestSensorFrame={ingestSensorFrame}
      />

      <PersonalizeModal
        open={personalizeModalOpen}
        onClose={() => setPersonalizeModalOpen(false)}
        profile={profile}
        onSaveProfile={ingestProfile}
      />

      <AchievementsModal
        open={achievementsModalOpen}
        onClose={() => setAchievementsModalOpen(false)}
        xp={gamification.xp}
        streak={gamification.streak}
        unlockedAchievements={gamification.unlockedAchievements}
        completedQuests={gamification.completedIds}
        guideLanguage={profile.guideLanguage}
      />
    </div>
  );
}
