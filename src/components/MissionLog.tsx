import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Search,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  GuideLanguage,
  MissionLogCategory,
  MissionLogEntry,
  TelemetryHealthPoint,
} from '../types/telemetry';
import { HudCard, StatusChip } from './HudPrimitives';
import { MissionHealthTrendChart } from './MissionHealthTrendChart';

interface MissionLogProps {
  entries: MissionLogEntry[];
  healthHistory: TelemetryHealthPoint[];
  onClearLog: () => void;
  guideLanguage: GuideLanguage;
}

type FilterOption = 'all' | MissionLogCategory;

export const MissionLog: React.FC<MissionLogProps> = ({
  entries,
  healthHistory,
  onClearLog,
  guideLanguage,
}) => {
  const isTr = guideLanguage === 'tr';
  const [filter, setFilter] = useState<FilterOption>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    let alert = 0;
    let status = 0;
    let quest = 0;
    for (const entry of entries) {
      if (entry.category === 'alert') alert += 1;
      else if (entry.category === 'status') status += 1;
      else if (entry.category === 'quest') quest += 1;
    }
    return { all: entries.length, alert, status, quest };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (filter !== 'all' && entry.category !== filter) return false;
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.detail.toLowerCase().includes(q) ||
        entry.source.toLowerCase().includes(q) ||
        entry.met.toLowerCase().includes(q)
      );
    });
  }, [entries, filter, query]);

  const hasActiveEmergency = entries
    .slice(0, 5)
    .some((e) => e.category === 'alert' && e.severity === 'emergency');

  return (
    <section id="mission-log-section" aria-label="Mission Log">
      <HudCard
        title={isTr ? 'Mission Log · Görev & Telemetri Günlüğü' : 'Mission Log'}
        tier={hasActiveEmergency ? 'warning' : 'default'}
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-[#475569] tabular-nums">
              {entries.length} {isTr ? 'KAYIT' : 'EVENTS'}
            </span>
            <button
              type="button"
              onClick={onClearLog}
              disabled={entries.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#F4F9FD] border border-[#CBD5E1] text-[11px] font-medium text-[#475569] hover:text-[#DC2626] hover:border-[#FCA5A5] disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>{isTr ? 'Temizle' : 'Clear'}</span>
            </button>
          </div>
        }
      >
        {/* Widescreen Desktop 12-Col Split: Left 5 cols D3 Trend Chart, Right 7 cols Scrollable History */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          <div className="xl:col-span-5">
            <MissionHealthTrendChart
              data={healthHistory}
              guideLanguage={guideLanguage}
            />
          </div>

          <div className="xl:col-span-7 flex flex-col">
            {/* Filter Bar + Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
              <div
                role="tablist"
                aria-label="Mission Log Filters"
                className="inline-flex flex-wrap items-center gap-1 p-1 rounded-[6px] bg-[#F4F9FD] border border-[#D5E5F2]"
              >
                {(
                  [
                    ['all', isTr ? 'Tümü' : 'All', counts.all],
                    [
                      'alert',
                      isTr ? 'Uyarılar' : 'Alerts',
                      counts.alert,
                    ],
                    [
                      'status',
                      isTr ? 'Durum' : 'Status',
                      counts.status,
                    ],
                    [
                      'quest',
                      isTr ? 'Görevler' : 'Quests',
                      counts.quest,
                    ],
                  ] as Array<[FilterOption, string, number]>
                ).map(([key, label, count]) => {
                  const active = filter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFilter(key)}
                      className={`px-2.5 py-1.5 rounded-[4px] text-xs font-medium whitespace-nowrap transition-colors ${
                        active
                          ? 'bg-white text-[#0284C7] shadow-sm font-semibold'
                          : 'text-[#475569] hover:text-[#0F172A]'
                      }`}
                    >
                      {label}{' '}
                      <span className="font-mono text-[11px] opacity-75 tabular-nums">
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full md:w-56">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    isTr
                      ? 'Ara (MET, kaynak...)'
                      : 'Filter log (MET, source...)'
                  }
                  aria-label="Search mission log"
                  className="w-full h-9 pl-8 pr-3 rounded-[6px] bg-[#F4F9FD] border border-[#CBD5E1] text-xs text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#0284C7] focus:bg-white"
                />
              </div>
            </div>

            {/* Scrollable Log Timeline */}
            <div
              className="mt-3 max-h-[245px] overflow-y-auto pr-1 divide-y divide-[#E2E8F0] flex-1"
              tabIndex={0}
              aria-label="Scrollable mission event history"
            >
              {filteredEntries.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#64748B] font-mono">
                  {isTr
                    ? 'Seçili filtre için görev veya telemetri kaydı bulunamadı.'
                    : 'No mission log entries match the current filter.'}
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const isAlert = entry.category === 'alert';
                  const isQuest = entry.category === 'quest';

                  return (
                    <div
                      key={entry.id}
                      className="py-2.5 px-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F4F9FD] rounded-[4px] transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`mt-0.5 w-7 h-7 rounded-[6px] border flex items-center justify-center shrink-0 ${
                            isAlert
                              ? entry.severity === 'emergency'
                                ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#DC2626]'
                                : 'bg-[#FFFBEB] border-[#FCD34D] text-[#D97706]'
                              : isQuest
                                ? 'bg-[#ECFDF5] border-[#6EE7B7] text-[#059669]'
                                : 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0284C7]'
                          }`}
                        >
                          {isAlert ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : isQuest ? (
                            <Trophy className="w-3.5 h-3.5" />
                          ) : (
                            <Activity className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                              {entry.met}
                            </span>
                            <span className="text-[#CBD5E1]" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-[#0284C7]">
                              {entry.source}
                            </span>
                            <span className="text-[#CBD5E1]" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-semibold text-[#0F172A]">
                              {entry.title}
                            </span>
                          </div>
                          <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
                            {entry.detail}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {typeof entry.xpDelta === 'number' &&
                          entry.xpDelta > 0 && (
                            <span className="font-mono text-xs font-semibold text-[#059669] tabular-nums">
                              +{entry.xpDelta} XP
                            </span>
                          )}
                        <StatusChip
                          status={entry.severity}
                          label={
                            entry.category === 'quest'
                              ? isTr
                                ? 'GÖREV TAMAM'
                                : 'QUEST CLEAR'
                              : undefined
                          }
                        />
                        <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
                          {entry.wallTime}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </HudCard>
    </section>
  );
};
