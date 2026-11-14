import type {
  PsychAiChatMessage,
  PsychAiMood,
  PsychAiPersona,
  PsychAiSuggestedAction,
  PsychAiTrainingConfig,
  PsychColorTone,
} from '../types/telemetry';
import { DEFAULT_PSYCH_AI_TRAINING } from '../data/psychAiDefaults';

const TRAINING_STORAGE_KEY = 'aerohud_psych_ai_training_v1';

export function loadSavedPsychTraining(): PsychAiTrainingConfig {
  try {
    const raw = window.localStorage.getItem(TRAINING_STORAGE_KEY);
    if (!raw) return DEFAULT_PSYCH_AI_TRAINING;
    const parsed = JSON.parse(raw) as Partial<PsychAiTrainingConfig>;
    return {
      ...DEFAULT_PSYCH_AI_TRAINING,
      ...parsed,
      customRules: Array.isArray(parsed.customRules)
        ? parsed.customRules
        : DEFAULT_PSYCH_AI_TRAINING.customRules,
    };
  } catch {
    return DEFAULT_PSYCH_AI_TRAINING;
  }
}

export async function fetchServerPsychTraining(): Promise<PsychAiTrainingConfig> {
  const res = await fetch('/api/psych-ai/training');
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as { config: PsychAiTrainingConfig };
  return data.config;
}

export async function savePsychTraining(
  config: PsychAiTrainingConfig
): Promise<PsychAiTrainingConfig> {
  try {
    window.localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore quota errors
  }

  const res = await fetch('/api/psych-ai/training', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    config?: PsychAiTrainingConfig;
    error?: string;
  };
  if (!res.ok || !data.config) {
    throw new Error(data.error || `Training save failed (HTTP ${res.status})`);
  }
  return data.config;
}

export interface PsychChatResponse {
  reply: string;
  detectedMood: PsychAiMood;
  recommendedPsychColor: PsychColorTone;
  coachingTip: string;
  suggestedAction: PsychAiSuggestedAction;
  trainingScore: number;
  persona: PsychAiPersona;
}

export async function sendPsychChatMessage(params: {
  message: string;
  history: PsychAiChatMessage[];
  selectedCrewId: string;
  activeScreen: string;
}): Promise<PsychChatResponse> {
  const res = await fetch('/api/psych-ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: params.message,
      history: params.history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      selectedCrewId: params.selectedCrewId,
      activeScreen: params.activeScreen,
    }),
  });

  const data = (await res.json()) as Partial<PsychChatResponse> & {
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error || `AI chat error (HTTP ${res.status})`);
  }

  return {
    reply: data.reply || '',
    detectedMood: data.detectedMood || 'calm',
    recommendedPsychColor: data.recommendedPsychColor || 'sky-mint',
    coachingTip: data.coachingTip || '',
    suggestedAction: data.suggestedAction || { type: 'none' },
    trainingScore: data.trainingScore ?? 85,
    persona: data.persona ?? 'calm-therapist',
  };
}
