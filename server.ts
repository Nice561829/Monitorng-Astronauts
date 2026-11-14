import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  applyConditionToCrew,
  formatMet,
  generateArcadiaTerrain,
  generateInitialWaveforms,
  INITIAL_CREW,
  INITIAL_CREW_SENSORS,
  INITIAL_PACKETS,
  INITIAL_SCRUBBERS,
  INITIAL_TOGGLES,
} from './src/data/telemetryEngine.ts';
import {
  computeTrainingScore,
  DEFAULT_PSYCH_AI_TRAINING,
  PSYCH_AI_PERSONAS,
} from './src/data/psychAiDefaults.ts';
import type {
  CrewMember,
  CrewSensorControl,
  OperatorProfile,
  PsychAiTrainingConfig,
  SubsystemToggles,
  SystemScrubbers,
  SystemSeverity,
  TelemetryPacket,
  TerrainCell,
  WaveformSample,
} from './src/types/telemetry.ts';
import {
  DEFAULT_OPERATOR_PROFILE,
  MISSION_PRESETS,
} from './src/utils/unitFormatters.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ServerTelemetryState {
  metDeciseconds: number;
  tick: number;
  condition: SystemSeverity;
  profile: OperatorProfile;
  toggles: SubsystemToggles;
  scrubbers: SystemScrubbers;
  crewSensorControls: Record<string, CrewSensorControl>;
  burnActive: boolean;
  burnCountdownSec: number;
  waveforms: WaveformSample[];
  packets: TelemetryPacket[];
  terrain: TerrainCell[];
  externalSensors: {
    cabinO2OffsetKpa: number;
    radiationSpikeMsv: number;
    lastIngestedSource: string;
    lastIngestedAt: string | null;
  };
  psychAiTraining: PsychAiTrainingConfig;
}

export interface TelemetryStreamFrame {
  sequenceId: number;
  receivedAtIso: string;
  metDeciseconds: number;
  metFormatted: string;
  rttFormatted: string;
  tick: number;
  condition: SystemSeverity;
  profile: OperatorProfile;
  toggles: SubsystemToggles;
  scrubbers: SystemScrubbers;
  crewSensorControls: Record<string, CrewSensorControl>;
  burnActive: boolean;
  burnCountdownSec: number;
  crew: CrewMember[];
  waveforms: WaveformSample[];
  packets: TelemetryPacket[];
  externalSensors: ServerTelemetryState['externalSensors'];
}

const state: ServerTelemetryState = {
  metDeciseconds: 142 * 36000 + 18 * 600 + 42,
  tick: 0,
  condition: 'nominal',
  profile: { ...DEFAULT_OPERATOR_PROFILE },
  toggles: { ...INITIAL_TOGGLES },
  scrubbers: { ...INITIAL_SCRUBBERS },
  crewSensorControls: structuredClone(INITIAL_CREW_SENSORS),
  burnActive: false,
  burnCountdownSec: 522,
  waveforms: generateInitialWaveforms(),
  packets: [...INITIAL_PACKETS],
  terrain: generateArcadiaTerrain(),
  externalSensors: {
    cabinO2OffsetKpa: 0,
    radiationSpikeMsv: 0,
    lastIngestedSource: 'ONBOARD-ECLSS-BUS',
    lastIngestedAt: null,
  },
  psychAiTraining: structuredClone(DEFAULT_PSYCH_AI_TRAINING),
};

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

let sequenceCounter = 1;
const sseClients = new Set<Response>();

function buildTelemetryFrame(): TelemetryStreamFrame {
  const preset = MISSION_PRESETS[state.profile.missionPreset] ?? MISSION_PRESETS['mars-transit'];
  const rttTenths = preset.baseRttTenths + (state.tick % 4);
  const totalSec = Math.floor(rttTenths / 10);
  const tenths = rttTenths % 10;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const rttFormatted = `+00:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenths} RTT`;

  return {
    sequenceId: sequenceCounter++,
    receivedAtIso: new Date().toISOString(),
    metDeciseconds: state.metDeciseconds,
    metFormatted: formatMet(state.metDeciseconds),
    rttFormatted,
    tick: state.tick,
    condition: state.condition,
    profile: state.profile,
    toggles: state.toggles,
    scrubbers: state.scrubbers,
    crewSensorControls: state.crewSensorControls,
    burnActive: state.burnActive,
    burnCountdownSec: state.burnCountdownSec,
    crew: applyConditionToCrew(
      INITIAL_CREW,
      state.condition,
      state.tick,
      state.crewSensorControls,
      state.toggles,
      state.scrubbers
    ),
    waveforms: state.waveforms,
    packets: state.packets,
    externalSensors: state.externalSensors,
  };
}

