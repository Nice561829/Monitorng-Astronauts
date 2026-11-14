import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  HeartPulse,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  CrewMember,
  CrewSensorControl,
  GuideLanguage,
  SystemSeverity,
} from '../types/telemetry';
import { HudCard, StatusChip } from './HudPrimitives';

export type CrisisId = 'hypoxia' | 'hyperthermia' | 'cardiac';

interface CrisisStep {
  atPct: number;
  titleEn: string;
  titleTr: string;
  captionEn: string;
  captionTr: string;
}

interface CrisisScenario {
  id: CrisisId;
  titleEn: string;
  titleTr: string;
  badgeEn: string;
  badgeTr: string;
  psychologyColorNameEn: string;
  psychologyColorNameTr: string;
  psychologyDescEn: string;
  psychologyDescTr: string;
  durationSec: number;
  steps: CrisisStep[];
}

const CRISIS_SCENARIOS: CrisisScenario[] = [
  {
    id: 'hypoxia',
    titleEn: 'Acute Hypoxia & O₂ Feed Drop',
    titleTr: 'Akut Hipoksi ve O₂ Basınç Düşüşü',
    badgeEn: 'OXYGEN EMERGENCY',
    badgeTr: 'OKSİJEN KRİZİ',
    psychologyColorNameEn: 'Amber → Red Triage Focus',
    psychologyColorNameTr: 'Kehribar → Kırmızı Acil Odak',
    psychologyDescEn:
      'Red suppresses peripheral distractions to lock attention on airway and O₂ flow restoration; transitions to Emerald once SpO₂ stabilizes.',
    psychologyDescTr:
      'Kırmızı ton çevresel dikkati kesip odağı hava yolu ve O₂ akışına kilitler; SpO₂ dengelendiğinde güven verici Zümrüt Yeşiline döner.',
    durationSec: 12,
    steps: [
      {
        atPct: 0,
        titleEn: '1. Detect SpO₂ Drop',
        titleTr: '1. SpO₂ Düşüşünü Tespit Et',
        captionEn:
          'Suit O₂ regulator fell below 1.2 L/min. Blood oxygen drops rapidly before dizziness starts.',
        captionTr:
          'Giysi O₂ regülatörü 1.2 L/dk altına düştü. Baş dönmesi başlamadan önce kandaki oksijen hızla azalır.',
      },
      {
        atPct: 28,
        titleEn: '2. Open Emergency O₂ Valve',
        titleTr: '2. Acil O₂ Besleme Vanasını Aç',
        captionEn:
          'Increase Suit O₂ Feed Flow Rate to ≥ 2.0 L/min to restore alveolar partial pressure.',
        captionTr:
          'Akciğer alveol basıncını geri kazandırmak için Giysi O₂ Besleme Debisini ≥ 2.0 L/dk seviyesine çıkarın.',
      },
      {
        atPct: 62,
        titleEn: '3. Reduce Physical Workload',
        titleTr: '3. Fiziksel Eforu Azalt',
        captionEn:
          'Switch metabolic workload from EVA Exertion to Resting so muscles consume less oxygen.',
        captionTr:
          'Kasların oksijen tüketimini azaltmak için metabolik yükü Dinlenme (Resting) moduna alın.',
      },
      {
        atPct: 86,
        titleEn: '4. Confirm Recovery (>96% SpO₂)',
        titleTr: '4. İyileşmeyi Doğrula (>%96 SpO₂)',
        captionEn:
          'Vital signs return to Bio-Vital Emerald stability. Log event and monitor for 60 seconds.',
        captionTr:
          'Yaşamsal değerler Biyo-Canlı Yeşil güven bölgesine döner. Kaydı tamamlayın ve 60 sn izleyin.',
      },
    ],
  },
  {
    id: 'hyperthermia',
    titleEn: 'Thermal Runaway & Heat Exhaustion',
    titleTr: 'Hızlı Isınma ve Sıvı Soğutma Arızası',
    badgeEn: 'THERMAL CRISIS',
    badgeTr: 'ISI KRİZİ',
    psychologyColorNameEn: 'Amber Vigilance → Cool Cyan',
    psychologyColorNameTr: 'Kehribar Uyarı → Serin Camgöbeği',
    psychologyDescEn:
      'High-visibility Amber alerts the operator to metabolic heat buildup; engaging coolant restores psychological cooling Cyan.',
    psychologyDescTr:
      'Kehribar tonu ısı birikimine karşı seçici dikkati artırır; soğutma devresi açıldığında ekran psikolojik serinlik veren Camgöbeğine geçer.',
    durationSec: 12,
    steps: [
      {
        atPct: 0,
        titleEn: '1. Core Temp Rising (>37.6°C)',
        titleTr: '1. Çekirdek Isı Artışı (>37.6°C)',
        captionEn:
          'Liquid Cooling Garment (LCG) flow dropped below 30%. Heat accumulates inside the insulated suit.',
        captionTr:
          'Sıvı Soğutma Giysisi (LCG) akışı %30 altına düştü. Yalıtımlı giysi içinde ısı hızla birikir.',
      },
      {
        atPct: 30,
        titleEn: '2. Maximize Coolant Loop (≥80%)',
        titleTr: '2. Soğutma Döngüsünü Yükselt (≥%80)',
        captionEn:
          'Raise Liquid Cooling Loop Flow above 80% and ensure Sublimator Water Cooling is active.',
        captionTr:
          'Sıvı Soğutma Döngüsünü %80 üzerine çıkarın ve Sublimatör Su Soğutmasının açık olduğundan emin olun.',
      },
      {
        atPct: 65,
        titleEn: '3. Halt EVA Exertion',
        titleTr: '3. EVA Eforunu Durdur',
        captionEn:
          'Set Metabolic Workload to Resting to stop internal metabolic heat generation.',
        captionTr:
          'İç ısı üretimini durdurmak için Metabolik Yükü Dinlenme (Resting) konumuna getirin.',
      },
      {
        atPct: 88,
        titleEn: '4. Core Temp Stabilized',
        titleTr: '4. Vücut Isısı Dengelendi',
        captionEn:
          'Coolant absorbs excess thermal load and heart rate drops back into the resting baseline.',
        captionTr:
          'Soğutma sıvısı fazla ısıyı çeker ve nabız normal dinlenme bandına geri iner.',
      },
    ],
  },
  {
    id: 'cardiac',
    titleEn: 'Cardiac Arrhythmia & Sensor Triage',
    titleTr: 'Kardiyak Ritim Bozukluğu ve İlk Yardım',
    badgeEn: 'CARDIAC TRIAGE',
    badgeTr: 'KARDİYAK TRİYAJ',
    psychologyColorNameEn: 'Urgent Red → Calibrated Emerald',
    psychologyColorNameTr: 'Acil Kırmızı → Dengeli Zümrüt',
    psychologyDescEn:
      'Red triggers rapid motor response for 110 BPM CPR/AED cadence; Kalman filter verification restores calm analytical Cyan.',
    psychologyDescTr:
      'Kırmızı renk 110 BPM CPR/AED temposu için hızlı refleks uyandırır; Kalman filtresi ve ritim stabilizasyonu sakin Camgöbeği/Yeşile döndürür.',
    durationSec: 12,
    steps: [
      {
        atPct: 0,
        titleEn: '1. Verify Raw ECG Signal',
        titleTr: '1. Ham EKG Sinyalini Doğrula',
        captionEn:
          'Motion noise can mask arrhythmia. Enable the Kalman Signal Noise Filter to isolate true R-waves.',
        captionTr:
          'Hareket gürültüsü ritim bozukluğunu gizleyebilir. Gerçek EKG tepelerini görmek için Kalman Filtresini açın.',
      },
      {
        atPct: 30,
        titleEn: '2. Support Oxygenation',
        titleTr: '2. Oksijen Desteği Sağla',
        captionEn:
          'Maintain Suit O₂ Feed ≥ 1.8 L/min so myocardial tissue receives uninterrupted oxygen.',
        captionTr:
          'Kalp kasının oksijensiz kalmaması için O₂ akışını ≥ 1.8 L/dk düzeyinde tutun.',
      },
      {
        atPct: 60,
        titleEn: '3. Synchronized AED / Compression Cadence',
        titleTr: '3. Senkronize AED / Kompresyon Desteği',
        captionEn:
          'Deliver synchronized suit defibrillation / compression assist while heart rate exceeds 105 bpm.',
        captionTr:
          'Nabız 105 bpm üzerindeyken ritmi stabilize etmek için senkronize AED / göğüs basısı desteğini uygulayın.',
      },
      {
        atPct: 86,
        titleEn: '4. Sinus Rhythm Restored',
        titleTr: '4. Normal Sinüs Ritmine Dönüş',
        captionEn:
          'Regular P-QRS-T complex verified on the ECG monitor. Keep astronaut in Resting state.',
        captionTr:
          'EKG ekranında düzenli sinüs ritmi doğrulandı. Astronotu Dinlenme modunda gözlemleyin.',
      },
    ],
  },
];

