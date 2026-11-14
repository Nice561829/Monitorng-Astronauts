import React from 'react';
import {
  Award,
  Brain,
  CheckCircle2,
  Circle,
  Compass,
  Flame,
  Target,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GuideLanguage, ScreenId } from '../types/telemetry';

export interface MissionQuest {
  id: string;
  screen: ScreenId;
  titleEn: string;
  titleTr: string;
  xp: number;
  completed: boolean;
}

interface MissionGamificationBarProps {
  xp: number;
  streak: number;
  quests: MissionQuest[];
  activeScreen: ScreenId;
  unlockedCount: number;
  totalAchievements: number;
  onOpenAchievements: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onNavigateScreen: (screen: ScreenId) => void;
  onOpenPsychAi: (tab?: 'chat' | 'train') => void;
  guideLanguage: GuideLanguage;
  lastRewardBanner: string | null;
}

function getCommanderRank(xp: number, isTr: boolean) {
  if (xp >= 700) {
    return {
      level: 5,
      title: isTr ? 'Galaktik Amiral' : 'Deep-Space Admiral',
      prevAt: 700,
      nextAt: 1000,
    };
  }
  if (xp >= 450) {
    return {
      level: 4,
      title: isTr ? 'Mars Öncüsü' : 'Mars Pioneer',
      prevAt: 450,
      nextAt: 700,
    };
  }
  if (xp >= 250) {
    return {
      level: 3,
      title: isTr ? 'Görev Komutanı' : 'Mission Commander',
      prevAt: 250,
      nextAt: 450,
    };
  }
  if (xp >= 100) {
    return {
      level: 2,
      title: isTr ? 'Uçuş Uzmanı' : 'Flight Specialist',
      prevAt: 100,
      nextAt: 250,
    };
  }
  return {
    level: 1,
    title: isTr ? 'Görev Adayı' : 'Flight Cadet',
    prevAt: 0,
    nextAt: 100,
  };
}

function getScreenObjectiveClue(screen: ScreenId, isTr: boolean): string {
  switch (screen) {
    case 'flight-deck':
      return isTr
        ? 'Aktif Ekran Görevi: RCS Gimbal Lock, Star Tracker ve Thermal Loop B sistemlerini açarak %100 Vektör Kilidi (+50 XP) ve MCC-04 İtki (+75 XP) puanı kazan.'
        : 'Active Screen Objective: Enable RCS Gimbal Lock, Star Tracker & Thermal Loop B to verify 100% Vector Lock (+50 XP) and Engage MCC-04 Burn (+75 XP).';
    case 'crew-eva':
      return isTr
        ? 'Aktif Ekran Görevi: İlkyardım Kriz Simülasyonunu çöz (+150 XP), astronot karakterine egzersiz/diyet yaptır (+100 XP) veya Aura-Psy asistanını eğit (+90 XP).'
        : 'Active Screen Objective: Clear First-Aid Crisis (+150 XP), train the astronaut character & space diet (+100 XP), or coach Aura-Psy (+90 XP).';
    case 'systems-power':
      return isTr
        ? 'Aktif Ekran Görevi: Soğutma akışını ≥ 20 L/m yapıp güç barasını dengede tutarak (+80 XP) S-Sınıfı Mühendislik Rozetini (+60 XP) aç.'
        : 'Active Screen Objective: Set Coolant Flow ≥ 20 L/m with a balanced power bus (+80 XP) and verify S-Rank Engineering Balance (+60 XP).';
    case 'comms-surface':
      return isTr
        ? 'Aktif Ekran Görevi: DSN veri paketi gönder (+75 XP) ve Arcadia haritasında eğimi ≤ 5.5°, buzu ≥ %18 olan güvenli iniş sektörünü kilitle (+70 XP).'
        : 'Active Screen Objective: Transmit a DSN Burst (+75 XP) and lock an Arcadia landing sector with slope ≤ 5.5° & H₂O ice ≥ 18% (+70 XP).';
  }
}

