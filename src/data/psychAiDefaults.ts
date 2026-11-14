import type {
  PsychAiPersona,
  PsychAiTrainingConfig,
  PsychAiTrainingRule,
} from '../types/telemetry';

export const PSYCH_AI_PERSONAS: Record<
  PsychAiPersona,
  {
    id: PsychAiPersona;
    nameTr: string;
    nameEn: string;
    badgeTr: string;
    badgeEn: string;
    descTr: string;
    descEn: string;
    directive: string;
  }
> = {
  'calm-therapist': {
    id: 'calm-therapist',
    nameTr: 'Şefkatli Uzay Psikoloğu',
    nameEn: 'Compassionate Space Psychologist',
    badgeTr: 'EMPATİK DENGE',
    badgeEn: 'EMPATHETIC CALM',
    descTr:
      'İzolasyon stresi, yüksek nabız ve kaygı anlarında yumuşak, güven verici bir dille bilişsel sakinlik ve nefes desteği sağlar.',
    descEn:
      'Reduces isolation stress, elevated heart rate, and operator anxiety through warm, grounding language and breathing cues.',
    directive:
      'Adopt a calm, warm, emotionally grounding clinical psychologist tone. Validate operator pressure before giving clear, soothing guidance.',
  },
  'triage-coach': {
    id: 'triage-coach',
    nameTr: 'Kriz & Triyaj Koçu',
    nameEn: 'Crisis & Triage Coach',
    badgeTr: 'HIZLI MÜDAHALE',
    badgeEn: 'CRISIS TRIAGE',
    descTr:
      'Acil durumlarda bilişsel aşırı yüklenmeyi önler; kısa, net ve adım adım ilk yardım & sensör düzeltme komutları verir.',
    descEn:
      'Prevents cognitive overload during emergencies with concise, step-by-step triage and sensor correction instructions.',
    directive:
      'Adopt a decisive, structured aerospace flight surgeon & crisis triage coach tone. Keep directives crisp, prioritized, and panic-free.',
  },
  'cognitive-analyst': {
    id: 'cognitive-analyst',
    nameTr: 'Bilişsel Ergonomi Analisti',
    nameEn: 'Cognitive Ergonomics Analyst',
    badgeTr: 'RENK & VERİ BİLİMİ',
    badgeEn: 'COGNITIVE SCIENCE',
    descTr:
      'Ekran renk psikolojisini, dikkat dağılımını ve mürettebat biyometrik eğilimlerini bilimsel gerekçelerle açıklar.',
    descEn:
      'Explains screen color psychology, attentional load, and crew biometric trends using clear human-factors science.',
    directive:
      'Adopt an insightful human-factors and cognitive ergonomics scientist tone. Connect live biometrics directly to color psychology and attention.',
  },
};

export const DEFAULT_PSYCH_AI_RULES: PsychAiTrainingRule[] = [
  {
    id: 'rule-hr-calm',
    category: 'biometric',
    enabled: true,
    text: 'Mürettebat nabzı 105 bpm üzerine çıktığında veya SpO₂ %94 altına indiğinde önce panik önleyici kısa bir nefes telkini ver, ardından O₂/soğutma sensörünü öner.',
  },
  {
    id: 'rule-color-psych',
    category: 'color-psych',
    enabled: true,
    text: 'Cevaplarında ekranın mevcut renk psikolojisi durumunun (Gökyüzü-Nane Sakinliği, Kehribar Seçici Dikkat, Mercan Kırmızı Acil Odak) zihinsel etkisini kısaca açıkla.',
  },
  {
    id: 'rule-triage-steps',
    category: 'triage',
    enabled: true,
    text: 'İlk yardım veya hipoksi/hipertermi krizlerinde önerileri en fazla 3 net, numaralı adıma böl ki operatörün bilişsel yükü artmasın.',
  },
  {
    id: 'rule-isolation-morale',
    category: 'communication',
    enabled: true,
    text: 'Uzun derin uzay görevlerinde izolasyon yorgunluğunu azaltmak için mürettebata kısa moral ve başarı odaklı geri bildirim ekle.',
  },
];

export const PRESET_TRAINING_PACKS: Array<{
  id: string;
  labelTr: string;
  labelEn: string;
  rule: Omit<PsychAiTrainingRule, 'id'>;
}> = [
  {
    id: 'pack-478',
    labelTr: '+ 4-7-8 Nefes Protokolü',
    labelEn: '+ 4-7-8 Breathing Protocol',
    rule: {
      category: 'biometric',
      enabled: true,
      text: 'Operatör stres veya yüksek nabız bildirdiğinde mutlaka 4-7-8 taktik nefes egzersizini başlatmayı öner ve fizyolojik faydasını (vagus siniri sakinleşmesi) belirt.',
    },
  },
  {
    id: 'pack-sleep',
    labelTr: '+ Sirkadiyen & İzolasyon Desteği',
    labelEn: '+ Circadian & Isolation Support',
    rule: {
      category: 'communication',
      enabled: true,
      text: 'EVA görevleri sonrası dinlenme moduna geçişi teşvik et ve gökyüzü-nane aydınlık ekran tonunun sirkadiyen ritmi nasıl koruduğunu vurgula.',
    },
  },
  {
    id: 'pack-sensor',
    labelTr: '+ Proaktif Sensör Kalibrasyonu',
    labelEn: '+ Proactive Sensor Calibration',
    rule: {
      category: 'triage',
      enabled: true,
      text: 'Herhangi bir astronotun sensörü kapalıysa veya gürültü filtresi devre dışıysa ilk cümlede sensör hattını doğrulamayı hatırlat.',
    },
  },
];

export const DEFAULT_PSYCH_AI_TRAINING: PsychAiTrainingConfig = {
  persona: 'calm-therapist',
  empathyLevel: 4,
  proactiveSensorHints: true,
  colorPsychFeedback: true,
  breathingCueAuto: true,
  customRules: DEFAULT_PSYCH_AI_RULES,
  trainingScore: 88,
  updatedAt: null,
};

export function computeTrainingScore(config: PsychAiTrainingConfig): number {
  const activeRules = config.customRules.filter((r) => r.enabled).length;
  const togglesCount =
    (config.proactiveSensorHints ? 1 : 0) +
    (config.colorPsychFeedback ? 1 : 0) +
    (config.breathingCueAuto ? 1 : 0);
  const raw = 52 + Math.min(28, activeRules * 7) + togglesCount * 5 + config.empathyLevel;
  return Math.min(100, Math.max(40, raw));
}