function broadcastFrame() {
  if (sseClients.size === 0) return;
  const frame = buildTelemetryFrame();
  const payload = `event: telemetry\ndata: ${JSON.stringify(frame)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

// Advance telemetry simulation at 1Hz on the server
setInterval(() => {
  state.metDeciseconds += 10;
  state.tick += 1;

  if (state.burnActive && state.burnCountdownSec > 0) {
    state.burnCountdownSec -= 1;
  }

  const last = state.waveforms[state.waveforms.length - 1];
  const nextTempBase =
    state.condition === 'emergency'
      ? 1234
      : state.condition === 'advisory'
        ? 1185
        : 1142;
  const burnHeat = state.burnActive ? 28 : 0;
  const nextTemp = Number(
    (
      nextTempBase +
      burnHeat +
      Math.sin((state.waveforms.length + state.tick) * 0.5) * 14
    ).toFixed(1)
  );
  const nextTheo = Number(
    Math.max(88, Math.min(97.5, last.theoreticalEffPct - 0.01)).toFixed(2)
  );
  const nextEmp = Number(
    (
      nextTheo -
      (state.condition === 'emergency'
        ? 4.2
        : state.condition === 'advisory'
          ? 2.1
          : 1.0) +
      Math.cos((state.waveforms.length + state.tick) * 0.6) * 0.4
    ).toFixed(2)
  );

  state.waveforms = [
    ...state.waveforms.slice(1),
    {
      tLabel: 'NOW',
      chamberTempK: nextTemp,
      ispEffPct: nextEmp,
      theoreticalEffPct: nextTheo,
      rcsPressureBar: Number(
        (214 + Math.sin(state.tick * 0.4) * 2.5).toFixed(1)
      ),
    },
  ];

  state.packets = state.packets.map((pkt) => {
    if (pkt.status === 'acknowledged') return pkt;
    const nextProg = Math.min(100, pkt.progressPct + 14);
    return {
      ...pkt,
      progressPct: nextProg,
      status: nextProg >= 100 ? 'acknowledged' : 'transmitting',
    };
  });

  broadcastFrame();
}, 1000);

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Initial telemetry snapshot endpoint (REST GET)
  app.get('/api/telemetry/snapshot', (_req: Request, res: Response) => {
    res.json({
      frame: buildTelemetryFrame(),
      terrain: state.terrain,
    });
  });

  // 2. Real-time Server-Sent Events (SSE) downlink stream
  app.get('/api/telemetry/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);
    // Immediately push initial frame upon subscription
    const initialPayload = `event: telemetry\ndata: ${JSON.stringify(
      buildTelemetryFrame()
    )}\n\n`;
    res.write(initialPayload);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // 3. Telemetry & Command Ingestion Endpoint (REST POST)
  app.post('/api/telemetry/ingest', (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const type = body?.type;

    if (type === 'toggle' && typeof body.key === 'string' && typeof body.value === 'boolean') {
      if (body.key in state.toggles) {
        (state.toggles as unknown as Record<string, boolean>)[body.key] = body.value;
      }
    } else if (type === 'scrubber' && typeof body.key === 'string' && typeof body.value === 'number') {
      if (body.key in state.scrubbers && Number.isFinite(body.value)) {
        (state.scrubbers as unknown as Record<string, number>)[body.key] = body.value;
      }
    } else if (
      type === 'condition' &&
      (body.condition === 'nominal' ||
        body.condition === 'advisory' ||
        body.condition === 'emergency')
    ) {
      state.condition = body.condition;
      if (body.condition === 'emergency') {
        state.burnActive = false;
      }
    } else if (type === 'burn' && typeof body.burnActive === 'boolean') {
      state.burnActive = body.burnActive;
    } else if (type === 'profile' && body.profile && typeof body.profile === 'object') {
      const incoming = body.profile as Partial<OperatorProfile>;
      state.profile = {
        ...state.profile,
        ...incoming,
      };
    } else if (
      type === 'crew_sensor' &&
      typeof body.crewId === 'string' &&
      body.patch &&
      typeof body.patch === 'object' &&
      body.crewId in state.crewSensorControls
    ) {
      const patch = body.patch as Partial<CrewSensorControl>;
      state.crewSensorControls[body.crewId] = {
        ...state.crewSensorControls[body.crewId],
        ...patch,
      };
    } else if (type === 'sensor_frame') {
      const o2Offset = Number(body.cabinO2OffsetKpa ?? 0);
      const radSpike = Number(body.radiationSpikeMsv ?? 0);
      state.externalSensors = {
        cabinO2OffsetKpa: Number.isFinite(o2Offset) ? o2Offset : 0,
        radiationSpikeMsv: Number.isFinite(radSpike) ? radSpike : 0,
        lastIngestedSource:
          typeof body.source === 'string' && body.source.trim()
            ? body.source.trim()
            : 'EXTERNAL-SENSOR-API',
        lastIngestedAt: new Date().toISOString(),
      };
    } else {
      res.status(400).json({ error: 'Invalid telemetry ingestion payload' });
      return;
    }

    const updated = buildTelemetryFrame();
    broadcastFrame();
    res.json({ ok: true, frame: updated });
  });

  // 4. Uplink / Downlink Packet Burst Ingestion
  app.post('/api/comms/burst', (req: Request, res: Response) => {
    const body = req.body as {
      frameCode?: string;
      destination?: string;
      sizeKb?: number;
    };
    const frameCode =
      typeof body.frameCode === 'string' && body.frameCode.trim()
        ? body.frameCode.trim()
        : 'CUSTOM-BURST';
    const destination =
      typeof body.destination === 'string' && body.destination.trim()
        ? body.destination.trim()
        : 'DSN-GOLDSTONE-14';
    const sizeKb =
      typeof body.sizeKb === 'number' && Number.isFinite(body.sizeKb)
        ? body.sizeKb
        : 64.0;

    const newPacket: TelemetryPacket = {
      id: `PKT-${9045 + state.packets.length}`,
      timestampMet: formatMet(state.metDeciseconds),
      frameCode,
      destination,
      sizeKb,
      progressPct: 10,
      status: 'transmitting',
    };

    state.packets = [newPacket, ...state.packets];
    broadcastFrame();
    res.json({ ok: true, packet: newPacket });
  });

  // 5. Psychological AI Training Configuration Endpoints
  app.get('/api/psych-ai/training', (_req: Request, res: Response) => {
    res.json({ config: state.psychAiTraining });
  });

  app.post('/api/psych-ai/training', (req: Request, res: Response) => {
    const body = req.body as Partial<PsychAiTrainingConfig>;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Invalid training payload' });
      return;
    }

    const nextConfig: PsychAiTrainingConfig = {
      persona:
        body.persona && body.persona in PSYCH_AI_PERSONAS
          ? body.persona
          : state.psychAiTraining.persona,
      empathyLevel:
        typeof body.empathyLevel === 'number' &&
        body.empathyLevel >= 1 &&
        body.empathyLevel <= 5
          ? Math.round(body.empathyLevel)
          : state.psychAiTraining.empathyLevel,
      proactiveSensorHints:
        typeof body.proactiveSensorHints === 'boolean'
          ? body.proactiveSensorHints
          : state.psychAiTraining.proactiveSensorHints,
      colorPsychFeedback:
        typeof body.colorPsychFeedback === 'boolean'
          ? body.colorPsychFeedback
          : state.psychAiTraining.colorPsychFeedback,
      breathingCueAuto:
        typeof body.breathingCueAuto === 'boolean'
          ? body.breathingCueAuto
          : state.psychAiTraining.breathingCueAuto,
      customRules: Array.isArray(body.customRules)
        ? body.customRules
            .filter(
              (r) =>
                r &&
                typeof r.id === 'string' &&
                typeof r.text === 'string' &&
                r.text.trim().length > 0
            )
            .slice(0, 12)
        : state.psychAiTraining.customRules,
      trainingScore: 0,
      updatedAt: new Date().toISOString(),
    };
    nextConfig.trainingScore = computeTrainingScore(nextConfig);

    state.psychAiTraining = nextConfig;
    res.json({ ok: true, config: state.psychAiTraining });
  });

  // 6. Psychological AI Chatbot Endpoint (Server-Side @google/genai)
  app.post('/api/psych-ai/chat', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'GEMINI_API_KEY bulunamadı. Lütfen Settings > Secrets panelinden Gemini API anahtarınızı kontrol edin.',
      });
      return;
    }

    const body = req.body as {
      message?: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      selectedCrewId?: string;
      activeScreen?: string;
    };

    const userMessage =
      typeof body?.message === 'string' ? body.message.trim() : '';
    if (!userMessage) {
      res.status(400).json({ error: 'Mesaj içeriği boş olamaz.' });
      return;
    }

    const liveFrame = buildTelemetryFrame();
    const cfg = state.psychAiTraining;
    const personaMeta = PSYCH_AI_PERSONAS[cfg.persona];
    const selectedCrew =
      liveFrame.crew.find((c) => c.id === body.selectedCrewId) ??
      liveFrame.crew[0];
    const selectedControls = liveFrame.crewSensorControls[selectedCrew.id];
    const activeRules = cfg.customRules.filter((r) => r.enabled);

    const crewSnapshotText = liveFrame.crew
      .map(
        (m) =>
          `- ${m.name} (${m.callsign}, ${m.role}, id="${m.id}"): status=${m.status}, sensorActive=${m.sensorActive}, HR=${m.heartRate} bpm, SpO2=${m.spo2}%, CoreTemp=${m.coreTemp}C, SuitPressure=${m.suitPressure} kPa, CO2=${m.co2Ppm} ppm`
      )
      .join('\n');

    const rulesBlock =
      activeRules.length > 0
        ? activeRules
            .map((r, i) => `${i + 1}. [${r.category}] ${r.text}`)
            .join('\n')
        : 'No custom rules active; follow aerospace psychological best practices.';

    const systemInstruction = `
You are "Aura-Psy", the trained Aerospace Psychological AI & Cognitive Ergonomics Specialist embedded inside AeroHUD Telemetry.

=== TRAINED PERSONA & CALIBRATION ===
- Active Persona: ${personaMeta.nameEn} (${personaMeta.nameTr})
- Persona Directive: ${personaMeta.directive}
- Empathy Level: ${cfg.empathyLevel}/5 (1=clinical concise, 5=deeply nurturing & supportive)
- Proactive Sensor Suggestions: ${cfg.proactiveSensorHints ? 'ENABLED' : 'DISABLED'}
- Color Psychology Explanation: ${cfg.colorPsychFeedback ? 'ENABLED' : 'DISABLED'}
- Automatic Breathing Guidance: ${cfg.breathingCueAuto ? 'ENABLED' : 'DISABLED'}

=== OPERATOR-TRAINED BEHAVIORAL RULES ===
${rulesBlock}

=== COLOR PSYCHOLOGY ERGONOMICS MODEL IN THIS APP ===
- "sky-mint" (Sky Glacier #EDF5FB + Sky #0284C7 + Mint #059669): Uplifting daylight calm, lowers cortisol, prevents visual fatigue during long deep-space watches.
- "amber" (Vigilant Amber #D97706): Preventive selective attention when a crew member drifts or a sensor drops, avoiding panic.
- "coral" (Urgent Coral Red #DC2626): Tunnel focus for critical life-safety triage (hypoxia, hyperthermia, arrhythmia).

=== LIVE MISSION & BIOMETRIC TELEMETRY ===
- Operator: ${liveFrame.profile.operatorName} (${liveFrame.profile.callsign}), Vessel: ${liveFrame.profile.vesselName}
- Preferred Language: ${liveFrame.profile.guideLanguage === 'tr' ? 'Turkish (respond in natural, clear Turkish unless the user writes exclusively in English)' : 'English (or match the user language if they write in Turkish)'}
- Mission Elapsed Time: ${liveFrame.metFormatted}, Active Screen: ${body.activeScreen || 'flight-deck'}, System Condition: ${liveFrame.condition}
- Selected Crew Focus: ${selectedCrew.name} (id="${selectedCrew.id}", O2 Feed=${selectedControls?.o2FlowRateLpm ?? 1.8} L/min, Cooling Loop=${selectedControls?.coolingLoopPct ?? 65}%, Activity=${selectedControls?.activityLoad ?? 'nominal'}, SensorActive=${selectedControls?.sensorActive ?? true})
- Full Crew Biometrics:
${crewSnapshotText}

=== OUTPUT REQUIREMENTS ===
Respond concisely (under 160 words for reply), empathetically, and grounded in the real live telemetry above.
If appropriate and helpful, populate suggestedAction:
- Use type="calibrate_crew" with crewId (e.g. "${selectedCrew.id}"), o2FlowRateLpm (0.6-3.0), coolingLoopPct (10-100), activityLoad ("resting"|"nominal"|"eva-exertion"), and a short button label if the crew member needs physiological stabilization (or if user asks for sensor adjustment).
- Use type="breathing_cue" if the operator or crew shows high stress/anxiety/elevated HR and would benefit from the 4-7-8 breathing timer.
- Use type="focus_first_aid" if urgent medical triage simulation is needed.
- Otherwise use type="none".
`.trim();

    const historyTurns = Array.isArray(body.history)
      ? body.history
          .slice(-8)
          .filter(
            (h) =>
              h &&
              (h.role === 'user' || h.role === 'assistant') &&
              typeof h.content === 'string' &&
              h.content.trim().length > 0
          )
          .map((h) => ({
            role: h.role === 'assistant' ? ('model' as const) : ('user' as const),
            parts: [{ text: h.content.trim() }],
          }))
      : [];

    const contents = [
      ...historyTurns,
      { role: 'user' as const, parts: [{ text: userMessage }] },
    ];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description:
                  'Main psychological AI response tailored to live crew biometrics and trained rules.',
              },
              detectedMood: {
                type: Type.STRING,
                enum: ['calm', 'focused', 'vigilant', 'stressed', 'critical'],
                description: 'Assessed psychological/cognitive state.',
              },
              recommendedPsychColor: {
                type: Type.STRING,
                enum: ['sky-mint', 'amber', 'coral'],
                description: 'Matching color psychology state.',
              },
              coachingTip: {
                type: Type.STRING,
                description:
                  'One short, practical cognitive or physiological tip.',
              },
              suggestedAction: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: [
                      'none',
                      'calibrate_crew',
                      'breathing_cue',
                      'focus_first_aid',
                    ],
                  },
                  crewId: { type: Type.STRING },
                  label: { type: Type.STRING },
                  o2FlowRateLpm: { type: Type.NUMBER },
                  coolingLoopPct: { type: Type.NUMBER },
                  activityLoad: {
                    type: Type.STRING,
                    enum: ['resting', 'nominal', 'eva-exertion'],
                  },
                },
                required: ['type'],
              },
            },
            required: [
              'reply',
              'detectedMood',
              'recommendedPsychColor',
              'coachingTip',
              'suggestedAction',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      const parsed = JSON.parse(rawText);
      res.json({
        ok: true,
        ...parsed,
        trainingScore: state.psychAiTraining.trainingScore,
        persona: state.psychAiTraining.persona,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
        res.status(403).json({
          error:
            'Gemini API anahtarı geçersiz veya yetkisiz. Lütfen Settings > Secrets panelinden API anahtarını kontrol edin.',
        });
        return;
      }
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({
          error:
            'Gemini API kullanım kotası aşıldı. Kısa bir süre bekleyip tekrar deneyin veya Settings > Secrets üzerinden faturalı anahtar seçin.',
        });
        return;
      }
      res.status(502).json({
        error: `Psikolojik AI yanıtı oluşturulamadı: ${msg}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`AeroHUD Telemetry server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
