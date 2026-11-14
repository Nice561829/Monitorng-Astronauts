import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Apple,
  Award,
  Droplets,
  Dumbbell,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  CrewMember,
  CrewSensorControl,
  GuideLanguage,
} from '../types/telemetry';
import { HudCard } from './HudPrimitives';

export type ExerciseId = 'squat' | 'jacks' | 'treadmill' | 'stretch';

interface ExerciseDef {
  id: ExerciseId;
  nameTr: string;
  nameEn: string;
  targetTr: string;
  targetEn: string;
  kcalPerRep: number;
  muscleGainPerRep: number;
  staminaCostPerRep: number;
  speedRadPerSec: number;
  recommendedO2: number;
}

const EXERCISES: ExerciseDef[] = [
  {
    id: 'squat',
    nameTr: 'ARED Direnç Squat',
    nameEn: 'ARED Resistance Squat',
    targetTr: 'Kemik yoğunluğu ve bacak gücü',
    targetEn: 'Bone density & lower-body strength',
    kcalPerRep: 4.2,
    muscleGainPerRep: 3.5,
    staminaCostPerRep: 4,
    speedRadPerSec: 3.1,
    recommendedO2: 2.2,
  },
  {
    id: 'jacks',
    nameTr: 'Zero-G Kardiyo Sıçrama',
    nameEn: 'Zero-G Jumping Jacks',
    targetTr: 'Kardiyovasküler dayanıklılık ve nabız',
    targetEn: 'Cardiovascular endurance & VO₂ max',
    kcalPerRep: 3.4,
    muscleGainPerRep: 2.0,
    staminaCostPerRep: 3,
    speedRadPerSec: 4.4,
    recommendedO2: 2.3,
  },
  {
    id: 'treadmill',
    nameTr: 'Bungee Koşu Bandı',
    nameEn: 'Bungee Treadmill Sprint',
    targetTr: 'Aerobik kondisyon ve denge',
    targetEn: 'Aerobic conditioning & balance',
    kcalPerRep: 5.0,
    muscleGainPerRep: 2.8,
    staminaCostPerRep: 5,
    speedRadPerSec: 5.2,
    recommendedO2: 2.4,
  },
  {
    id: 'stretch',
    nameTr: 'Mikrogravite Esneme',
    nameEn: 'Microgravity Spine Stretch',
    targetTr: 'Omurga rahatlama ve stres azaltma',
    targetEn: 'Spinal decompression & stress relief',
    kcalPerRep: 1.8,
    muscleGainPerRep: 1.5,
    staminaCostPerRep: 1,
    speedRadPerSec: 2.2,
    recommendedO2: 1.9,
  },
];

interface SpaceMeal {
  id: string;
  nameTr: string;
  nameEn: string;
  category: 'protein' | 'hydration' | 'energy' | 'recovery';
  kcal: number;
  proteinG: number;
  carbsG: number;
  waterMl: number;
  staminaBoost: number;
  xpReward: number;
  accent: string;
}

const SPACE_MEALS: SpaceMeal[] = [
  {
    id: 'protein-shake',
    nameTr: 'Spirulina & Whey Shake',
    nameEn: 'Spirulina & Whey Shake',
    category: 'protein',
    kcal: 280,
    proteinG: 32,
    carbsG: 18,
    waterMl: 250,
    staminaBoost: 24,
    xpReward: 25,
    accent: '#0284C7',
  },
  {
    id: 'electrolyte-gel',
    nameTr: 'Elektrolit & D3 Hidrasyon',
    nameEn: 'Electrolyte & D3 Hydration',
    category: 'hydration',
    kcal: 65,
    proteinG: 0,
    carbsG: 14,
    waterMl: 450,
    staminaBoost: 18,
    xpReward: 20,
    accent: '#059669',
  },
  {
    id: 'quinoa-salmon',
    nameTr: 'Somon & Kinoa Uzay Paketi',
    nameEn: 'Salmon & Quinoa Ration',
    category: 'energy',
    kcal: 460,
    proteinG: 34,
    carbsG: 48,
    waterMl: 120,
    staminaBoost: 34,
    xpReward: 30,
    accent: '#D97706',
  },
  {
    id: 'probiotic-bar',
    nameTr: 'Probiyotik & Magnezyum Bar',
    nameEn: 'Probiotic & Mg Recovery Bar',
    category: 'recovery',
    kcal: 210,
    proteinG: 16,
    carbsG: 24,
    waterMl: 100,
    staminaBoost: 20,
    xpReward: 20,
    accent: '#4F46E5',
  },
];

interface CharacterStyle {
  suitPrimary: string;
  suitAccent: string;
  visorColor: string;
  skinTone: string;
  hairColor: string;
  badgeText: string;
}

const CREW_CHARACTER_STYLES: Record<string, CharacterStyle> = {
  'crew-1': {
    suitPrimary: '#FFFFFF',
    suitAccent: '#0284C7',
    visorColor: '#38BDF8',
    skinTone: '#F6CBB4',
    hairColor: '#4A2C2A',
    badgeText: 'CDR',
  },
  'crew-2': {
    suitPrimary: '#F8FAFC',
    suitAccent: '#059669',
    visorColor: '#34D399',
    skinTone: '#C68642',
    hairColor: '#1E293B',
    badgeText: 'PLT',
  },
  'crew-3': {
    suitPrimary: '#FFFFFF',
    suitAccent: '#4F46E5',
    visorColor: '#818CF8',
    skinTone: '#F1C27D',
    hairColor: '#0F172A',
    badgeText: 'BIO',
  },
  'crew-4': {
    suitPrimary: '#F8FAFC',
    suitAccent: '#D97706',
    visorColor: '#FBBF24',
    skinTone: '#D99B66',
    hairColor: '#27272A',
    badgeText: 'EVA',
  },
};

