import { useCallback, useEffect, useState } from 'react';
import type {
  CrewMember,
  CrewSensorControl,
  OperatorProfile,
  SubsystemToggles,
  SystemScrubbers,
  SystemSeverity,
  TelemetryPacket,
  TerrainCell,
  WaveformSample,
} from '../types/telemetry';
import { DEFAULT_OPERATOR_PROFILE } from '../utils/unitFormatters';

const PROFILE_STORAGE_KEY = 'aerohud_operator_profile_v1';

export interface TelemetryFrame {
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
  externalSensors: {
    cabinO2OffsetKpa: number;
    radiationSpikeMsv: number;
    lastIngestedSource: string;
    lastIngestedAt: string | null;
  };
}

export type StreamConnectionState = 'connecting' | 'live' | 'reconnecting';

export function loadSavedProfile(): OperatorProfile {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_OPERATOR_PROFILE;
    return { ...DEFAULT_OPERATOR_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_OPERATOR_PROFILE;
  }
}

export function useTelemetryReceiver() {
  const [frame, setFrame] = useState<TelemetryFrame | null>(null);
  const [terrain, setTerrain] = useState<TerrainCell[]>([]);
  const [connectionState, setConnectionState] =
    useState<StreamConnectionState>('connecting');
  const [framesReceived, setFramesReceived] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Initial REST snapshot acquisition + sync saved profile + live SSE subscription
  useEffect(() => {
    let active = true;
    const savedProfile = loadSavedProfile();

    async function fetchSnapshotAndSyncProfile() {
      try {
        const res = await fetch('/api/telemetry/snapshot');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          frame: TelemetryFrame;
          terrain: TerrainCell[];
        };
        if (!active) return;
        setFrame(data.frame);
        setTerrain(data.terrain);
        setErrorMsg(null);

        // Sync persisted operator personalization to the server stream
        await fetch('/api/telemetry/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'profile', profile: savedProfile }),
        });
      } catch (err) {
        if (!active) return;
        setErrorMsg(
          err instanceof Error ? err.message : 'Telemetry snapshot failed'
        );
      }
    }

    fetchSnapshotAndSyncProfile();

    const eventSource = new EventSource('/api/telemetry/stream');

    eventSource.onopen = () => {
      if (!active) return;
      setConnectionState('live');
      setErrorMsg(null);
    };

    eventSource.addEventListener('telemetry', (event: MessageEvent<string>) => {
      if (!active) return;
      try {
        const parsed = JSON.parse(event.data) as TelemetryFrame;
        setFrame(parsed);
        setFramesReceived((count) => count + 1);
        setConnectionState('live');
        setErrorMsg(null);
      } catch {
        setErrorMsg('Malformed telemetry JSON packet received');
      }
    });

    eventSource.onerror = () => {
      if (!active) return;
      setConnectionState('reconnecting');
    };

    return () => {
      active = false;
      eventSource.close();
    };
  }, []);

  const postIngest = useCallback(async (payload: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Ingest HTTP ${res.status}`);
      const json = (await res.json()) as { ok: boolean; frame: TelemetryFrame };
      if (json.frame) {
        setFrame(json.frame);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ingestion failed');
    }
  }, []);

  const ingestProfile = useCallback(
    async (profile: OperatorProfile) => {
      try {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      } catch {
        // Ignore storage quota restrictions
      }
      await postIngest({ type: 'profile', profile });
    },
    [postIngest]
  );

  const ingestToggle = useCallback(
    (key: keyof SubsystemToggles, value: boolean) => {
      return postIngest({ type: 'toggle', key, value });
    },
    [postIngest]
  );

  const ingestScrubber = useCallback(
    (key: keyof SystemScrubbers, value: number) => {
      return postIngest({ type: 'scrubber', key, value });
    },
    [postIngest]
  );

  const ingestCrewSensor = useCallback(
    (crewId: string, patch: Partial<CrewSensorControl>) => {
      return postIngest({ type: 'crew_sensor', crewId, patch });
    },
    [postIngest]
  );

  const ingestCondition = useCallback(
    (condition: SystemSeverity) => {
      return postIngest({ type: 'condition', condition });
    },
    [postIngest]
  );

  const ingestBurnToggle = useCallback(
    (burnActive: boolean) => {
      return postIngest({ type: 'burn', burnActive });
    },
    [postIngest]
  );

  const ingestSensorFrame = useCallback(
    (cabinO2OffsetKpa: number, radiationSpikeMsv: number, source: string) => {
      return postIngest({
        type: 'sensor_frame',
        cabinO2OffsetKpa,
        radiationSpikeMsv,
        source,
      });
    },
    [postIngest]
  );

  const dispatchTelemetryBurst = useCallback(
    async (frameCode: string, destination: string, sizeKb: number) => {
      try {
        const res = await fetch('/api/comms/burst', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frameCode, destination, sizeKb }),
        });
        if (!res.ok) throw new Error(`Burst HTTP ${res.status}`);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Packet burst failed');
      }
    },
    []
  );

  return {
    frame,
    terrain,
    connectionState,
    framesReceived,
    errorMsg,
    ingestProfile,
    ingestToggle,
    ingestScrubber,
    ingestCrewSensor,
    ingestCondition,
    ingestBurnToggle,
    ingestSensorFrame,
    dispatchTelemetryBurst,
  };
}
