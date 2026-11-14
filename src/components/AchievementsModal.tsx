import React from 'react';
import {
  Award,
  Brain,
  Compass,
  Dumbbell,
  Flame,
  HeartPulse,
  Lock,
  Rocket,
  ShieldCheck,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { GuideLanguage } from '../types/telemetry';

export interface AchievementDef {
  id: string;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  xpBonus: number;
  unlocked: boolean;
  icon: 'rocket' | 'compass' | 'heart' | 'dumbbell' | 'zap' | 'award' | 'brain' | 'flame';
}

interface AchievementsModalProps {
  open: boolean;
  onClose: () => void;
  xp: number;
  streak: number;
  unlockedAchievements: string[];
  completedQuests: string[];
  guideLanguage: GuideLanguage;
}

const RANK_LADDER = [
  { level: 1, minXp: 0, titleTr: 'Görev Adayı', titleEn: 'Flight Cadet' },
  { level: 2, minXp: 100, titleTr: 'Uçuş Uzmanı', titleEn: 'Flight Specialist' },
  { level: 3, minXp: 250, titleTr: 'Görev Komutanı', titleEn: 'Mission Commander' },
  { level: 4, minXp: 450, titleTr: 'Mars Öncüsü', titleEn: 'Mars Pioneer' },
  { level: 5, minXp: 700, titleTr: 'Galaktik Amiral', titleEn: 'Deep-Space Admiral' },
];

function renderIcon(icon: AchievementDef['icon']) {
  switch (icon) {
    case 'rocket':
      return <Rocket className="w-5 h-5" />;
    case 'compass':
      return <Compass className="w-5 h-5" />;
    case 'heart':
      return <HeartPulse className="w-5 h-5" />;
    case 'dumbbell':
      return <Dumbbell className="w-5 h-5" />;
    case 'zap':
      return <Zap className="w-5 h-5" />;
    case 'award':
      return <Award className="w-5 h-5" />;
    case 'brain':
      return <Brain className="w-5 h-5" />;
    case 'flame':
      return <Flame className="w-5 h-5" />;
  }
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  open,
  onClose,
  xp,
  streak,
  unlockedAchievements,
  completedQuests,
  guideLanguage,
}) => {
  if (!open) return null;
  const isTr = guideLanguage === 'tr';

  const achievements: AchievementDef[] = [
    {
      id: 'burn-quest',
      titleTr: 'İlk İtki Ustası',
      titleEn: 'Burn Tactician',
      descTr: 'Flight Deck üzerinde MCC-04 ana motor itkisini ateşle.',
      descEn: 'Engage the MCC-04 main propulsion burn on Flight Deck.',
      xpBonus: 75,
      unlocked: completedQuests.includes('burn-quest'),
      icon: 'rocket',
    },
    {
      id: 'orbital-align',
      titleTr: 'Kusursuz Vektör Kilidi',
      titleEn: 'Perfect Vector Lock',
      descTr: 'Flight Deck üzerinde %100 yörünge hizalamasını doğrula.',
      descEn: 'Verify 100% orbital attitude alignment on Flight Deck.',
      xpBonus: 50,
      unlocked: unlockedAchievements.includes('orbital-align'),
      icon: 'compass',
    },
    {
      id: 'triage-quest',
      titleTr: 'Uzay Cerrahı',
      titleEn: 'Space Trauma Medic',
      descTr: 'Crew & EVA ilkyardım kriz simülasyonunu başarıyla tamamla.',
      descEn: 'Successfully resolve a First-Aid Crisis simulation.',
      xpBonus: 150,
      unlocked: completedQuests.includes('triage-quest'),
      icon: 'heart',
    },
    {
      id: 'wellness-quest',
      titleTr: 'Zero-G Süper Atlet',
      titleEn: 'Zero-G Super Athlete',
      descTr: 'Astronot karakteriyle egzersiz yap ve uzay diyeti uygula.',
      descEn: 'Complete astronaut character workout and nutrition fueling.',
      xpBonus: 100,
      unlocked: completedQuests.includes('wellness-quest'),
      icon: 'dumbbell',
    },
    {
      id: 'systems-s-rank',
      titleTr: 'S-Sınıfı Mühendis',
      titleEn: 'S-Rank Systems Ace',
      descTr: 'Systems & Power ekranında güç ve termal S-Sınıfı dengeyi yakala.',
      descEn: 'Achieve S-Rank power and thermal balance on Systems & Power.',
      xpBonus: 60,
      unlocked: unlockedAchievements.includes('systems-s-rank'),
      icon: 'zap',
    },
    {
      id: 'ice-scout',
      titleTr: 'Arcadia Buz Kaşifi',
      titleEn: 'Arcadia Ice Scout',
      descTr: 'Comms & Surface ısı haritasında güvenli su-buzu iniş sektörü kilitle.',
      descEn: 'Lock a safe ice-rich landing sector on Arcadia heatmap.',
      xpBonus: 70,
      unlocked: unlockedAchievements.includes('ice-scout'),
      icon: 'award',
    },
    {
      id: 'psych-ai-quest',
      titleTr: 'Aura-Psy Eğitmeni',
      titleEn: 'Aura-Psy Trainer',
      descTr: 'Psikolojik AI asistanını eğit veya sohbet danışmanlığı al.',
      descEn: 'Train or consult with the Aura-Psy Psychological AI.',
      xpBonus: 90,
      unlocked: completedQuests.includes('psych-ai-quest'),
      icon: 'brain',
    },
    {
      id: 'mars-pioneer',
      titleTr: 'Mars Öncüsü (450+ XP)',
      titleEn: 'Mars Pioneer (450+ XP)',
      descTr: 'Toplam 450 XP barajını aşarak Seviye 4 komutanlığa yüksel.',
      descEn: 'Reach 450+ total XP to unlock Level 4 Mars Pioneer rank.',
      xpBonus: 100,
      unlocked: xp >= 450,
      icon: 'flame',
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-modal-title"
      className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-3xl bg-white rounded-[8px] border border-[#CBD5E1] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#F0F9FF] via-white to-[#ECFDF5] border-b border-[#CBD5E1] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-[#E0F2FE] border border-[#7DD3FC] flex items-center justify-center text-[#0284C7]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="achievements-modal-title"
                className="text-base font-semibold text-[#0F172A]"
              >
                {isTr
                  ? 'Komutan Rütbeleri & Başarı Rozetleri'
                  : 'Commander Ranks & Mission Achievements'}
              </h2>
              <p className="text-xs font-mono text-[#475569]">
                {xp} XP · {streak}x {isTr ? 'Kombo Serisi' : 'Combo Streak'} ·{' '}
                {unlockedCount}/{achievements.length}{' '}
                {isTr ? 'Rozet Açıldı' : 'Badges Unlocked'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close achievements modal"
            className="p-2 rounded-[6px] bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Rank Ladder */}
          <div>
            <div className="label-caps text-[#475569] mb-2.5">
              {isTr ? 'RÜTBE İLERLEME YOLU' : 'COMMANDER RANK LADDER'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {RANK_LADDER.map((r) => {
                const reached = xp >= r.minXp;
                return (
                  <div
                    key={r.level}
                    className={`p-2.5 rounded-[6px] border text-center transition-colors ${
                      reached
                        ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0F172A]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold text-[#0284C7]">
                      LVL {r.level}
                    </div>
                    <div className="text-xs font-semibold mt-0.5">
                      {isTr ? r.titleTr : r.titleEn}
                    </div>
                    <div className="text-[10px] font-mono mt-0.5 opacity-80">
                      {r.minXp}+ XP
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8 Badges Grid */}
          <div>
            <div className="label-caps text-[#475569] mb-2.5">
              {isTr ? 'GÖREV ROZETLERİ' : 'MISSION BADGES'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-[6px] border flex items-start gap-3 transition-all ${
                    ach.unlocked
                      ? 'bg-[#ECFDF5] border-[#6EE7B7]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-75'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-[6px] border flex items-center justify-center shrink-0 ${
                      ach.unlocked
                        ? 'bg-white border-[#34D399] text-[#059669]'
                        : 'bg-white border-[#CBD5E1] text-[#94A3B8]'
                    }`}
                  >
                    {ach.unlocked ? renderIcon(ach.icon) : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#0F172A]">
                        {isTr ? ach.titleTr : ach.titleEn}
                      </span>
                      <span
                        className={`text-[11px] font-mono font-semibold shrink-0 ${
                          ach.unlocked ? 'text-[#059669]' : 'text-[#64748B]'
                        }`}
                      >
                        {ach.unlocked ? (
                          <span className="inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            +{ach.xpBonus} XP
                          </span>
                        ) : (
                          `+${ach.xpBonus} XP`
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                      {isTr ? ach.descTr : ach.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