export const MissionGamificationBar: React.FC<MissionGamificationBarProps> = ({
  xp,
  streak,
  quests,
  activeScreen,
  unlockedCount,
  totalAchievements,
  onOpenAchievements,
  soundEnabled,
  onToggleSound,
  onNavigateScreen,
  onOpenPsychAi,
  guideLanguage,
  lastRewardBanner,
}) => {
  const isTr = guideLanguage === 'tr';
  const rank = getCommanderRank(xp, isTr);
  const completedCount = quests.filter((q) => q.completed).length;
  const progressPct = Math.min(100, Math.round((xp / rank.nextAt) * 100));
  const clueText = getScreenObjectiveClue(activeScreen, isTr);

  return (
    <section
      aria-label="Mission Gamification & Quests"
      className="hud-panel p-4 mb-6 bg-gradient-to-r from-white via-[#F0F9FF] to-[#ECFDF5]"
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Clickable Rank / Achievements, XP Progress, Streak & Sound */}
        <div className="flex flex-wrap items-center gap-3.5">
          <button
            type="button"
            onClick={onOpenAchievements}
            title={
              isTr
                ? 'Rütbe ve Başarı Rozetlerini Aç'
                : 'Open Ranks & Achievement Badges'
            }
            className="flex items-center gap-3 text-left group focus-visible:outline-2 focus-visible:outline-[#0284C7] rounded-[6px] p-1 -m-1 hover:bg-[#E0F2FE]/60 transition-colors"
          >
            <div className="w-11 h-11 rounded-[6px] bg-[#E0F2FE] border border-[#7DD3FC] group-hover:border-[#0284C7] flex items-center justify-center text-[#0284C7] shrink-0 transition-colors">
              <Trophy className="w-5 h-5" />
            </div>

            <div className="min-w-[195px]">
              <div className="flex items-center gap-2">
                <span className="label-caps text-[#0284C7]">
                  LVL {rank.level} · {rank.title}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[#D97706] tabular-nums">
                  <Flame className="w-3.5 h-3.5" />
                  {streak}x
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-3">
                <div className="w-36 h-2.5 rounded-full bg-[#DCEAF6] overflow-hidden border border-[#BAE6FD]">
                  <div
                    className="h-full bg-gradient-to-r from-[#0284C7] to-[#10B981] transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="telemetry-sm font-semibold text-[#0F172A] tabular-nums">
                  {xp} / {rank.nextAt} XP
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenAchievements}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-white border border-[#CBD5E1] hover:border-[#0284C7] text-xs font-semibold text-[#0F172A] transition-colors whitespace-nowrap"
          >
            <Award className="w-3.5 h-3.5 text-[#D97706]" />
            <span className="tabular-nums">
              {isTr
                ? `Rozetler (${unlockedCount}/${totalAchievements})`
                : `Badges (${unlockedCount}/${totalAchievements})`}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={
              soundEnabled
                ? isTr
                  ? 'Ses efektlerini kapat'
                  : 'Mute sound effects'
                : isTr
                  ? 'Ses efektlerini aç'
                  : 'Enable sound effects'
            }
            title={
              soundEnabled
                ? isTr
                  ? 'Oyun Ses Efektleri: Açık'
                  : 'Game Sound FX: On'
                : isTr
                  ? 'Oyun Ses Efektleri: Kapalı'
                  : 'Game Sound FX: Muted'
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border text-xs font-medium transition-colors whitespace-nowrap ${
              soundEnabled
                ? 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0284C7]'
                : 'bg-white border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>{isTr ? (soundEnabled ? 'Ses Açık' : 'Ses Kapalı') : soundEnabled ? 'SFX On' : 'SFX Off'}</span>
          </button>

          {lastRewardBanner && (
            <div className="px-3 py-1.5 rounded-[6px] bg-[#D1FAE5] border border-[#34D399] text-[#065F46] text-xs font-semibold">
              {lastRewardBanner}
            </div>
          )}
        </div>

        {/* Right: Interactive Mission Quests + Aura-Psy Button */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-caps text-[#475569] mr-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-[#0284C7]" />
            {isTr
              ? `GÖREVLER (${completedCount}/${quests.length})`
              : `QUESTS (${completedCount}/${quests.length})`}
          </span>

          {quests.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                if (q.id === 'psych-ai-quest') {
                  onOpenPsychAi('train');
                } else {
                  onNavigateScreen(q.screen);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border text-xs font-medium transition-colors whitespace-nowrap ${
                q.completed
                  ? 'bg-[#ECFDF5] border-[#6EE7B7] text-[#047857]'
                  : q.screen === activeScreen
                    ? 'bg-[#F0F9FF] border-[#0284C7] text-[#0369A1]'
                    : 'bg-white border-[#CBD5E1] text-[#334155] hover:border-[#0284C7] hover:text-[#0284C7]'
              }`}
            >
              {q.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
              )}
              <span>{isTr ? q.titleTr : q.titleEn}</span>
              <span className="font-mono text-[10px] opacity-80 tabular-nums">
                +{q.xp}
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => onOpenPsychAi('chat')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#0284C7] text-white text-xs font-semibold hover:bg-[#0369A1] shadow-sm transition-colors whitespace-nowrap"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>{isTr ? 'Psikolojik AI' : 'Psych AI'}</span>
          </button>
        </div>
      </div>

      {/* Active Screen Objective Hint Strip */}
      <div className="mt-3 pt-2.5 border-t border-[#D5E5F2] flex items-center gap-2 text-xs text-[#334155]">
        <Target className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
        <span>{clueText}</span>
      </div>
    </section>
  );
};
