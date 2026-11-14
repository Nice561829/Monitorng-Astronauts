import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Brain,
  CheckCircle2,
  HeartHandshake,
  MessageSquareHeart,
  Plus,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  Wind,
  X,
} from 'lucide-react';
import {
  CrewMember,
  CrewSensorControl,
  GuideLanguage,
  PsychAiChatMessage,
  PsychAiMood,
  PsychAiPersona,
  PsychAiSuggestedAction,
  PsychAiTrainingConfig,
  PsychAiTrainingRule,
  PsychColorTone,
  ScreenId,
  SystemSeverity,
} from '../types/telemetry';
import {
  computeTrainingScore,
  PRESET_TRAINING_PACKS,
  PSYCH_AI_PERSONAS,
} from '../data/psychAiDefaults';
import { sendPsychChatMessage } from '../services/psychAiClient';

interface PsychAiStudioDrawerProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'chat' | 'train';
  crew: CrewMember[];
  selectedCrewId: string;
  activeScreen: ScreenId;
  condition: SystemSeverity;
  guideLanguage: GuideLanguage;
  trainingConfig: PsychAiTrainingConfig;
  onSaveTraining: (next: PsychAiTrainingConfig) => Promise<void>;
  onApplyCrewCalibration: (
    crewId: string,
    patch: Partial<CrewSensorControl>
  ) => void;
  onNavigateScreen: (screen: ScreenId) => void;
  onAiInteractionReward: (kind: 'chat' | 'train') => void;
}

const MOOD_LABELS: Record<
  PsychAiMood,
  { tr: string; en: string; badgeClass: string }
> = {
  calm: {
    tr: 'Sakin & Dengeli',
    en: 'Calm & Balanced',
    badgeClass: 'bg-[#ECFDF5] text-[#047857] border-[#6EE7B7]',
  },
  focused: {
    tr: 'Yüksek Odak',
    en: 'Deep Focus',
    badgeClass: 'bg-[#E0F2FE] text-[#0369A1] border-[#7DD3FC]',
  },
  vigilant: {
    tr: 'Seçici Dikkat',
    en: 'Vigilant Caution',
    badgeClass: 'bg-[#FFFBEB] text-[#B45309] border-[#FCD34D]',
  },
  stressed: {
    tr: 'Stres Yükü',
    en: 'Elevated Stress',
    badgeClass: 'bg-[#FEF3C7] text-[#B45309] border-[#F59E0B]',
  },
  critical: {
    tr: 'Acil Triyaj',
    en: 'Critical Triage',
    badgeClass: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]',
  },
};

function getColorToneBorder(tone?: PsychColorTone): string {
  if (tone === 'coral') return 'border-l-4 border-l-[#DC2626]';
  if (tone === 'amber') return 'border-l-4 border-l-[#D97706]';
  return 'border-l-4 border-l-[#0284C7]';
}

