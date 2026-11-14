import React, { useMemo, useState } from 'react';
import { CheckCircle2, Flag } from 'lucide-react';
import {
  OperatorProfile,
  SystemSeverity,
  TelemetryPacket,
  TerrainCell,
} from '../../types/telemetry';
import { formatKelvinTemp, MISSION_PRESETS } from '../../utils/unitFormatters';
import { EarthLatencyPill, HudCard, StatusChip } from '../HudPrimitives';

interface CommsSurfaceScreenProps {
  rttFormatted: string;
  packets: TelemetryPacket[];
  onDispatchPacket: (
    frameCode: string,
    destination: string,
    sizeKb: number
  ) => void;
  terrain: TerrainCell[];
  condition: SystemSeverity;
  highGainDishEnabled: boolean;
  profile: OperatorProfile;
  scoutLockedSectorId?: string | null;
  onLockLandingSector?: (cell: TerrainCell, score: number) => void;
}

const DSN_STATIONS = [
  {
    id: 'DSN-GOLDSTONE-14',
    location: 'Mojave, USA',
    dish: '70m Cassegrain',
    snrDb: 18.4,
    downlinkMbps: 4.2,
    elevationDeg: 61.2,
  },
  {
    id: 'DSN-MADRID-65',
    location: 'Robledo, Spain',
    dish: '34m Beam Waveguide',
    snrDb: 15.9,
    downlinkMbps: 3.1,
    elevationDeg: 44.8,
  },
  {
    id: 'DSN-CANBERRA-43',
    location: 'Tidbinbilla, Australia',
    dish: '70m Deep Space',
    snrDb: 17.2,
    downlinkMbps: 3.8,
    elevationDeg: 53.5,
  },
];

function iceColorRamp(icePct: number): string {
  // Bright uplifting mineral-to-ice-blue ramp -> warm gold ridge highlight
  const norm = Math.max(0, Math.min(1, (icePct - 4) / 28));
  if (norm < 0.35) {
    return '#CBD5E1';
  }
  if (norm < 0.55) {
    return '#93C5FD';
  }
  if (norm < 0.72) {
    return '#38BDF8';
  }
  if (norm < 0.86) {
    return '#0284C7';
  }
  return '#F59E0B';
}

