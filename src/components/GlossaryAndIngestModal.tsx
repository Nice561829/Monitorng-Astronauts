import React, { useState } from 'react';
import { BookOpen, Database, X } from 'lucide-react';
import { GuideLanguage } from '../types/telemetry';
import {
  GlossaryEntry,
  TELEMETRY_GLOSSARY,
} from '../data/telemetryGlossary';
import {
  StreamConnectionState,
  TelemetryFrame,
} from '../services/telemetryClient';

interface GlossaryAndIngestModalProps {
  open: boolean;
  onClose: () => void;
  frame: TelemetryFrame | null;
  connectionState: StreamConnectionState;
  framesReceived: number;
  guideLanguage: GuideLanguage;
  onIngestSensorFrame: (
    cabinO2OffsetKpa: number,
    radiationSpikeMsv: number,
    source: string
  ) => Promise<void>;
}

const CATEGORIES: Array<'All' | GlossaryEntry['category']> = [
  'All',
  'Navigation',
  'Life Support',
  'Propulsion & Power',
  'Data & Comms',
];

export const GlossaryAndIngestModal: React.FC<GlossaryAndIngestModalProps> = ({
  open,
  onClose,
  frame,
  connectionState,
  framesReceived,
  guideLanguage,
  onIngestSensorFrame,
}) => {
  const [activeTab, setActiveTab] = useState<'glossary' | 'pipeline'>('glossary');
  const [categoryFilter, setCategoryFilter] =
    useState<'All' | GlossaryEntry['category']>('All');
  const [o2Offset, setO2Offset] = useState(0);
  const [radSpike, setRadSpike] = useState(0);
  const [sensorSource, setSensorSource] = useState('HAB-O2-SENSOR-B2');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const isTr = guideLanguage === 'tr';

  const filteredTerms =
    categoryFilter === 'All'
      ? TELEMETRY_GLOSSARY
      : TELEMETRY_GLOSSARY.filter((item) => item.category === categoryFilter);

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onIngestSensorFrame(o2Offset, radSpike, sensorSource);
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-modal-title"
    >
      <div className="hud-panel-focused w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#0284C7]" />
            <div>
              <h2
                id="glossary-modal-title"
                className="text-base font-semibold text-[#0F172A]"
              >
                {isTr
                  ? 'Telemetri Terminolojisi ve Veri Alım Hattı'
                  : 'Telemetry Terminology & Data Acquisition Pipeline'}
              </h2>
              <p className="text-xs text-[#475569]">
                {isTr
                  ? 'Uçuş terimlerinin anlaşılır açıklamaları ve canlı SSE akış incelemesi'
                  : 'Plain-language explanations of flight terms and live SSE stream inspection'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="p-1.5 rounded-[4px] bg-[#F4F9FD] border border-[#CBD5E1] text-[#475569] hover:text-[#0284C7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-5 py-3 bg-[#F4F9FD] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-[4px] bg-white border border-[#CBD5E1]">
            <button
              type="button"
              onClick={() => setActiveTab('glossary')}
              className={`px-3 py-1.5 rounded-[3px] text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'glossary'
                  ? 'bg-[#E0F2FE] text-[#0284C7]'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              {isTr
                ? `Terminoloji Rehberi (${TELEMETRY_GLOSSARY.length})`
                : `Terminology Guide (${TELEMETRY_GLOSSARY.length})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-[3px] text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'pipeline'
                  ? 'bg-[#E0F2FE] text-[#0284C7]'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              {isTr
                ? `Canlı Veri Alımı (${connectionState.toUpperCase()})`
                : `Live Data Acquisition (${connectionState.toUpperCase()})`}
            </button>
          </div>

          <div className="text-xs font-mono text-[#475569]">
            SSE FRAMES: <span className="text-[#0284C7] font-semibold">{framesReceived}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'glossary' ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-[4px] label-caps border transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7]'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:text-[#0F172A]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTerms.map((item) => (
                  <article
                    key={item.term}
                    className="hud-trough p-4 flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-semibold text-[#0284C7]">
                          {item.term}
                        </span>
                        <span className="text-[11px] font-mono text-[#64748B]">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-[#0F172A] mt-0.5">
                        {isTr ? item.fullNameTr : item.fullName}
                      </div>
                      <p className="text-xs text-[#334155] leading-relaxed mt-2">
                        {isTr ? item.plainExplanationTr : item.plainExplanation}
                      </p>
                      <p className="text-xs text-[#475569] leading-relaxed mt-2">
                        <strong className="text-[#059669] font-semibold">
                          {isTr ? 'Neden önemli: ' : 'Why it matters: '}
                        </strong>
                        {isTr ? item.whyItMattersTr : item.whyItMatters}
                      </p>
                    </div>

                    <div className="pt-2.5 mt-1 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-[#64748B]">
                        {isTr ? 'Birim: ' : 'Unit: '}
                        <span className="text-[#0F172A]">{item.unitOrFormat}</span>
                      </span>
                      <span className="text-[#64748B]">
                        Normal:{' '}
                        <span className="text-[#059669]">{item.normalRange}</span>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-5">
              <div className="hud-trough p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
                  <Database className="w-4 h-4 text-[#0284C7]" />
                  <span>How Telemetry Data Is Acquired</span>
                </div>
                <p className="text-xs text-[#334155] leading-relaxed">
                  1. Initial state loads via{' '}
                  <code className="font-mono text-[#0284C7]">
                    GET /api/telemetry/snapshot
                  </code>
                  . 2. A persistent Server-Sent Events stream at{' '}
                  <code className="font-mono text-[#0284C7]">
                    GET /api/telemetry/stream
                  </code>{' '}
                  pushes validated JSON packets every second. 3. Sensor readings
                  and control changes sent to{' '}
                  <code className="font-mono text-[#0284C7]">
                    POST /api/telemetry/ingest
                  </code>{' '}
                  immediately update the server bus and broadcast to all open HUD
                  screens.
                </p>
              </div>

              <form
                onSubmit={handleIngestSubmit}
                className="hud-trough p-4 space-y-4"
              >
                <div className="label-caps text-[#0284C7]">
                  TEST SENSOR INGESTION (POST /API/TELEMETRY/INGEST)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="sensor-source"
                      className="block label-caps text-[#475569] mb-1"
                    >
                      SENSOR SOURCE ID
                    </label>
                    <input
                      id="sensor-source"
                      type="text"
                      value={sensorSource}
                      onChange={(e) => setSensorSource(e.target.value)}
                      className="w-full h-9 px-2.5 bg-white border border-[#CBD5E1] rounded-[4px] font-mono text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="o2-offset"
                      className="block label-caps text-[#475569] mb-1"
                    >
                      O₂ OFFSET (kPa)
                    </label>
                    <input
                      id="o2-offset"
                      type="number"
                      step="0.1"
                      min="-8"
                      max="4"
                      value={o2Offset}
                      onChange={(e) => setO2Offset(Number(e.target.value))}
                      className="w-full h-9 px-2.5 bg-white border border-[#CBD5E1] rounded-[4px] font-mono text-xs text-[#0284C7] focus:outline-none focus:border-[#0284C7]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rad-spike"
                      className="block label-caps text-[#475569] mb-1"
                    >
                      RADIATION OFFSET (mSv/h)
                    </label>
                    <input
                      id="rad-spike"
                      type="number"
                      step="0.05"
                      min="0"
                      max="10"
                      value={radSpike}
                      onChange={(e) => setRadSpike(Number(e.target.value))}
                      className="w-full h-9 px-2.5 bg-white border border-[#CBD5E1] rounded-[4px] font-mono text-xs text-[#D97706] focus:outline-none focus:border-[#0284C7]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-[#475569]">
                    Last ingested source:{' '}
                    <span className="text-[#0F172A] font-semibold">
                      {frame?.externalSensors.lastIngestedSource ?? 'N/A'}
                    </span>
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-[4px] bg-[#0284C7] text-white text-xs font-semibold hover:bg-[#0369A1] transition-colors"
                  >
                    {submitting ? 'Ingesting...' : 'Ingest Sensor Frame'}
                  </button>
                </div>
              </form>

              <div className="hud-trough p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="label-caps text-[#475569]">
                    LATEST RECEIVED SSE TELEMETRY FRAME (PARSED JSON)
                  </span>
                  <span className="font-mono text-xs text-[#059669] font-semibold">
                    SEQ #{frame?.sequenceId ?? 0}
                  </span>
                </div>
                <pre className="text-[11px] font-mono text-[#0369A1] overflow-x-auto max-h-56 leading-relaxed">
                  {JSON.stringify(
                    frame
                      ? {
                          sequenceId: frame.sequenceId,
                          receivedAtIso: frame.receivedAtIso,
                          metFormatted: frame.metFormatted,
                          rttFormatted: frame.rttFormatted,
                          condition: frame.condition,
                          burnActive: frame.burnActive,
                          externalSensors: frame.externalSensors,
                          latestWaveform:
                            frame.waveforms[frame.waveforms.length - 1],
                        }
                      : { status: 'Waiting for stream frame...' },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