export const PsychAiStudioDrawer: React.FC<PsychAiStudioDrawerProps> = ({
  open,
  onClose,
  initialTab = 'chat',
  crew,
  selectedCrewId,
  activeScreen,
  condition,
  guideLanguage,
  trainingConfig,
  onSaveTraining,
  onApplyCrewCalibration,
  onNavigateScreen,
  onAiInteractionReward,
}) => {
  const isTr = guideLanguage === 'tr';
  const [activeTab, setActiveTab] = useState<'chat' | 'train'>(initialTab);
  const [messages, setMessages] = useState<PsychAiChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [appliedActionIds, setAppliedActionIds] = useState<string[]>([]);

  // 4-7-8 Tactical Breathing Widget State
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathTick, setBreathTick] = useState(0); // 0..18 (4s inhale, 7s hold, 8s exhale)

  // Training Studio Draft State
  const [draftConfig, setDraftConfig] =
    useState<PsychAiTrainingConfig>(trainingConfig);
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleCategory, setNewRuleCategory] =
    useState<PsychAiTrainingRule['category']>('biometric');
  const [savingTraining, setSavingTraining] = useState(false);
  const [trainingSavedNotice, setTrainingSavedNotice] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setDraftConfig(trainingConfig);
    }
  }, [open, initialTab, trainingConfig]);

  // Initialize welcome message when drawer opens for the first time
  useEffect(() => {
    if (messages.length === 0) {
      const persona = PSYCH_AI_PERSONAS[trainingConfig.persona];
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          mood: condition === 'emergency' ? 'critical' : condition === 'advisory' ? 'vigilant' : 'calm',
          psychColor:
            condition === 'emergency'
              ? 'coral'
              : condition === 'advisory'
                ? 'amber'
                : 'sky-mint',
          content: isTr
            ? `Merhaba, ben **Aura-Psy** (${persona.nameTr}). Canlı biyometrik telemetriyi, renk psikolojisini ve eğitim kurallarını takip ediyorum. Şu an mürettebatın zihinsel yükünü analiz edebilir, nefes rehberliği verebilir veya "AI Eğit" sekmesinden beni yeni kurallarla eğitebilirsin.`
            : `Hello, I am **Aura-Psy** (${persona.nameEn}). I monitor live crew biometrics, cognitive color psychology, and your trained rules. Ask me to assess crew stress, start tactical breathing, or customize my rules in the "Train AI" tab.`,
          coachingTip: isTr
            ? 'İpucu: Aşağıdaki hazır sorulardan birini seçebilir veya doğrudan kendi mesajını yazabilirsin.'
            : 'Tip: Pick a quick prompt below or type any mission psychology question.',
          suggestedAction: { type: 'none' },
        },
      ]);
    }
  }, [messages.length, trainingConfig.persona, condition, isTr]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, sending, breathingOpen]);

  // 4-7-8 Breathing Timer Loop
  useEffect(() => {
    if (!breathingActive) return;
    const id = window.setInterval(() => {
      setBreathTick((t) => (t + 1) % 19);
    }, 1000);
    return () => window.clearInterval(id);
  }, [breathingActive]);

  const breathPhase = useMemo(() => {
    if (breathTick < 4) {
      return {
        label: isTr ? 'NEFES AL (Burundan)' : 'INHALE (Nose)',
        remaining: 4 - breathTick,
        pct: ((breathTick + 1) / 4) * 100,
        color: '#0284C7',
      };
    }
    if (breathTick < 11) {
      return {
        label: isTr ? 'TUT (Sakinleş)' : 'HOLD (Center)',
        remaining: 11 - breathTick,
        pct: ((breathTick - 3) / 7) * 100,
        color: '#4F46E5',
      };
    }
    return {
      label: isTr ? 'YAVAŞÇA VER (Ağızdan)' : 'EXHALE (Slowly)',
      remaining: 19 - breathTick,
      pct: ((breathTick - 10) / 8) * 100,
      color: '#059669',
    };
  }, [breathTick, isTr]);

  const selectedCrew = useMemo(
    () => crew.find((c) => c.id === selectedCrewId) ?? crew[0],
    [crew, selectedCrewId]
  );

  // Live Cognitive Stress Load % calculated from actual crew biometrics
  const cognitiveLoadPct = useMemo(() => {
    const active = crew.filter((c) => c.sensorActive);
    if (active.length === 0) return 68;
    const avgHr = active.reduce((s, c) => s + c.heartRate, 0) / active.length;
    const minSpo2 = Math.min(...active.map((c) => c.spo2));
    const hrStress = Math.max(0, (avgHr - 66) * 1.15);
    const o2Stress = Math.max(0, (98 - minSpo2) * 6.5);
    const condBonus =
      condition === 'emergency' ? 28 : condition === 'advisory' ? 14 : 0;
    return Math.min(99, Math.max(12, Math.round(18 + hrStress + o2Stress + condBonus)));
  }, [crew, condition]);

  if (!open) return null;

  const handleSendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? inputText).trim();
    if (!text || sending) return;

    const userMsg: PsychAiChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textOverride) setInputText('');
    setSending(true);
    setChatError(null);

    try {
      const res = await sendPsychChatMessage({
        message: text,
        history: messages,
        selectedCrewId: selectedCrew.id,
        activeScreen,
      });

      const botMsg: PsychAiChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        mood: res.detectedMood,
        psychColor: res.recommendedPsychColor,
        coachingTip: res.coachingTip,
        suggestedAction: res.suggestedAction,
      };
      setMessages((prev) => [...prev, botMsg]);
      onAiInteractionReward('chat');

      if (
        res.suggestedAction?.type === 'breathing_cue' &&
        trainingConfig.breathingCueAuto
      ) {
        setBreathingOpen(true);
      }
    } catch (err) {
      setChatError(
        err instanceof Error
          ? err.message
          : 'Psikolojik AI ile iletişim kurulurken hata oluştu.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleExecuteSuggestedAction = (
    msgId: string,
    action: PsychAiSuggestedAction
  ) => {
    if (action.type === 'calibrate_crew') {
      const targetId = action.crewId || selectedCrew.id;
      onApplyCrewCalibration(targetId, {
        o2FlowRateLpm: action.o2FlowRateLpm ?? 2.0,
        coolingLoopPct: action.coolingLoopPct ?? 72,
        activityLoad: action.activityLoad ?? 'nominal',
        sensorActive: true,
      });
      setAppliedActionIds((prev) => [...prev, msgId]);
    } else if (action.type === 'breathing_cue') {
      setBreathingOpen(true);
      setBreathTick(0);
      setBreathingActive(true);
      setAppliedActionIds((prev) => [...prev, msgId]);
    } else if (action.type === 'focus_first_aid') {
      onNavigateScreen('crew-eva');
      setAppliedActionIds((prev) => [...prev, msgId]);
      onClose();
    }
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;
    const rule: PsychAiTrainingRule = {
      id: `rule-${Date.now()}`,
      category: newRuleCategory,
      text: newRuleText.trim(),
      enabled: true,
    };
    const updated = {
      ...draftConfig,
      customRules: [rule, ...draftConfig.customRules],
    };
    updated.trainingScore = computeTrainingScore(updated);
    setDraftConfig(updated);
    setNewRuleText('');
  };

  const handleSaveTrainingClick = async () => {
    setSavingTraining(true);
    setTrainingSavedNotice(false);
    try {
      const computed = {
        ...draftConfig,
        trainingScore: computeTrainingScore(draftConfig),
      };
      await onSaveTraining(computed);
      setTrainingSavedNotice(true);
      onAiInteractionReward('train');
      window.setTimeout(() => setTrainingSavedNotice(false), 3000);
    } finally {
      setSavingTraining(false);
    }
  };

  const quickPrompts = isTr
    ? [
        'Mürettebatın mevcut stres ve bilişsel yükünü analiz et.',
        'Ekrandaki renk psikolojisi şu an zihnimi nasıl etkiliyor?',
        'Yüksek nabız veya hipoksi için sakinleştirici sensör öner.',
        '4-7-8 taktik nefes egzersizini başlat.',
      ]
    : [
        'Analyze current crew stress and cognitive workload.',
        'How is the current screen color psychology helping focus?',
        'Recommend calming sensor adjustments for elevated HR.',
        'Start a 4-7-8 tactical breathing exercise.',
      ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="psych-ai-drawer-title"
      className="fixed inset-0 z-50 bg-[#0F172A]/35 backdrop-blur-sm flex justify-end"
    >
      <div className="w-full max-w-2xl h-full bg-[#EDF5FB] border-l border-[#CBD5E1] shadow-2xl flex flex-col">
        {/* Studio Header */}
        <div className="bg-white/95 border-b border-[#CBD5E1] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-gradient-to-br from-[#E0F2FE] to-[#D1FAE5] border border-[#7DD3FC] flex items-center justify-center text-[#0284C7]">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="psych-ai-drawer-title"
                  className="text-base font-semibold text-[#0F172A]"
                >
                  Aura-Psy · {isTr ? 'Psikolojik AI Stüdyosu' : 'Psychological AI Studio'}
                </h2>
                <span className="px-2 py-0.5 rounded-[4px] bg-[#E0F2FE] border border-[#7DD3FC] text-[10px] font-mono font-semibold text-[#0284C7]">
                  {isTr ? 'EĞİTİM' : 'TRAINED'} %{trainingConfig.trainingScore}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#475569] mt-0.5 font-mono">
                <span>
                  {isTr ? 'BİLİŞSEL YÜK' : 'COGNITIVE LOAD'}:{' '}
                  <strong
                    className={
                      cognitiveLoadPct >= 70
                        ? 'text-[#DC2626]'
                        : cognitiveLoadPct >= 45
                          ? 'text-[#D97706]'
                          : 'text-[#059669]'
                    }
                  >
                    {cognitiveLoadPct}%
                  </strong>
                </span>
                <span>·</span>
                <span>
                  {isTr
                    ? PSYCH_AI_PERSONAS[trainingConfig.persona].nameTr
                    : PSYCH_AI_PERSONAS[trainingConfig.persona].nameEn}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Psychological AI Studio"
            className="p-2 rounded-[6px] bg-[#F4F9FD] border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] hover:border-[#94A3B8]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="bg-white/80 border-b border-[#D5E5F2] px-5 py-2.5 flex items-center justify-between gap-3">
          <div className="inline-flex p-1 rounded-[6px] bg-[#F4F9FD] border border-[#CBD5E1]">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] text-xs font-semibold transition-colors ${
                activeTab === 'chat'
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <MessageSquareHeart className="w-3.5 h-3.5" />
              <span>{isTr ? 'Psikolojik Sohbet (Chatbot)' : 'Psychological Chat'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('train')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] text-xs font-semibold transition-colors ${
                activeTab === 'train'
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>
                {isTr
                  ? `AI Eğit & Kalibre Et (${draftConfig.customRules.filter((r) => r.enabled).length} Kural)`
                  : `Train & Calibrate (${draftConfig.customRules.filter((r) => r.enabled).length} Rules)`}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setBreathingOpen((b) => !b)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border text-xs font-semibold transition-colors ${
              breathingOpen
                ? 'bg-[#ECFDF5] border-[#059669] text-[#047857]'
                : 'bg-white border-[#CBD5E1] text-[#334155] hover:border-[#059669] hover:text-[#059669]'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>{isTr ? '4-7-8 Nefes' : '4-7-8 Breath'}</span>
          </button>
        </div>

        {/* Optional Interactive 4-7-8 Tactical Breathing Pacer */}
        {breathingOpen && (
          <div className="mx-5 mt-3 p-3.5 rounded-[8px] bg-gradient-to-r from-[#ECFDF5] via-[#F0F9FF] to-white border border-[#6EE7B7] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-mono text-sm font-bold text-white shadow-sm transition-colors duration-300"
                style={{ backgroundColor: breathPhase.color }}
              >
                {breathingActive ? `${breathPhase.remaining}s` : '4-7-8'}
              </div>
              <div>
                <div
                  className="text-xs font-bold tracking-wide"
                  style={{ color: breathPhase.color }}
                >
                  {breathingActive
                    ? breathPhase.label
                    : isTr
                      ? 'Taktik Vagus Nefes Egzersizi'
                      : 'Tactical Vagus Breathing Pacer'}
                </div>
                <div className="w-48 h-2 rounded-full bg-[#DCEAF6] mt-1.5 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${breathingActive ? breathPhase.pct : 0}%`,
                      backgroundColor: breathPhase.color,
                    }}
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setBreathTick(0);
                setBreathingActive((a) => !a);
              }}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold ${
                breathingActive
                  ? 'bg-white border border-[#CBD5E1] text-[#334155]'
                  : 'bg-[#059669] text-white hover:bg-[#047857]'
              }`}
            >
              {breathingActive
                ? isTr
                  ? 'Durdur'
                  : 'Pause'
                : isTr
                  ? 'Başlat'
                  : 'Start'}
            </button>
          </div>
        )}

        {/* TAB 1: CHATBOT CONVERSATION */}
        {activeTab === 'chat' && (
          <>
            {/* Live Context Strip */}
            <div className="mx-5 mt-3 px-3 py-2 rounded-[6px] bg-white/85 border border-[#D5E5F2] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#334155]">
                <Activity className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>
                  {isTr ? 'Odak Astronot' : 'Focus Crew'}:{' '}
                  <strong className="text-[#0F172A]">{selectedCrew.name}</strong>
                </span>
                <span className="font-mono text-[#475569]">
                  ({selectedCrew.sensorActive ? `${selectedCrew.heartRate} bpm` : 'SENSOR OFF'} ·{' '}
                  {selectedCrew.sensorActive ? `${selectedCrew.spo2.toFixed(1)}% SpO₂` : '--'})
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#0284C7] font-semibold">
                {trainingConfig.customRules.filter((r) => r.enabled).length}{' '}
                {isTr ? 'Eğitim Kuralı Aktif' : 'Trained Rules Active'}
              </span>
            </div>

            {/* Chat Message Stream */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const moodInfo = msg.mood ? MOOD_LABELS[msg.mood] : null;
                const actionApplied = appliedActionIds.includes(msg.id);

                if (isUser) {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[82%] rounded-[10px] rounded-tr-[2px] bg-[#0284C7] text-white px-4 py-3 shadow-sm">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <div className="text-[10px] font-mono opacity-80 text-right mt-1">
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex justify-start">
                    <div
                      className={`max-w-[90%] rounded-[10px] rounded-tl-[2px] bg-white border border-[#CBD5E1] px-4 py-3.5 shadow-sm space-y-2.5 ${getColorToneBorder(msg.psychColor)}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <HeartHandshake className="w-4 h-4 text-[#0284C7]" />
                          <span className="text-xs font-semibold text-[#0F172A]">
                            Aura-Psy
                          </span>
                          {moodInfo && (
                            <span
                              className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-mono font-semibold ${moodInfo.badgeClass}`}
                            >
                              {isTr ? moodInfo.tr : moodInfo.en}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#64748B]">
                          {msg.timestamp}
                        </span>
                      </div>

                      <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>

                      {msg.coachingTip && (
                        <div className="p-2.5 rounded-[6px] bg-[#F4F9FD] border border-[#D5E5F2] text-xs text-[#334155]">
                          <span className="font-semibold text-[#0284C7]">
                            {isTr ? 'Bilişsel Öneri: ' : 'Cognitive Tip: '}
                          </span>
                          {msg.coachingTip}
                        </div>
                      )}

                      {msg.suggestedAction &&
                        msg.suggestedAction.type !== 'none' && (
                          <div className="pt-1">
                            <button
                              type="button"
                              disabled={actionApplied}
                              onClick={() =>
                                handleExecuteSuggestedAction(
                                  msg.id,
                                  msg.suggestedAction!
                                )
                              }
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
                                actionApplied
                                  ? 'bg-[#ECFDF5] border border-[#6EE7B7] text-[#047857]'
                                  : 'bg-[#E0F2FE] border border-[#0284C7] text-[#0369A1] hover:bg-[#BAE6FD]/60'
                              }`}
                            >
                              {actionApplied ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>
                                    {isTr ? 'Uygulandı' : 'Applied'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>
                                    {msg.suggestedAction.label ||
                                      (msg.suggestedAction.type ===
                                      'breathing_cue'
                                        ? isTr
                                          ? '4-7-8 Nefes Rehberini Başlat'
                                          : 'Start 4-7-8 Breathing'
                                        : msg.suggestedAction.type ===
                                            'focus_first_aid'
                                          ? isTr
                                            ? 'İlkyardım Simülasyonuna Git'
                                            : 'Open First-Aid Simulator'
                                          : isTr
                                            ? 'Önerilen Sensör Ayarını Uygula'
                                            : 'Apply Recommended Sensor Fix')}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-[10px] bg-white border border-[#CBD5E1] px-4 py-3 text-xs font-mono text-[#0284C7]">
                    {isTr
                      ? 'Aura-Psy canlı biyometri ve eğitim kurallarını analiz ediyor...'
                      : 'Aura-Psy is analyzing live biometrics and trained rules...'}
                  </div>
                </div>
              )}

              {chatError && (
                <div className="p-3 rounded-[6px] bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#B91C1C]">
                  {chatError}
                </div>
              )}
            </div>

            {/* Quick Prompts + Input Footer */}
            <div className="bg-white/95 border-t border-[#CBD5E1] p-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((qp) => (
                  <button
                    key={qp}
                    type="button"
                    disabled={sending}
                    onClick={() => void handleSendMessage(qp)}
                    className="px-2.5 py-1 rounded-[4px] bg-[#F4F9FD] border border-[#CBD5E1] text-[11px] font-medium text-[#334155] hover:border-[#0284C7] hover:text-[#0284C7] transition-colors text-left"
                  >
                    {qp}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isTr
                      ? 'Aura-Psy ile konuşun (stres, nabız, renk psikolojisi, görev kaygısı)...'
                      : 'Talk to Aura-Psy (stress, heart rate, color psychology, focus)...'
                  }
                  className="flex-1 h-11 px-3.5 rounded-[6px] bg-[#F4F9FD] border border-[#CBD5E1] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#0284C7] focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="h-11 px-4 rounded-[6px] bg-[#0284C7] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#0369A1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>{isTr ? 'Gönder' : 'Send'}</span>
                </button>
              </form>
            </div>
          </>
        )}

        {/* TAB 2: AI TRAINING & CALIBRATION STUDIO */}
        {activeTab === 'train' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* 1. Persona Selection */}
            <div className="bg-white rounded-[8px] border border-[#CBD5E1] p-4 space-y-3">
              <div className="label-caps text-[#0284C7]">
                {isTr
                  ? '1. PSİKOLOJİK AI KİŞİLİK VE UZMANLIK MODU'
                  : '1. PSYCHOLOGICAL AI PERSONA & SPECIALTY'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(Object.keys(PSYCH_AI_PERSONAS) as PsychAiPersona[]).map(
                  (key) => {
                    const p = PSYCH_AI_PERSONAS[key];
                    const active = draftConfig.persona === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          const next = { ...draftConfig, persona: key };
                          next.trainingScore = computeTrainingScore(next);
                          setDraftConfig(next);
                        }}
                        className={`p-3 rounded-[6px] border text-left transition-all ${
                          active
                            ? 'bg-[#E0F2FE] border-[#0284C7] shadow-sm'
                            : 'bg-[#F4F9FD] border-[#D5E5F2] hover:border-[#94A3B8]'
                        }`}
                      >
                        <div className="text-[10px] font-mono font-semibold text-[#0284C7]">
                          {isTr ? p.badgeTr : p.badgeEn}
                        </div>
                        <div className="text-sm font-semibold text-[#0F172A] mt-1">
                          {isTr ? p.nameTr : p.nameEn}
                        </div>
                        <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                          {isTr ? p.descTr : p.descEn}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* 2. Empathy & Behavior Calibration */}
            <div className="bg-white rounded-[8px] border border-[#CBD5E1] p-4 space-y-4">
              <div className="label-caps text-[#0284C7]">
                {isTr
                  ? '2. EMPATİ VE MÜDAHALE KALİBRASYONU'
                  : '2. EMPATHY & INTERVENTION CALIBRATION'}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#0F172A]">
                    {isTr
                      ? 'Empati & Sakinleştirme Tonu'
                      : 'Empathy & Soothing Depth'}
                  </span>
                  <span className="font-mono font-semibold text-[#0284C7]">
                    {draftConfig.empathyLevel} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={draftConfig.empathyLevel}
                  onChange={(e) => {
                    const next = {
                      ...draftConfig,
                      empathyLevel: Number(e.target.value),
                    };
                    next.trainingScore = computeTrainingScore(next);
                    setDraftConfig(next);
                  }}
                  className="w-full hud-scrubber"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    key: 'proactiveSensorHints' as const,
                    labelTr: 'Proaktif Sensör Önerisi',
                    labelEn: 'Proactive Sensor Fixes',
                  },
                  {
                    key: 'colorPsychFeedback' as const,
                    labelTr: 'Renk Psikolojisi Analizi',
                    labelEn: 'Color Psych Feedback',
                  },
                  {
                    key: 'breathingCueAuto' as const,
                    labelTr: 'Otomatik Nefes Rehberi',
                    labelEn: 'Auto Breathing Cue',
                  },
                ].map((item) => {
                  const enabled = draftConfig[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        const next = {
                          ...draftConfig,
                          [item.key]: !enabled,
                        };
                        next.trainingScore = computeTrainingScore(next);
                        setDraftConfig(next);
                      }}
                      className={`p-2.5 rounded-[6px] border text-left text-xs font-medium transition-colors ${
                        enabled
                          ? 'bg-[#ECFDF5] border-[#6EE7B7] text-[#047857]'
                          : 'bg-[#F4F9FD] border-[#CBD5E1] text-[#64748B]'
                      }`}
                    >
                      <div className="font-semibold">
                        {isTr ? item.labelTr : item.labelEn}
                      </div>
                      <div className="text-[10px] font-mono mt-0.5">
                        {enabled ? 'ACTIVE' : 'OFF'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Custom Training Rules (Few-Shot Directives) */}
            <div className="bg-white rounded-[8px] border border-[#CBD5E1] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="label-caps text-[#0284C7]">
                  {isTr
                    ? '3. ÖZEL EĞİTİM KURALLARI (YAPAY ZEKA TALİMATLARI)'
                    : '3. CUSTOM TRAINING RULES (BEHAVIORAL DIRECTIVES)'}
                </div>
                <span className="text-xs font-mono text-[#059669] font-semibold">
                  {isTr ? 'Eğitim Puanı' : 'Training Score'}: %
                  {computeTrainingScore(draftConfig)}
                </span>
              </div>

              {/* Preset Training Packs */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TRAINING_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      const exists = draftConfig.customRules.some(
                        (r) => r.text === pack.rule.text
                      );
                      if (exists) return;
                      const next = {
                        ...draftConfig,
                        customRules: [
                          { ...pack.rule, id: `pack-${Date.now()}` },
                          ...draftConfig.customRules,
                        ],
                      };
                      next.trainingScore = computeTrainingScore(next);
                      setDraftConfig(next);
                    }}
                    className="px-2.5 py-1 rounded-[4px] bg-[#E0F2FE] border border-[#7DD3FC] text-[11px] font-semibold text-[#0369A1] hover:bg-[#BAE6FD]/60"
                  >
                    {isTr ? pack.labelTr : pack.labelEn}
                  </button>
                ))}
              </div>

              {/* Add New Training Rule Form */}
              <form onSubmit={handleAddRule} className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newRuleCategory}
                  onChange={(e) =>
                    setNewRuleCategory(
                      e.target.value as PsychAiTrainingRule['category']
                    )
                  }
                  className="h-10 px-2.5 rounded-[6px] bg-[#F4F9FD] border border-[#CBD5E1] text-xs font-mono text-[#0F172A]"
                >
                  <option value="biometric">BIOMETRIC</option>
                  <option value="color-psych">COLOR-PSYCH</option>
                  <option value="triage">TRIAGE</option>
                  <option value="communication">MORALE</option>
                </select>
                <input
                  type="text"
                  value={newRuleText}
                  onChange={(e) => setNewRuleText(e.target.value)}
                  placeholder={
                    isTr
                      ? 'Yeni eğitim kuralı yaz (örn. "Nabız > 100 olunca sakinleştirici müzik/nefes öner")...'
                      : 'Add a training rule (e.g. "Always suggest calming breathing when HR > 100")...'
                  }
                  className="flex-1 h-10 px-3 rounded-[6px] bg-[#F4F9FD] border border-[#CBD5E1] text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                />
                <button
                  type="submit"
                  className="h-10 px-3.5 rounded-[6px] bg-[#0284C7] text-white text-xs font-semibold inline-flex items-center justify-center gap-1 hover:bg-[#0369A1]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isTr ? 'Ekle' : 'Add'}</span>
                </button>
              </form>

              {/* Rule List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {draftConfig.customRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-2.5 rounded-[6px] border flex items-start justify-between gap-3 ${
                      rule.enabled
                        ? 'bg-[#F4F9FD] border-[#BAE6FD]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-65'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const next = {
                          ...draftConfig,
                          customRules: draftConfig.customRules.map((r) =>
                            r.id === rule.id
                              ? { ...r, enabled: !r.enabled }
                              : r
                          ),
                        };
                        next.trainingScore = computeTrainingScore(next);
                        setDraftConfig(next);
                      }}
                      className="text-left flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded-[3px] bg-white border border-[#CBD5E1] text-[10px] font-mono font-semibold text-[#0284C7] uppercase">
                          {rule.category}
                        </span>
                        <span className="text-[10px] font-mono text-[#475569]">
                          {rule.enabled
                            ? isTr
                              ? 'AKTİF'
                              : 'ENABLED'
                            : isTr
                              ? 'PASİF'
                              : 'PAUSED'}
                        </span>
                      </div>
                      <p className="text-xs text-[#0F172A] mt-1 leading-relaxed">
                        {rule.text}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = {
                          ...draftConfig,
                          customRules: draftConfig.customRules.filter(
                            (r) => r.id !== rule.id
                          ),
                        };
                        next.trainingScore = computeTrainingScore(next);
                        setDraftConfig(next);
                      }}
                      aria-label="Remove rule"
                      className="p-1.5 text-[#64748B] hover:text-[#DC2626]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save & Test Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div>
                {trainingSavedNotice && (
                  <span className="text-xs font-semibold text-[#059669]">
                    ✓{' '}
                    {isTr
                      ? 'Eğitim kuralları sunucuya kaydedildi (+90 XP)!'
                      : 'Training rules saved & active (+90 XP)!'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    void handleSaveTrainingClick().then(() =>
                      setActiveTab('chat')
                    );
                  }}
                  className="px-4 py-2 rounded-[6px] bg-[#E0F2FE] border border-[#0284C7] text-[#0369A1] text-xs font-semibold hover:bg-[#BAE6FD]/60"
                >
                  {isTr ? 'Kaydet ve Sohbette Test Et' : 'Save & Test in Chat'}
                </button>
                <button
                  type="button"
                  disabled={savingTraining}
                  onClick={() => void handleSaveTrainingClick()}
                  className="px-4 py-2 rounded-[6px] bg-[#0284C7] text-white text-xs font-semibold hover:bg-[#0369A1] disabled:opacity-50"
                >
                  {savingTraining
                    ? isTr
                      ? 'Kaydediliyor...'
                      : 'Saving...'
                    : isTr
                      ? 'Eğitimi Kaydet'
                      : 'Save Training'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