interface AstronautWellnessGameProps {
  crewMember: CrewMember;
  sensorControl: CrewSensorControl;
  onCrewSensorChange: (
    crewId: string,
    patch: Partial<CrewSensorControl>
  ) => void;
  guideLanguage: GuideLanguage;
  onWellnessXpEarned?: (xp: number, reason: string) => void;
}

interface CrewWellnessProgress {
  stamina: number; // 0..100
  proteinG: number;
  carbsG: number;
  waterMl: number;
  kcalBurned: number;
  kcalConsumed: number;
  repsCompleted: number;
  muscleScore: number; // 0..100
  characterLevel: number;
  characterXp: number;
}

const DEFAULT_PROGRESS: CrewWellnessProgress = {
  stamina: 82,
  proteinG: 48,
  carbsG: 110,
  waterMl: 1250,
  kcalBurned: 185,
  kcalConsumed: 960,
  repsCompleted: 4,
  muscleScore: 76,
  characterLevel: 1,
  characterXp: 35,
};

export const AstronautWellnessGame: React.FC<AstronautWellnessGameProps> = ({
  crewMember,
  sensorControl,
  onCrewSensorChange,
  guideLanguage,
  onWellnessXpEarned,
}) => {
  const isTr = guideLanguage === 'tr';
  const [selectedExercise, setSelectedExercise] = useState<ExerciseId>('squat');
  const [isExercising, setIsExercising] = useState(false);
  const [phase, setPhase] = useState(0); // radians
  const [comboStreak, setComboStreak] = useState(1);
  const [floatingFeedback, setFloatingFeedback] = useState<{
    id: number;
    text: string;
    color: string;
  } | null>(null);
  const [visorOpen, setVisorOpen] = useState(true);

  const [progressByCrew, setProgressByCrew] = useState<
    Record<string, CrewWellnessProgress>
  >({});

  const progress = progressByCrew[crewMember.id] ?? DEFAULT_PROGRESS;
  const exerciseDef =
    EXERCISES.find((e) => e.id === selectedExercise) ?? EXERCISES[0];
  const charStyle =
    CREW_CHARACTER_STYLES[crewMember.id] ?? CREW_CHARACTER_STYLES['crew-1'];

  const prevCycleRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const showFloat = (text: string, color: string) => {
    setFloatingFeedback({ id: Date.now(), text, color });
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFloatingFeedback(null);
    }, 2000);
  };

  const updateCrewProgress = (
    updater: (prev: CrewWellnessProgress) => CrewWellnessProgress
  ) => {
    setProgressByCrew((prevMap) => {
      const current = prevMap[crewMember.id] ?? DEFAULT_PROGRESS;
      return {
        ...prevMap,
        [crewMember.id]: updater(current),
      };
    });
  };

  // Smooth 60fps skeletal animation loop
  useEffect(() => {
    let rafId = 0;

    const tickLoop = (now: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = now;
      }
      const dt = Math.min(0.05, (now - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = now;

      setPhase((prev) => {
        const speed = isExercising ? exerciseDef.speedRadPerSec : 1.1;
        const next = prev + dt * speed;

        if (isExercising) {
          const prevCycles = Math.floor(prev / (Math.PI * 2));
          const nextCycles = Math.floor(next / (Math.PI * 2));
          if (nextCycles > prevCycles && nextCycles !== prevCycleRef.current) {
            prevCycleRef.current = nextCycles;
            // Completed 1 full movement repetition!
            setComboStreak((c) => Math.min(5, c + 1));
            updateCrewProgress((curr) => {
              const nextStamina = Math.max(
                8,
                curr.stamina - exerciseDef.staminaCostPerRep
              );
              const gainedXp = 12;
              const nextCharXp = curr.characterXp + gainedXp;
              const nextLevel = 1 + Math.floor(nextCharXp / 100);
              return {
                ...curr,
                stamina: nextStamina,
                kcalBurned: Number(
                  (curr.kcalBurned + exerciseDef.kcalPerRep).toFixed(1)
                ),
                repsCompleted: curr.repsCompleted + 1,
                muscleScore: Math.min(
                  100,
                  Number(
                    (curr.muscleScore + exerciseDef.muscleGainPerRep).toFixed(1)
                  )
                ),
                characterXp: nextCharXp,
                characterLevel: nextLevel,
              };
            });

            if ((nextCycles % 5 === 0) && onWellnessXpEarned) {
              onWellnessXpEarned(
                45,
                isTr
                  ? `${crewMember.name} · 5 Tekrar Egzersiz Seti`
                  : `${crewMember.name} · 5-Rep Exercise Set`
              );
            }
          }
        }
        return next;
      });

      rafId = window.requestAnimationFrame(tickLoop);
    };

    rafId = window.requestAnimationFrame(tickLoop);
    return () => {
      window.cancelAnimationFrame(rafId);
      lastFrameTimeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExercising, exerciseDef.id, crewMember.id]);

  // Auto-pause if stamina gets critically low so the user feeds the astronaut!
  useEffect(() => {
    if (isExercising && progress.stamina <= 10) {
      setIsExercising(false);
      onCrewSensorChange(crewMember.id, { activityLoad: 'resting' });
      showFloat(
        isTr
          ? 'Enerji düşük! Sağdan besin/hidrasyon verin'
          : 'Low Stamina! Fuel astronaut on the right',
        '#D97706'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.stamina, isExercising]);

  const handleToggleExercise = () => {
    if (!isExercising && progress.stamina <= 12) {
      showFloat(
        isTr
          ? 'Önce sağ taraftan yakıt/su verin!'
          : 'Feed astronaut first to restore stamina!',
        '#D97706'
      );
      return;
    }
    const next = !isExercising;
    setIsExercising(next);
    if (next) {
      onCrewSensorChange(crewMember.id, {
        activityLoad: selectedExercise === 'stretch' ? 'nominal' : 'eva-exertion',
        o2FlowRateLpm: exerciseDef.recommendedO2,
        sensorActive: true,
      });
    } else {
      setComboStreak(1);
      onCrewSensorChange(crewMember.id, { activityLoad: 'nominal' });
    }
  };

  const handleManualRepBoost = () => {
    if (progress.stamina <= 10) {
      showFloat(
        isTr ? 'Yakıt gerekli! Besle →' : 'Needs fuel! Feed →',
        '#D97706'
      );
      return;
    }
    setPhase((p) => p + Math.PI * 1.95);
    if (!isExercising) {
      setIsExercising(true);
      onCrewSensorChange(crewMember.id, {
        activityLoad: 'eva-exertion',
        o2FlowRateLpm: exerciseDef.recommendedO2,
        sensorActive: true,
      });
    }
    showFloat(`+1 ${isTr ? 'TEKRAR' : 'REP'} · +12 XP`, charStyle.suitAccent);
  };

  const handleFeedMeal = (meal: SpaceMeal) => {
    updateCrewProgress((curr) => {
      const nextXp = curr.characterXp + meal.xpReward;
      return {
        ...curr,
        stamina: Math.min(100, curr.stamina + meal.staminaBoost),
        proteinG: curr.proteinG + meal.proteinG,
        carbsG: curr.carbsG + meal.carbsG,
        waterMl: curr.waterMl + meal.waterMl,
        kcalConsumed: curr.kcalConsumed + meal.kcal,
        characterXp: nextXp,
        characterLevel: 1 + Math.floor(nextXp / 100),
      };
    });

    // Hydrating / recovering improves suit cooling & settles exertion if resting
    if (meal.category === 'hydration' || meal.category === 'recovery') {
      onCrewSensorChange(crewMember.id, {
        coolingLoopPct: Math.min(100, sensorControl.coolingLoopPct + 6),
      });
    }

    showFloat(
      `+${meal.staminaBoost}% ${isTr ? 'Enerji' : 'Stamina'} · +${meal.xpReward} XP`,
      meal.accent
    );
    onWellnessXpEarned?.(
      meal.xpReward,
      isTr
        ? `${crewMember.name} beslendi (${meal.nameTr})`
        : `${crewMember.name} fueled (${meal.nameEn})`
    );
  };

  // Compute articulated character skeleton coordinates!
  const pose = useMemo(() => {
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    const squatFactor = isExercising
      ? (Math.sin(phase - Math.PI / 2) + 1) / 2
      : 0; // 0 standing -> 1 deep squat

    // Baseline standing skeleton centered around X=180, floor Y=245
    let hipX = 180;
    let hipY = 162;
    let torsoTilt = 0; // radians
    let lShoulderAngle = 0.35; // radians down-left
    let lElbowBend = 0.25;
    let rShoulderAngle = -0.35; // radians down-right
    let rElbowBend = -0.25;
    let lHipAngle = 0.14;
    let lKneeAngle = 0.08;
    let rHipAngle = -0.14;
    let rKneeAngle = -0.08;
    let barYOffset = 0;

    if (!isExercising) {
      // Gentle Zero-G idle float
      hipY = 160 + s * 4;
      lShoulderAngle = 0.42 + s * 0.06;
      rShoulderAngle = -0.42 - s * 0.06;
      lElbowBend = 0.35;
      rElbowBend = -0.35;
    } else if (selectedExercise === 'squat') {
      // Deep ARED Barbell Squat
      hipY = 162 + squatFactor * 36;
      torsoTilt = squatFactor * 0.18;
      // Legs bend outward at knees then back to feet
      lHipAngle = 0.18 + squatFactor * 1.02;
      lKneeAngle = -squatFactor * 1.85;
      rHipAngle = -0.18 - squatFactor * 1.02;
      rKneeAngle = squatFactor * 1.85;
      // Arms raised holding ARED bar at shoulder height
      lShoulderAngle = 1.95;
      lElbowBend = -1.65;
      rShoulderAngle = -1.95;
      rElbowBend = 1.65;
      barYOffset = squatFactor * 36;
    } else if (selectedExercise === 'jacks') {
      // Jumping Jacks: jump up + arms swing overhead + legs spread
      const jackCycle = (Math.sin(phase - Math.PI / 2) + 1) / 2; // 0..1
      hipY = 162 - jackCycle * 16;
      lShoulderAngle = 0.35 + jackCycle * 2.45;
      lElbowBend = 0.2;
      rShoulderAngle = -0.35 - jackCycle * 2.45;
      rElbowBend = -0.2;
      lHipAngle = 0.12 + jackCycle * 0.48;
      lKneeAngle = 0.05;
      rHipAngle = -0.12 - jackCycle * 0.48;
      rKneeAngle = -0.05;
    } else if (selectedExercise === 'treadmill') {
      // Bungee Treadmill Sprint: alternating stride + arm pump
      hipY = 160 + Math.abs(s) * -7;
      torsoTilt = 0.16;
      lHipAngle = s * 0.72;
      lKneeAngle = s > 0 ? -0.55 : -1.05 * Math.abs(c);
      rHipAngle = -s * 0.72;
      rKneeAngle = s < 0 ? -0.55 : -1.05 * Math.abs(c);
      // Opposite arms swing forward/back
      lShoulderAngle = -s * 0.85 + 0.15;
      lElbowBend = -1.15;
      rShoulderAngle = s * 0.85 - 0.15;
      rElbowBend = -1.15;
    } else if (selectedExercise === 'stretch') {
      // Microgravity Spine Stretch & Overhead Reach
      hipY = 156 + s * 6;
      torsoTilt = Math.sin(phase * 0.5) * 0.22;
      lShoulderAngle = 2.65 + s * 0.25;
      lElbowBend = -0.18;
      rShoulderAngle = -2.65 + s * 0.25;
      rElbowBend = 0.18;
      lHipAngle = 0.2 + s * 0.12;
      rHipAngle = -0.2 - s * 0.12;
    }

    const torsoLen = 48;
    const upperArmLen = 27;
    const foreArmLen = 25;
    const thighLen = 36;
    const calfLen = 36;

    const shoulderCenter = {
      x: hipX + Math.sin(torsoTilt) * torsoLen,
      y: hipY - Math.cos(torsoTilt) * torsoLen,
    };
    const headCenter = {
      x: shoulderCenter.x + Math.sin(torsoTilt) * 24,
      y: shoulderCenter.y - Math.cos(torsoTilt) * 24,
    };

    // Limb endpoint helper (angle=0 points straight down +Y)
    const pt = (ox: number, oy: number, angle: number, len: number) => ({
      x: ox + Math.sin(angle) * len,
      y: oy + Math.cos(angle) * len,
    });

    const lShoulder = {
      x: shoulderCenter.x - 16,
      y: shoulderCenter.y + 4,
    };
    const rShoulder = {
      x: shoulderCenter.x + 16,
      y: shoulderCenter.y + 4,
    };

    // For treadmill, compute side-view arms/legs cleanly from torso
    const lElbow = pt(
      lShoulder.x,
      lShoulder.y,
      -lShoulderAngle,
      upperArmLen
    );
    const lHand = pt(
      lElbow.x,
      lElbow.y,
      -lShoulderAngle - lElbowBend,
      foreArmLen
    );

    const rElbow = pt(
      rShoulder.x,
      rShoulder.y,
      -rShoulderAngle,
      upperArmLen
    );
    const rHand = pt(
      rElbow.x,
      rElbow.y,
      -rShoulderAngle - rElbowBend,
      foreArmLen
    );

    const lHip = { x: hipX - 10, y: hipY };
    const rHip = { x: hipX + 10, y: hipY };

    const lKnee = pt(lHip.x, lHip.y, -lHipAngle, thighLen);
    const lFoot = pt(lKnee.x, lKnee.y, -lHipAngle - lKneeAngle, calfLen);

    const rKnee = pt(rHip.x, rHip.y, -rHipAngle, thighLen);
    const rFoot = pt(rKnee.x, rKnee.y, -rHipAngle - rKneeAngle, calfLen);

    return {
      hipX,
      hipY,
      torsoTilt,
      shoulderCenter,
      headCenter,
      lShoulder,
      rShoulder,
      lElbow,
      lHand,
      rElbow,
      rHand,
      lHip,
      rHip,
      lKnee,
      lFoot,
      rKnee,
      rFoot,
      barYOffset,
      treadmillScroll: (phase * 28) % 24,
    };
  }, [phase, isExercising, selectedExercise]);

  const proteinPct = Math.min(100, Math.round((progress.proteinG / 110) * 100));
  const hydrationPct = Math.min(100, Math.round((progress.waterMl / 2400) * 100));
  const carbPct = Math.min(100, Math.round((progress.carbsG / 260) * 100));

  return (
    <HudCard
      title={
        isTr
          ? `Astronot Karakter · Egzersiz & Uzay Diyeti Oyunu — ${crewMember.name}`
          : `Astronaut Character · Exercise & Space Nutrition Studio — ${crewMember.name}`
      }
      tier={isExercising ? 'focused' : 'default'}
      rightSlot={
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="font-semibold text-[#0284C7]">
            LVL {progress.characterLevel} · {progress.characterXp} XP
          </span>
          <span className="text-[#475569]">
            {isExercising
              ? `${comboStreak}x COMBO`
              : isTr
                ? 'HAZIR'
                : 'READY'}
          </span>
        </div>
      }
    >
      {/* Desktop Widescreen 12-Column Split: 7-col Character Arena + 5-col Diet & Macro Fueling */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* LEFT 7 COLS: Animated Astronaut Character Gym Stage */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          {/* Exercise Selector Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EXERCISES.map((ex) => {
              const active = ex.id === selectedExercise;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setSelectedExercise(ex.id)}
                  className={`p-2.5 rounded-[6px] border text-left transition-all ${
                    active
                      ? 'bg-[#E0F2FE] border-[#0284C7] shadow-sm'
                      : 'bg-[#F4F9FD] border-[#D5E5F2] hover:border-[#94A3B8]'
                  }`}
                >
                  <div className="text-xs font-semibold text-[#0F172A] truncate">
                    {isTr ? ex.nameTr : ex.nameEn}
                  </div>
                  <div className="text-[11px] font-mono text-[#0284C7] mt-0.5">
                    {ex.kcalPerRep} kcal/{isTr ? 'tek' : 'rep'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Character Canvas */}
          <div className="relative rounded-[8px] border border-[#CBD5E1] bg-gradient-to-b from-[#F0F9FF] via-[#F8FAFC] to-[#E0F2FE]/60 overflow-hidden">
            {/* Top-left Character Stats Overlay */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#D5E5F2] bg-white/80">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-[#0F172A]">
                  {crewMember.name} ({charStyle.badgeText})
                </span>
                <span className="text-[#CBD5E1]">|</span>
                <span className="font-mono text-[#475569]">
                  HR{' '}
                  <strong className="text-[#0284C7]">
                    {crewMember.sensorActive
                      ? crewMember.heartRate + (isExercising ? 14 : 0)
                      : '--'}
                  </strong>{' '}
                  bpm
                </span>
                <span className="font-mono text-[#475569]">
                  {isTr ? 'Kas' : 'Muscle'}{' '}
                  <strong className="text-[#059669]">
                    {progress.muscleScore.toFixed(0)}%
                  </strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setVisorOpen((v) => !v)}
                className="text-[11px] font-mono font-semibold text-[#0284C7] hover:underline"
              >
                {visorOpen
                  ? isTr
                    ? 'Kask Vizörünü Kapat'
                    : 'Close Helmet Visor'
                  : isTr
                    ? 'Kask Vizörünü Aç'
                    : 'Open Helmet Visor'}
              </button>
            </div>

            {/* Floating XP / Rep Popups */}
            {floatingFeedback && (
              <div
                key={floatingFeedback.id}
                className="absolute top-14 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-[6px] bg-white/95 border border-[#CBD5E1] shadow-md text-xs font-mono font-bold pointer-events-none"
                style={{ color: floatingFeedback.color }}
              >
                {floatingFeedback.text}
              </div>
            )}

            <svg
              viewBox="0 0 360 275"
              className="w-full h-[270px] sm:h-[290px] select-none"
              aria-label={`Animated astronaut character ${crewMember.name} performing ${exerciseDef.nameEn}`}
            >
              <defs>
                <radialGradient id="habitGlow" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor={charStyle.suitAccent} stopOpacity="0.16" />
                  <stop offset="100%" stopColor={charStyle.suitAccent} stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Orbital Habitat Background */}
              <circle cx="180" cy="135" r="120" fill="url(#habitGlow)" />
              <circle
                cx="295"
                cy="58"
                r="26"
                fill="#E0F2FE"
                stroke="#7DD3FC"
                strokeWidth="1.5"
              />
              <path
                d="M 278 58 Q 295 44 312 58"
                fill="none"
                stroke="#0284C7"
                strokeOpacity="0.45"
                strokeWidth="1.5"
              />
              <circle cx="62" cy="48" r="2" fill="#0284C7" fillOpacity="0.4" />
              <circle cx="94" cy="72" r="1.5" fill="#059669" fillOpacity="0.45" />
              <circle cx="240" cy="42" r="1.8" fill="#4F46E5" fillOpacity="0.35" />

              {/* Exercise Deck / Floor */}
              <rect
                x="45"
                y="242"
                width="270"
                height="12"
                rx="4"
                fill="#DCEAF6"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />

              {/* Exercise-specific Equipment */}
              {selectedExercise === 'squat' && (
                <g>
                  {/* ARED Resistance Cables */}
                  <line
                    x1="92"
                    y1="242"
                    x2="112"
                    y2={122 + pose.barYOffset}
                    stroke="#475569"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <line
                    x1="268"
                    y1="242"
                    x2="248"
                    y2={122 + pose.barYOffset}
                    stroke="#475569"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  {/* ARED Barbell */}
                  <line
                    x1="102"
                    y1={122 + pose.barYOffset}
                    x2="258"
                    y2={122 + pose.barYOffset}
                    stroke="#334155"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  <rect
                    x="102"
                    y={112 + pose.barYOffset}
                    width="9"
                    height="20"
                    rx="2"
                    fill={charStyle.suitAccent}
                  />
                  <rect
                    x="249"
                    y={112 + pose.barYOffset}
                    width="9"
                    height="20"
                    rx="2"
                    fill={charStyle.suitAccent}
                  />
                </g>
              )}

              {selectedExercise === 'treadmill' && (
                <g>
                  {/* Treadmill Belt & Bungee Anchor */}
                  <rect
                    x="95"
                    y="234"
                    width="170"
                    height="10"
                    rx="4"
                    fill="#334155"
                  />
                  {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                    const bx = 104 + ((idx * 24 - pose.treadmillScroll + 168) % 156);
                    return (
                      <line
                        key={idx}
                        x1={bx}
                        y1="236"
                        x2={bx}
                        y2="242"
                        stroke="#38BDF8"
                        strokeWidth="2"
                      />
                    );
                  })}
                  {/* Bungee Harness Straps */}
                  <line
                    x1="120"
                    y1="234"
                    x2={pose.hipX - 10}
                    y2={pose.hipY}
                    stroke="#0284C7"
                    strokeOpacity="0.45"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1="240"
                    y1="234"
                    x2={pose.hipX + 10}
                    y2={pose.hipY}
                    stroke="#0284C7"
                    strokeOpacity="0.45"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                </g>
              )}

              {/* Back Arm (Left) */}
              <g strokeLinecap="round" strokeLinejoin="round">
                <line
                  x1={pose.lShoulder.x}
                  y1={pose.lShoulder.y}
                  x2={pose.lElbow.x}
                  y2={pose.lElbow.y}
                  stroke="#CBD5E1"
                  strokeWidth="11"
                />
                <line
                  x1={pose.lShoulder.x}
                  y1={pose.lShoulder.y}
                  x2={pose.lElbow.x}
                  y2={pose.lElbow.y}
                  stroke={charStyle.suitPrimary}
                  strokeWidth="7.5"
                />
                <line
                  x1={pose.lElbow.x}
                  y1={pose.lElbow.y}
                  x2={pose.lHand.x}
                  y2={pose.lHand.y}
                  stroke="#CBD5E1"
                  strokeWidth="9.5"
                />
                <line
                  x1={pose.lElbow.x}
                  y1={pose.lElbow.y}
                  x2={pose.lHand.x}
                  y2={pose.lHand.y}
                  stroke={charStyle.suitPrimary}
                  strokeWidth="6.5"
                />
                <circle
                  cx={pose.lHand.x}
                  cy={pose.lHand.y}
                  r="5.2"
                  fill={charStyle.suitAccent}
                />
              </g>

              {/* Left & Right Legs */}
              <g strokeLinecap="round" strokeLinejoin="round">
                {/* Left Leg */}
                <line
                  x1={pose.lHip.x}
                  y1={pose.lHip.y}
                  x2={pose.lKnee.x}
                  y2={pose.lKnee.y}
                  stroke="#94A3B8"
                  strokeWidth="12.5"
                />
                <line
                  x1={pose.lHip.x}
                  y1={pose.lHip.y}
                  x2={pose.lKnee.x}
                  y2={pose.lKnee.y}
                  stroke={charStyle.suitPrimary}
                  strokeWidth="9"
                />
                <line
                  x1={pose.lKnee.x}
                  y1={pose.lKnee.y}
                  x2={pose.lFoot.x}
                  y2={pose.lFoot.y}
                  stroke="#94A3B8"
                  strokeWidth="11"
                />
                <line
                  x1={pose.lKnee.x}
                  y1={pose.lKnee.y}
                  x2={pose.lFoot.x}
                  y2={pose.lFoot.y}
                  stroke={charStyle.suitPrimary}
                  strokeWidth="7.5"
                />
                <ellipse
                  cx={pose.lFoot.x - 3}
                  cy={pose.lFoot.y + 3}
                  rx="8.5"
                  ry="4.5"
                  fill={charStyle.suitAccent}
                />

                {/* Right Leg */}
                <line
                  x1={pose.rHip.x}
                  y1={pose.rHip.y}
                  x2={pose.rKnee.x}
                  y2={pose.rKnee.y}
                  stroke="#94A3B8"
                  strokeWidth="12.5"
                />
                <line
                  x1={pose.rHip.x}
                  y1={pose.rHip.y}
                  x2={pose.rKnee.x}
                  y2={pose.rKnee.y}
                  stroke={charStyle.suitPrimary}
                  strokeWidth="9"
                />
                <line
                  x1={pose.rKnee.x}
                  y1={pose.rKnee.y}
                  x2={pose.rFoot.x}
                  y2={pose.rFoot.y}
                  stroke="#94A3B8"
                  strokeWidth="11"
                />
                <line
                  x1={pose.rKnee.x}
                  y1={pose.rKnee.y}
                  x2={pose.rFoot.x}
                  y2={pose.rFoot.y}
                  stroke={charStyle.suitPrimary}
                  strokeWidth="7.5"
                />
                <ellipse
                  cx={pose.rFoot.x + 3}
                  cy={pose.rFoot.y + 3}
                  rx="8.5"
                  ry="4.5"
                  fill={charStyle.suitAccent}
                />
              </g>

              {/* Torso & Life Support Suit Pack */}
              <g
                transform={`translate(${pose.hipX}, ${pose.hipY}) rotate(${(pose.torsoTilt * 180) / Math.PI})`}
              >
                {/* Backpack PLSS */}
                <rect
                  x="-21"
                  y="-48"
                  width="42"
                  height="38"
                  rx="7"
                  fill="#E2E8F0"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                />
                {/* Main Torso Suit */}
                <rect
                  x="-17"
                  y="-50"
                  width="34"
                  height="50"
                  rx="10"
                  fill={charStyle.suitPrimary}
                  stroke="#64748B"
                  strokeWidth="1.8"
                />
                {/* Chest Telemetry Unit */}
                <rect
                  x="-10"
                  y="-38"
                  width="20"
                  height="14"
                  rx="3"
                  fill="#F0F9FF"
                  stroke={charStyle.suitAccent}
                  strokeWidth="1.4"
                />
                <circle cx="-4" cy="-31" r="2.2" fill="#059669" />
                <circle cx="3" cy="-31" r="2.2" fill={charStyle.suitAccent} />
                {/* Waist Belt */}
                <rect
                  x="-17"
                  y="-9"
                  width="34"
                  height="6"
                  rx="2"
                  fill={charStyle.suitAccent}
                />
              </g>

              {/* Front Arm (Right) */}
              <g strokeLinecap="round" strokeLinejoin="round">
                <line
                  x1={pose.rShoulder.x}
                  y1={pose.rShoulder.y}
                  x2={pose.rElbow.x}
                  y2={pose.rElbow.y}
                  stroke="#94A3B8"
                  strokeWidth="11"
                />
                <line
                  x1={pose.rShoulder.x}
                  y1={pose.rShoulder.y}
                  x2={pose.rElbow.x}
                  y2={pose.rElbow.y}
                  stroke={charStyle.suitPrimary}
                  strokeWidth="7.5"
                />
                <line
                  x1={pose.rElbow.x}
                  y1={pose.rElbow.y}
                  x2={pose.rHand.x}
                  y2={pose.rHand.y}
                  stroke="#94A3B8"
                  strokeWidth="9.5"
                />
                <line
                  x1={pose.rElbow.x}
                  y1={pose.rElbow.y}
                  x2={pose.rHand.x}
                  y2={pose.rHand.y}
                  stroke={charStyle.suitPrimary}
                  strokeWidth="6.5"
                />
                <circle
                  cx={pose.rHand.x}
                  cy={pose.rHand.y}
                  r="5.2"
                  fill={charStyle.suitAccent}
                />
              </g>

              {/* Astronaut Helmet & Expressive Face */}
              <g transform={`translate(${pose.headCenter.x}, ${pose.headCenter.y})`}>
                <circle
                  cx="0"
                  cy="0"
                  r="22"
                  fill="#FFFFFF"
                  stroke="#64748B"
                  strokeWidth="2"
                />
                {/* Visor Opening */}
                <rect
                  x="-15"
                  y="-12"
                  width="30"
                  height="22"
                  rx="10"
                  fill={visorOpen ? charStyle.skinTone : charStyle.visorColor}
                  stroke={charStyle.suitAccent}
                  strokeWidth="1.6"
                />
                {visorOpen ? (
                  <g>
                    {/* Hair tuft */}
                    <path
                      d="M -12 -8 Q 0 -17 12 -8"
                      fill={charStyle.hairColor}
                    />
                    {/* Eyes */}
                    <circle cx="-5.5" cy="-1.5" r="2.1" fill="#0F172A" />
                    <circle cx="5.5" cy="-1.5" r="2.1" fill="#0F172A" />
                    {/* Smile / Effort expression */}
                    {isExercising ? (
                      <path
                        d="M -4 4.5 Q 0 8.5 4 4.5"
                        fill="none"
                        stroke="#0F172A"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    ) : (
                      <path
                        d="M -4.5 4 Q 0 7.5 4.5 4"
                        fill="none"
                        stroke="#0F172A"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    )}
                    {/* Sweat droplet during active workout */}
                    {isExercising && (
                      <path
                        d="M 11 -5 Q 13 -1 11 1 Q 9 -1 11 -5"
                        fill="#0284C7"
                      />
                    )}
                  </g>
                ) : (
                  <path
                    d="M -8 -6 Q 0 -9 9 -3"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeOpacity="0.65"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}
              </g>
            </svg>

            {/* Exercise Control Bar */}
            <div className="px-4 py-3 bg-white/95 border-t border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="label-caps text-[#475569] block">
                    {isTr ? 'TEKRAR' : 'REPS'}
                  </span>
                  <span className="telemetry-md font-semibold text-[#0284C7]">
                    {progress.repsCompleted}
                  </span>
                </div>
                <div>
                  <span className="label-caps text-[#475569] block">
                    {isTr ? 'YAKILAN' : 'BURNED'}
                  </span>
                  <span className="telemetry-md font-semibold text-[#D97706]">
                    {progress.kcalBurned.toFixed(0)}{' '}
                    <span className="text-xs font-normal">kcal</span>
                  </span>
                </div>
                <div>
                  <span className="label-caps text-[#475569] block">
                    {isTr ? 'HEDEF' : 'FOCUS'}
                  </span>
                  <span className="text-xs font-medium text-[#334155]">
                    {isTr ? exerciseDef.targetTr : exerciseDef.targetEn}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualRepBoost}
                  className="px-3 py-2 rounded-[6px] bg-[#F4F9FD] border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] hover:border-[#0284C7] hover:text-[#0284C7] inline-flex items-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>{isTr ? '+1 Tekrar Yap' : '+1 Rep Boost'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleExercise}
                  className={`px-4 py-2 rounded-[6px] text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
                    isExercising
                      ? 'bg-[#FFFBEB] border border-[#D97706] text-[#B45309]'
                      : 'bg-[#0284C7] text-white hover:bg-[#0369A1] shadow-sm'
                  }`}
                >
                  {isExercising ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>{isTr ? 'Duraklat' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{isTr ? 'Egzersizi Başlat' : 'Start Exercise'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: Space Diet, Stamina & Macro Fueling Bay */}
        <div className="xl:col-span-5 flex flex-col justify-between gap-4">
          {/* Character Energy & Daily Diet Gauges */}
          <div className="hud-trough p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#0284C7]" />
                <span className="label-caps text-[#0F172A]">
                  {isTr
                    ? 'KARAKTER ENERJİSİ & UZAY DİYETİ'
                    : 'CHARACTER STAMINA & NUTRITION'}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateCrewProgress(() => ({ ...DEFAULT_PROGRESS }))
                }
                title={isTr ? 'Günlük değerleri sıfırla' : 'Reset daily stats'}
                className="text-xs text-[#64748B] hover:text-[#0F172A] inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isTr ? 'Sıfırla' : 'Reset'}</span>
              </button>
            </div>

            {/* Stamina Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#334155] flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-[#D97706]" />
                  {isTr ? 'Egzersiz Enerjisi (Stamina)' : 'Exercise Stamina'}
                </span>
                <span className="font-mono font-semibold text-[#0F172A]">
                  {progress.stamina}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#DCEAF6] overflow-hidden border border-[#CBD5E1]">
                <div
                  className={`h-full transition-all duration-300 ${
                    progress.stamina < 25
                      ? 'bg-[#DC2626]'
                      : progress.stamina < 50
                        ? 'bg-[#D97706]'
                        : 'bg-[#059669]'
                  }`}
                  style={{ width: `${progress.stamina}%` }}
                />
              </div>
            </div>

            {/* 3 Macro Progress Bars */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-[#475569]">
                  <span>PROTEİN</span>
                  <span className="font-semibold text-[#0284C7]">
                    {progress.proteinG}g
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#DCEAF6] mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#0284C7] transition-all duration-300"
                    style={{ width: `${proteinPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-[#475569]">
                  <span>HİDRASYON</span>
                  <span className="font-semibold text-[#059669]">
                    {progress.waterMl}ml
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#DCEAF6] mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#059669] transition-all duration-300"
                    style={{ width: `${hydrationPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-[#475569]">
                  <span>KARBONHİDRAT</span>
                  <span className="font-semibold text-[#D97706]">
                    {progress.carbsG}g
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#DCEAF6] mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[#D97706] transition-all duration-300"
                    style={{ width: `${carbPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#D5E5F2] text-xs font-mono text-[#475569]">
              <span>
                {isTr ? 'Alınan' : 'Intake'}:{' '}
                <strong className="text-[#0F172A]">
                  {progress.kcalConsumed} kcal
                </strong>
              </span>
              <span>
                {isTr ? 'Kas Yoğunluğu' : 'Muscle Index'}:{' '}
                <strong className="text-[#059669]">
                  {progress.muscleScore.toFixed(1)}%
                </strong>
              </span>
            </div>
          </div>

          {/* Space Diet Meal & Hydration Action Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[#475569] flex items-center gap-1.5">
                <Apple className="w-3.5 h-3.5 text-[#059669]" />
                {isTr
                  ? 'UZAY DİYETİ & YAKIT İKMALİ (BESLE)'
                  : 'SPACE DIET & RATION FUELING'}
              </span>
              <span className="text-[11px] font-mono text-[#0284C7] font-semibold">
                {isTr ? 'Tıkla & Besle' : 'Click to Fuel'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              {SPACE_MEALS.map((meal) => (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => handleFeedMeal(meal)}
                  className="p-2.5 rounded-[6px] bg-white border border-[#CBD5E1] hover:border-[#0284C7] hover:bg-[#F0F9FF] transition-all flex items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#0F172A] truncate">
                      {isTr ? meal.nameTr : meal.nameEn}
                    </div>
                    <div className="text-[11px] font-mono text-[#475569] mt-0.5 flex flex-wrap gap-2">
                      <span>{meal.kcal} kcal</span>
                      {meal.proteinG > 0 && <span>+{meal.proteinG}g Pro</span>}
                      {meal.waterMl > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[#059669]">
                          <Droplets className="w-3 h-3" />+{meal.waterMl}ml
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className="px-2.5 py-1 rounded-[4px] text-[11px] font-mono font-semibold text-white shrink-0 inline-flex items-center gap-1"
                    style={{ backgroundColor: meal.accent }}
                  >
                    <Sparkles className="w-3 h-3" />+{meal.staminaBoost}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Character Level Progress Footer */}
          <div className="p-3 rounded-[6px] bg-gradient-to-r from-[#E0F2FE]/70 to-[#ECFDF5]/70 border border-[#BAE6FD] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#0F172A]">
              <Award className="w-4 h-4 text-[#0284C7]" />
              <span>
                {isTr
                  ? `${crewMember.name} · Seviye ${progress.characterLevel} Atlet`
                  : `${crewMember.name} · Level ${progress.characterLevel} Athlete`}
              </span>
            </div>
            <span className="font-mono text-xs font-semibold text-[#059669]">
              {progress.characterXp % 100}/100 XP
            </span>
          </div>
        </div>
      </div>
    </HudCard>
  );
};