export const CommsSurfaceScreen: React.FC<CommsSurfaceScreenProps> = ({
  rttFormatted,
  packets,
  onDispatchPacket,
  terrain,
  condition,
  highGainDishEnabled,
  profile,
  scoutLockedSectorId = null,
  onLockLandingSector,
}) => {
  const isTr = profile.guideLanguage === 'tr';
  const [selectedStation, setSelectedStation] = useState(DSN_STATIONS[0].id);
  const [frameCode, setFrameCode] = useState('ORB-TRIM-CMD');
  const [payloadNote, setPayloadNote] = useState('MCC-04 VECTOR SYNC');
  const [selectedCell, setSelectedCell] = useState<TerrainCell>(
    terrain[54] ?? terrain[0]
  );

  const activeStation = useMemo(
    () =>
      DSN_STATIONS.find((s) => s.id === selectedStation) ?? DSN_STATIONS[0],
    [selectedStation]
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!highGainDishEnabled) return;
    const size = Number((42 + payloadNote.length * 1.8).toFixed(1));
    onDispatchPacket(frameCode, selectedStation, size);
    setPayloadNote('');
  };

  const cellHazardStatus: SystemSeverity =
    selectedCell.slopeDeg > 8.5
      ? 'emergency'
      : selectedCell.slopeDeg > 5.0
        ? 'advisory'
        : 'nominal';

  const suitabilityScore = useMemo(() => {
    const slopeScore = Math.max(0, 45 - selectedCell.slopeDeg * 4.2);
    const iceScore = Math.min(40, selectedCell.icePct * 1.45);
    const solarScore = Math.min(15, selectedCell.solarHours * 1.2);
    return Math.min(100, Math.round(slopeScore + iceScore + solarScore));
  }, [selectedCell]);

  const isSectorScoutQualified =
    selectedCell.slopeDeg <= 5.5 && selectedCell.icePct >= 18;

  return (
    <div className="space-y-6">
      {/* Upper Row: DSN Link & Packet Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <HudCard
            title="Deep-Space Network Relay & Optical Carrier"
            tier={!highGainDishEnabled ? 'warning' : 'default'}
            className="flex-1"
            rightSlot={
              <StatusChip
                status={
                  !highGainDishEnabled
                    ? 'advisory'
                    : condition === 'emergency'
                      ? 'advisory'
                      : 'nominal'
                }
                label={highGainDishEnabled ? 'CARRIER LOCK' : 'DISH STANDBY'}
              />
            }
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <EarthLatencyPill
                  rttFormatted={rttFormatted}
                  degraded={!highGainDishEnabled || condition !== 'nominal'}
                />
                <span className="telemetry-sm text-[#475569]">
                  Ka-BAND 32.1 GHz
                </span>
              </div>

              {/* DSN Ground Station Selector */}
              <div className="space-y-2">
                <div className="label-caps text-[#475569]">
                  ACTIVE GROUND COMPLEX
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {DSN_STATIONS.map((st) => {
                    const active = st.id === selectedStation;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStation(st.id)}
                        className={`p-3 rounded-[6px] border text-left transition-colors flex items-center justify-between gap-3 ${
                          active
                            ? 'bg-[#E0F2FE] border-[#0284C7]'
                            : 'bg-[#F4F9FD] border-[#D5E5F2] hover:border-[#94A3B8]'
                        }`}
                      >
                        <div>
                          <div className="font-mono text-xs font-semibold text-[#0F172A]">
                            {st.id}
                          </div>
                          <div className="text-xs text-[#475569] mt-0.5">
                            {st.location} · {st.dish}
                          </div>
                        </div>
                        <div className="text-right font-mono text-xs tabular-nums">
                          <div className="text-[#0284C7] font-semibold">
                            {highGainDishEnabled ? `${st.snrDb} dB` : '0.0 dB'}
                          </div>
                          <div className="text-[#475569]">
                            {highGainDishEnabled
                              ? `${st.downlinkMbps} Mbps`
                              : 'OFFLINE'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Link Telemetry Readouts */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2E8F0]">
                <div className="hud-trough p-2.5">
                  <div className="label-caps text-[#475569]">SNR</div>
                  <div className="telemetry-sm text-[#0284C7] font-semibold mt-1">
                    {highGainDishEnabled ? `${activeStation.snrDb} dB` : '--'}
                  </div>
                </div>
                <div className="hud-trough p-2.5">
                  <div className="label-caps text-[#475569]">RATE</div>
                  <div className="telemetry-sm text-[#0F172A] font-semibold mt-1">
                    {highGainDishEnabled
                      ? `${activeStation.downlinkMbps} Mbps`
                      : '0.0 Mbps'}
                  </div>
                </div>
                <div className="hud-trough p-2.5">
                  <div className="label-caps text-[#475569]">ELEV</div>
                  <div className="telemetry-sm text-[#0F172A] font-semibold mt-1">
                    {activeStation.elevationDeg}°
                  </div>
                </div>
              </div>
            </div>
          </HudCard>
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <HudCard
            title="Telemetry Packet Burst & Uplink Queue"
            className="flex-1"
            rightSlot={
              <span className="label-caps text-[#475569]">
                {packets.length} FRAMES LOGGED
              </span>
            }
          >
            <form
              onSubmit={handleSend}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-4 border-b border-[#E2E8F0]"
            >
              <div className="sm:col-span-4">
                <label
                  htmlFor="frame-code-select"
                  className="block label-caps text-[#475569] mb-1.5"
                >
                  FRAME TYPE
                </label>
                <select
                  id="frame-code-select"
                  value={frameCode}
                  onChange={(e) => setFrameCode(e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] bg-white border border-[#CBD5E1] font-mono text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                >
                  <option value="ORB-TRIM-CMD">ORB-TRIM-CMD</option>
                  <option value="ECLSS-BIO-TELEM">ECLSS-BIO-TELEM</option>
                  <option value="SPEC-MAP-ARCADIA">SPEC-MAP-ARCADIA</option>
                  <option value="EVA-SYNC-FRAME">EVA-SYNC-FRAME</option>
                </select>
              </div>
              <div className="sm:col-span-5">
                <label
                  htmlFor="payload-note-input"
                  className="block label-caps text-[#475569] mb-1.5"
                >
                  PAYLOAD HEADER
                </label>
                <input
                  id="payload-note-input"
                  type="text"
                  value={payloadNote}
                  onChange={(e) => setPayloadNote(e.target.value)}
                  placeholder="COMMAND PAYLOAD..."
                  className="w-full h-10 px-3 rounded-[6px] bg-white border border-[#CBD5E1] font-mono text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7]"
                />
              </div>
              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={!highGainDishEnabled}
                  className={`w-full h-10 px-4 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all ${
                    highGainDishEnabled
                      ? 'bg-[#0284C7] text-white hover:bg-[#0369A1] shadow-sm'
                      : 'bg-[#E2E8F0] text-[#64748B] cursor-not-allowed'
                  }`}
                >
                  Transmit Burst
                </button>
              </div>
            </form>

            {/* Packet Queue Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#CBD5E1]">
                    <th className="py-2 pr-3 label-caps text-[#475569]">ID</th>
                    <th className="py-2 pr-3 label-caps text-[#475569]">
                      FRAME
                    </th>
                    <th className="py-2 pr-3 label-caps text-[#475569]">
                      GROUND LINK
                    </th>
                    <th className="py-2 pr-3 label-caps text-[#475569] text-right">
                      SIZE
                    </th>
                    <th className="py-2 label-caps text-[#475569] text-right">
                      TRANSIT
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {packets.slice(0, 6).map((pkt) => (
                    <tr key={pkt.id} className="hover:bg-[#F0F9FF]">
                      <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-[#0284C7]">
                        {pkt.id}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs text-[#0F172A]">
                        {pkt.frameCode}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs text-[#475569]">
                        {pkt.destination}
                      </td>
                      <td className="py-2.5 pr-3 font-mono tabular-nums text-xs text-[#0F172A] text-right">
                        {pkt.sizeKb.toFixed(1)} KB
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-xs font-semibold">
                        {pkt.status === 'acknowledged' ? (
                          <span className="text-[#059669]">ACK 100%</span>
                        ) : (
                          <span className="text-[#0284C7]">
                            TX {pkt.progressPct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HudCard>
        </div>
      </div>

      {/* Surface Operations Spectrographic Heatmap */}
      <HudCard
        title={
          (MISSION_PRESETS[profile.missionPreset] ?? MISSION_PRESETS['mars-transit'])
            .landingZoneTitle
        }
        rightSlot={
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#475569]">
            <span>4.5% MIN</span>
            <div className="flex items-center gap-0.5">
              {['#CBD5E1', '#93C5FD', '#38BDF8', '#0284C7', '#F59E0B'].map(
                (hex) => (
                  <span
                    key={hex}
                    className="w-4 h-2.5 inline-block rounded-[1px]"
                    style={{ backgroundColor: hex }}
                  />
                )
              )}
            </div>
            <span>32.9% MAX</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <div
              className="grid gap-[2px] p-2 rounded-[6px] bg-[#F0F9FF] border border-[#CBD5E1]"
              style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
            >
              {terrain.map((cell) => {
                const isSelected = cell.sectorId === selectedCell.sectorId;
                const isLockedFlag = cell.sectorId === scoutLockedSectorId;
                return (
                  <button
                    key={cell.sectorId}
                    type="button"
                    onClick={() => setSelectedCell(cell)}
                    onMouseEnter={() => setSelectedCell(cell)}
                    aria-label={`Inspect sector ${cell.sectorId}`}
                    className={`aspect-square rounded-[2px] transition-transform duration-100 focus-visible:outline-2 focus-visible:outline-[#0F172A] ${
                      isLockedFlag
                        ? 'ring-2 ring-[#059669] scale-105 z-20'
                        : isSelected
                          ? 'ring-2 ring-[#0F172A] scale-105 z-10'
                          : 'hover:ring-1 hover:ring-[#0284C7]'
                    }`}
                    style={{ backgroundColor: iceColorRamp(cell.icePct) }}
                  />
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="label-caps text-[#475569]">ACTIVE SECTOR</div>
                <div className="telemetry-md font-semibold text-[#0284C7] mt-0.5">
                  {selectedCell.sectorId}
                </div>
              </div>
              <StatusChip
                status={cellHazardStatus}
                label={
                  cellHazardStatus === 'nominal'
                    ? 'LANDING SAFE'
                    : cellHazardStatus === 'advisory'
                      ? 'SLOPE CAUTION'
                      : 'HIGH SLOPE'
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">ELEVATION</div>
                <div className="telemetry-sm text-[#0F172A] font-semibold mt-1">
                  {selectedCell.elevationM} m
                </div>
              </div>
              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">TERRAIN SLOPE</div>
                <div className="telemetry-sm text-[#0284C7] font-semibold mt-1">
                  {selectedCell.slopeDeg}°
                </div>
              </div>
              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">H2O ICE MASS</div>
                <div className="telemetry-sm text-[#059669] font-semibold mt-1">
                  {selectedCell.icePct}%
                </div>
              </div>
              <div className="hud-trough p-3">
                <div className="label-caps text-[#475569]">SOLAR WINDOW</div>
                <div className="telemetry-sm text-[#0F172A] font-semibold mt-1">
                  {selectedCell.solarHours} h/sol
                </div>
              </div>
            </div>

            <div className="hud-trough p-3 flex items-center justify-between">
              <span className="label-caps text-[#475569]">REGOLITH TEMP</span>
              <span className="telemetry-sm text-[#D97706] font-semibold">
                {
                  formatKelvinTemp(selectedCell.thermalK, profile.tempUnit)
                    .value
                }{' '}
                {
                  formatKelvinTemp(selectedCell.thermalK, profile.tempUnit)
                    .unitLabel
                }
              </span>
            </div>

            {/* Landing Zone Scout Mini-Challenge */}
            <div className="p-3 rounded-[6px] bg-[#F4F9FD] border border-[#D5E5F2] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="label-caps text-[#475569]">
                  {isTr ? 'İNİŞ UYGUNLUK PUANI' : 'LANDING SUITABILITY'}
                </span>
                <span
                  className={`font-mono text-sm font-bold tabular-nums ${
                    isSectorScoutQualified
                      ? 'text-[#059669]'
                      : 'text-[#D97706]'
                  }`}
                >
                  {suitabilityScore}/100
                </span>
              </div>

              <div className="text-[11px] text-[#475569]">
                {isTr
                  ? 'Hedef: Eğim ≤ 5.5° ve H₂O Buzu ≥ %18 olan mavi/altın hücreyi seç ve kilitle.'
                  : 'Goal: Pick a sector with Slope ≤ 5.5° and H₂O Ice ≥ 18% to lock landing beacon.'}
              </div>

              {scoutLockedSectorId === selectedCell.sectorId ? (
                <div className="w-full py-2 px-3 rounded-[6px] bg-[#ECFDF5] border border-[#6EE7B7] text-[#047857] text-xs font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {isTr
                      ? `${selectedCell.sectorId} Kilitlendi (+70 XP)`
                      : `${selectedCell.sectorId} Locked (+70 XP)`}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!isSectorScoutQualified}
                  onClick={() =>
                    onLockLandingSector?.(selectedCell, suitabilityScore)
                  }
                  className={`w-full py-2 px-3 rounded-[6px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isSectorScoutQualified
                      ? 'bg-[#059669] text-white hover:bg-[#047857] shadow-sm'
                      : 'bg-[#E2E8F0] text-[#64748B] cursor-not-allowed'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>
                    {scoutLockedSectorId
                      ? isTr
                        ? `İniş Sektörünü Güncelle (${scoutLockedSectorId})`
                        : `Update Locked Sector (${scoutLockedSectorId})`
                      : isTr
                        ? 'İniş Sektörünü Kilitle (+70 XP)'
                        : 'Lock Landing Sector (+70 XP)'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </HudCard>
    </div>
  );
};