interface FirstAidCrisisSimulatorProps {
  crewMember: CrewMember;
  sensorControl: CrewSensorControl;
  onCrewSensorChange: (
    crewId: string,
    patch: Partial<CrewSensorControl>
  ) => void;
  guideLanguage: GuideLanguage;
  onScoreEarned?: (points: number) => void;
}

export const FirstAidCrisisSimulator: React.FC<FirstAidCrisisSimulatorProps> = ({
  crewMember,
  sensorControl,
  onCrewSensorChange,
  guideLanguage,
  onScoreEarned,
}) => {
  const isTr = guideLanguage === 'tr';

  const [selectedCrisisId, setSelectedCrisisId] = useState<CrisisId>('hypoxia');
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(12); // 0..100%

  // Gamified Mission State
  const [challengeActive, setChallengeActive] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(25);
  const [score, setScore] = useState(0);
  const [aedPulsesApplied, setAedPulsesApplied] = useState(0);
  const [completedBadge, setCompletedBadge] = useState<string | null>(null);

  const scenario = useMemo(
    () =>
      CRISIS_SCENARIOS.find((s) => s.id === selectedCrisisId) ??
      CRISIS_SCENARIOS[0],
    [selectedCrisisId]
  );

  // Advance animated video timeline smoothly
  useEffect(() => {
    if (!videoPlaying) return;
    const timer = window.setInterval(() => {
      setVideoProgress((prev) => (prev >= 100 ? 0 : prev + 1.5));
    }, 150);
    return () => window.clearInterval(timer);
  }, [videoPlaying]);

  // Active video step based on timeline progress
  const activeStep = useMemo(() => {
    let current = scenario.steps[0];
    for (const st of scenario.steps) {
      if (videoProgress >= st.atPct) current = st;
    }
    return current;
  }, [scenario, videoProgress]);

  // Check if current gamified crisis win condition is satisfied
  const isCrisisStabilized = useMemo(() => {
    if (!challengeActive) return false;
    if (selectedCrisisId === 'hypoxia') {
      return (
        sensorControl.sensorActive &&
        sensorControl.o2FlowRateLpm >= 2.0 &&
        sensorControl.activityLoad === 'resting' &&
        crewMember.spo2 >= 96.0
      );
    }
    if (selectedCrisisId === 'hyperthermia') {
      return (
        sensorControl.sensorActive &&
        sensorControl.coolingLoopPct >= 80 &&
        sensorControl.activityLoad === 'resting' &&
        crewMember.coreTemp <= 37.3
      );
    }
    // cardiac
    return (
      sensorControl.sensorActive &&
      sensorControl.sensorNoiseFilter &&
      sensorControl.o2FlowRateLpm >= 1.8 &&
      sensorControl.activityLoad === 'resting' &&
      aedPulsesApplied >= 2
    );
  }, [
    challengeActive,
    selectedCrisisId,
    sensorControl,
    crewMember.spo2,
    crewMember.coreTemp,
    aedPulsesApplied,
  ]);

  // Countdown timer & win detection for gamified triage
  useEffect(() => {
    if (!challengeActive) return;

    if (isCrisisStabilized) {
      const earned = 100 + timeLeftSec * 10;
      setScore((s) => s + earned);
      setCompletedBadge(
        timeLeftSec >= 15 ? 'RANK S · RAPID TRIAGE' : 'RANK A · STABILIZED'
      );
      setChallengeActive(false);
      onScoreEarned?.(earned);
      return;
    }

    if (timeLeftSec <= 0) {
      setCompletedBadge(
        isTr ? 'SÜRE DOLDU — TEKRAR DENE' : 'TIME EXPIRED — RETRY TRIAGE'
      );
      setChallengeActive(false);
      return;
    }

    const t = window.setTimeout(() => {
      setTimeLeftSec((sec) => sec - 1);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [challengeActive, isCrisisStabilized, timeLeftSec, isTr, onScoreEarned]);

  const startCrisisChallenge = () => {
    setCompletedBadge(null);
    setAedPulsesApplied(0);
    setTimeLeftSec(25);
    setChallengeActive(true);
    setVideoPlaying(true);
    setVideoProgress(5);

    if (selectedCrisisId === 'hypoxia') {
      onCrewSensorChange(crewMember.id, {
        sensorActive: true,
        o2FlowRateLpm: 0.8,
        activityLoad: 'eva-exertion',
      });
    } else if (selectedCrisisId === 'hyperthermia') {
      onCrewSensorChange(crewMember.id, {
        sensorActive: true,
        coolingLoopPct: 20,
        activityLoad: 'eva-exertion',
      });
    } else {
      onCrewSensorChange(crewMember.id, {
        sensorActive: true,
        sensorNoiseFilter: false,
        o2FlowRateLpm: 1.2,
        activityLoad: 'eva-exertion',
      });
    }
  };

  // Color Psychology visual framing based on current physiological severity
  const activeMood: SystemSeverity = challengeActive
    ? crewMember.status === 'nominal'
      ? 'advisory'
      : crewMember.status
    : crewMember.status;

  const moodBorder =
    activeMood === 'emergency'
      ? 'border-[#DC2626]'
      : activeMood === 'advisory'
        ? 'border-[#D97706]'
        : 'border-[#38BDF8]';

  return (
    <HudCard
      title={
        isTr
          ? `İlkyardım Kriz Simülasyon Videoları & Oyunlaştırılmış Triyaj — ${crewMember.name}`
          : `First-Aid Crisis Simulation Videos & Gamified Triage — ${crewMember.name}`
      }
      tier={
        activeMood === 'emergency'
          ? 'emergency'
          : activeMood === 'advisory'
            ? 'warning'
            : 'default'
      }
      rightSlot={
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D1FAE5] border border-[#34D399] text-[#047857] label-caps">
            <Award className="w-3.5 h-3.5" />
            <span>
              {isTr ? 'PUAN' : 'SCORE'}: {score}
            </span>
          </span>
          <StatusChip status={activeMood} />
        </div>
      }
    >
      <div className="space-y-4">
        {/* Crisis Scenario Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {CRISIS_SCENARIOS.map((item) => {
              const active = item.id === selectedCrisisId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedCrisisId(item.id);
                    setVideoProgress(0);
                    setChallengeActive(false);
                    setCompletedBadge(null);
                  }}
                  className={`px-3 py-1.5 rounded-[4px] border text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0369A1]'
                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  {isTr ? item.titleTr : item.titleEn}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={startCrisisChallenge}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] bg-[#DC2626] text-white text-xs font-semibold shadow-sm hover:bg-[#B91C1C] transition-colors whitespace-nowrap"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>
              {challengeActive
                ? isTr
                  ? `KRİZ AKTİF (${timeLeftSec}s)`
                  : `CRISIS ACTIVE (${timeLeftSec}s)`
                : isTr
                  ? 'Kriz Simülasyonu Başlat'
                  : 'Launch Crisis Simulation'}
            </span>
          </button>
        </div>

        {/* Main Video Player + Gamified Intervention Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Animated Video Player Viewport */}
          <div
            className={`lg:col-span-7 rounded-[6px] bg-[#F0F9FF] border ${moodBorder} overflow-hidden flex flex-col`}
          >
            {/* Video Top Overlay Header */}
            <div className="px-3.5 py-2 bg-white border-b border-[#E2E8F0] flex items-center justify-between gap-2">
              <span className="label-caps text-[#0F172A]">
                {isTr ? scenario.badgeTr : scenario.badgeEn} ·{' '}
                {isTr ? activeStep.titleTr : activeStep.titleEn}
              </span>
              <span className="font-mono text-[11px] text-[#475569]">
                {Math.round(videoProgress)}% / 12s
              </span>
            </div>

            {/* Animated Medical Simulation Scene */}
            <div className="relative flex-1 min-h-[210px] flex items-center justify-center p-3 hud-grid-bg">
              <svg
                viewBox="0 0 460 190"
                className="w-full h-[195px]"
                aria-label="Animated First-Aid Simulation Video"
              >
                <defs>
                  <radialGradient id="bioPulseGlow" cx="50%" cy="50%" r="50%">
                    <stop
                      offset="0%"
                      stopColor={
                        selectedCrisisId === 'hyperthermia'
                          ? '#D97706'
                          : selectedCrisisId === 'cardiac'
                            ? '#DC2626'
                            : '#0284C7'
                      }
                      stopOpacity="0.18"
                    />
                    <stop offset="100%" stopColor="#F0F9FF" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="150" cy="95" r="85" fill="url(#bioPulseGlow)" />

                {selectedCrisisId === 'hypoxia' && (
                  <g>
                    {(() => {
                      const inhale =
                        1 + Math.sin((videoProgress / 100) * Math.PI * 6) * 0.09;
                      const lungColor =
                        videoProgress > 65 ? '#059669' : '#DC2626';
                      return (
                        <g
                          transform={`translate(150, 95) scale(${inhale.toFixed(3)})`}
                        >
                          <path
                            d="M -6,-52 L -6,-20 M 6,-52 L 6,-20"
                            stroke="#64748B"
                            strokeWidth="3"
                          />
                          <path
                            d="M -8,-22 C -46,-18 -56,28 -38,48 C -22,58 -8,44 -8,18 Z"
                            fill={`${lungColor}25`}
                            stroke={lungColor}
                            strokeWidth="2.2"
                          />
                          <path
                            d="M 8,-22 C 46,-18 56,28 38,48 C 22,58 8,44 8,18 Z"
                            fill={`${lungColor}25`}
                            stroke={lungColor}
                            strokeWidth="2.2"
                          />
                        </g>
                      );
                    })()}
                    <path
                      d="M 240 40 L 165 40 L 150 55"
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                    {[0, 1, 2].map((dot) => {
                      const offset = ((videoProgress * 2.5 + dot * 33) % 100) / 100;
                      const px = 240 - offset * 85;
                      return (
                        <circle
                          key={dot}
                          cx={px}
                          cy={40}
                          r="3.2"
                          fill="#0284C7"
                        />
                      );
                    })}
                    <text
                      x="252"
                      y="44"
                      fill="#0369A1"
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="JetBrains Mono"
                    >
                      O₂ FEED {sensorControl.o2FlowRateLpm.toFixed(1)} L/m
                    </text>
                    <text
                      x="252"
                      y="78"
                      fill={crewMember.spo2 >= 96 ? '#059669' : '#DC2626'}
                      fontSize="13"
                      fontWeight="700"
                      fontFamily="JetBrains Mono"
                    >
                      SpO₂: {crewMember.spo2.toFixed(1)}%
                    </text>
                    <text
                      x="252"
                      y="102"
                      fill="#475569"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                    >
                      {videoProgress > 60
                        ? 'ALVEOLAR PRESSURE RESTORING'
                        : 'HYPOXIA THRESHOLD ALERT'}
                    </text>
                  </g>
                )}

                {selectedCrisisId === 'hyperthermia' && (
                  <g>
                    <rect
                      x="92"
                      y="28"
                      width="116"
                      height="134"
                      rx="18"
                      fill="#FFFFFF"
                      stroke={
                        crewMember.coreTemp > 37.5 ? '#D97706' : '#0284C7'
                      }
                      strokeWidth="2"
                    />
                    <path
                      d="M 112 50 C 188 50, 188 72, 112 72 C 188 72, 188 94, 112 94 C 188 94, 188 116, 112 116 C 188 116, 188 138, 112 138"
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="3"
                      strokeDasharray="8 6"
                      strokeDashoffset={-videoProgress * 2}
                    />
                    <text
                      x="236"
                      y="56"
                      fill={crewMember.coreTemp > 37.5 ? '#D97706' : '#059669'}
                      fontSize="13"
                      fontWeight="700"
                      fontFamily="JetBrains Mono"
                    >
                      CORE: {crewMember.coreTemp.toFixed(1)}°C
                    </text>
                    <text
                      x="236"
                      y="82"
                      fill="#0369A1"
                      fontSize="11"
                      fontWeight="600"
                      fontFamily="JetBrains Mono"
                    >
                      LCG COOLANT: {sensorControl.coolingLoopPct}%
                    </text>
                    <text
                      x="236"
                      y="108"
                      fill="#475569"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                    >
                      WORKLOAD: {sensorControl.activityLoad.toUpperCase()}
                    </text>
                  </g>
                )}

                {selectedCrisisId === 'cardiac' && (
                  <g>
                    {(() => {
                      const beat =
                        1 +
                        Math.pow(
                          Math.max(
                            0,
                            Math.sin((videoProgress / 100) * Math.PI * 10)
                          ),
                          4
                        ) *
                          0.18;
                      return (
                        <g transform={`translate(145, 92) scale(${beat.toFixed(3)})`}>
                          <circle
                            r="42"
                            fill="rgba(220, 38, 38, 0.12)"
                            stroke="#DC2626"
                            strokeWidth="2"
                          />
                          <path
                            d="M 0,18 L -20,-2 C -28,-12 -18,-26 -6,-18 L 0,-12 L 6,-18 C 18,-26 28,-12 20,-2 Z"
                            fill="#DC2626"
                          />
                        </g>
                      );
                    })()}
                    <text
                      x="232"
                      y="64"
                      fill="#DC2626"
                      fontSize="13"
                      fontWeight="700"
                      fontFamily="JetBrains Mono"
                    >
                      HR: {crewMember.heartRate} BPM
                    </text>
                    <text
                      x="232"
                      y="90"
                      fill={
                        sensorControl.sensorNoiseFilter ? '#059669' : '#D97706'
                      }
                      fontSize="11"
                      fontWeight="600"
                      fontFamily="JetBrains Mono"
                    >
                      KALMAN FILTER:{' '}
                      {sensorControl.sensorNoiseFilter ? 'LOCKED' : 'NOISY RAW'}
                    </text>
                    <text
                      x="232"
                      y="116"
                      fill="#0369A1"
                      fontSize="11"
                      fontWeight="600"
                      fontFamily="JetBrains Mono"
                    >
                      AED ASSIST PULSES: {aedPulsesApplied}/2
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Video Subtitles & Playback Controls */}
            <div className="p-3.5 bg-white border-t border-[#E2E8F0] space-y-3">
              <p className="text-xs text-[#1E293B] leading-relaxed min-h-[34px]">
                {isTr ? activeStep.captionTr : activeStep.captionEn}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setVideoPlaying((p) => !p)}
                  aria-label={videoPlaying ? 'Pause simulation video' : 'Play simulation video'}
                  className="p-1.5 rounded-[4px] bg-[#F4F9FD] border border-[#CBD5E1] text-[#0284C7] hover:border-[#0284C7] transition-colors"
                >
                  {videoPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </button>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(videoProgress)}
                  aria-label="First aid video timeline"
                  onChange={(e) => setVideoProgress(Number(e.target.value))}
                  className="hud-scrubber flex-1"
                />

                <button
                  type="button"
                  onClick={() => {
                    setVideoProgress(0);
                    setVideoPlaying(true);
                  }}
                  aria-label="Replay simulation video"
                  className="p-1.5 rounded-[4px] bg-[#F4F9FD] border border-[#CBD5E1] text-[#475569] hover:text-[#0284C7] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Gamified Crisis Action & Color Psychology Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="hud-trough p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="label-caps text-[#475569]">
                  {isTr ? 'RENK PSİKOLOJİSİ DURUMU' : 'COLOR PSYCHOLOGY STATE'}
                </span>
                <span className="font-mono text-[11px] font-semibold text-[#0284C7]">
                  {isTr
                    ? scenario.psychologyColorNameTr
                    : scenario.psychologyColorNameEn}
                </span>
              </div>
              <p className="text-xs text-[#334155] leading-relaxed">
                {isTr ? scenario.psychologyDescTr : scenario.psychologyDescEn}
              </p>
            </div>

            <div className="hud-trough p-3.5 space-y-2.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="label-caps text-[#0F172A]">
                  {isTr ? 'İLKYARDIM MÜDAHALE GÖREVLERİ' : 'FIRST-AID INTERVENTION TASKS'}
                </span>
                {challengeActive && (
                  <span className="font-mono text-xs font-semibold text-[#DC2626]">
                    {timeLeftSec}s
                  </span>
                )}
              </div>

              {selectedCrisisId === 'hypoxia' && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569]">
                      {isTr ? 'O₂ Akışını ≥ 2.0 L/m yap' : 'Set O₂ Flow ≥ 2.0 L/m'}
                    </span>
                    <span
                      className={
                        sensorControl.o2FlowRateLpm >= 2.0
                          ? 'text-[#059669] font-mono font-semibold'
                          : 'text-[#D97706] font-mono font-semibold'
                      }
                    >
                      {sensorControl.o2FlowRateLpm.toFixed(1)} L/m
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569]">
                      {isTr ? 'Metabolik Yükü Dinlenme yap' : 'Set Workload to Resting'}
                    </span>
                    <span
                      className={
                        sensorControl.activityLoad === 'resting'
                          ? 'text-[#059669] font-mono font-semibold'
                          : 'text-[#D97706] font-mono font-semibold'
                      }
                    >
                      {sensorControl.activityLoad.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569]">
                      {isTr ? 'Hedef SpO₂ ≥ %96.0' : 'Target SpO₂ ≥ 96.0%'}
                    </span>
                    <span
                      className={
                        crewMember.spo2 >= 96.0
                          ? 'text-[#059669] font-mono font-semibold'
                          : 'text-[#DC2626] font-mono font-semibold'
                      }
                    >
                      {crewMember.spo2.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {selectedCrisisId === 'hyperthermia' && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569]">
                      {isTr ? 'Soğutma Döngüsü ≥ %80' : 'Set Coolant Loop ≥ 80%'}
                    </span>
                    <span
                      className={
                        sensorControl.coolingLoopPct >= 80
                          ? 'text-[#059669] font-mono font-semibold'
                          : 'text-[#D97706] font-mono font-semibold'
                      }
                    >
                      {sensorControl.coolingLoopPct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569]">
                      {isTr ? 'Metabolik Yükü Dinlenme yap' : 'Set Workload to Resting'}
                    </span>
                    <span
                      className={
                        sensorControl.activityLoad === 'resting'
                          ? 'text-[#059669] font-mono font-semibold'
                          : 'text-[#D97706] font-mono font-semibold'
                      }
                    >
                      {sensorControl.activityLoad.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569]">
                      {isTr ? 'Çekirdek Isı ≤ 37.3°C' : 'Core Temp ≤ 37.3°C'}
                    </span>
                    <span
                      className={
                        crewMember.coreTemp <= 37.3
                          ? 'text-[#059669] font-mono font-semibold'
                          : 'text-[#D97706] font-mono font-semibold'
                      }
                    >
                      {crewMember.coreTemp.toFixed(1)}°C
                    </span>
                  </div>
                </div>
              )}

              {selectedCrisisId === 'cardiac' && (
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569]">
                      {isTr ? 'Kalman Filtresini Aç' : 'Enable Kalman Filter'}
                    </span>
                    <span
                      className={
                        sensorControl.sensorNoiseFilter
                          ? 'text-[#059669] font-mono font-semibold'
                          : 'text-[#D97706] font-mono font-semibold'
                      }
                    >
                      {sensorControl.sensorNoiseFilter ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569]">
                      {isTr ? 'O₂ ≥ 1.8 L/m & Dinlenme' : 'O₂ ≥ 1.8 L/m & Resting'}
                    </span>
                    <span
                      className={
                        sensorControl.o2FlowRateLpm >= 1.8 &&
                        sensorControl.activityLoad === 'resting'
                          ? 'text-[#059669] font-mono font-semibold'
                          : 'text-[#D97706] font-mono font-semibold'
                      }
                    >
                      {sensorControl.o2FlowRateLpm.toFixed(1)} L/m
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAedPulsesApplied((p) => Math.min(2, p + 1))}
                    className="w-full py-2 px-3 rounded-[4px] bg-[#E0F2FE] border border-[#0284C7] text-[#0369A1] font-semibold flex items-center justify-center gap-2 hover:bg-[#BAE6FD] transition-colors"
                  >
                    <HeartPulse className="w-4 h-4" />
                    <span>
                      {isTr
                        ? `AED / Kompresyon Desteği Uygula (${aedPulsesApplied}/2)`
                        : `Deliver AED / CPR Assist (${aedPulsesApplied}/2)`}
                    </span>
                  </button>
                </div>
              )}

              {completedBadge && (
                <div className="mt-2 p-2.5 rounded-[4px] bg-[#D1FAE5] border border-[#34D399] flex items-center gap-2 text-xs font-mono font-semibold text-[#065F46]">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{completedBadge}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </HudCard>
  );
};
