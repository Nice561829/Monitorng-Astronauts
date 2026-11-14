import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { GuideLanguage, TelemetryHealthPoint } from '../types/telemetry';

interface MissionHealthTrendChartProps {
  data: TelemetryHealthPoint[];
  guideLanguage: GuideLanguage;
}

export const MissionHealthTrendChart: React.FC<MissionHealthTrendChartProps> = ({
  data,
  guideLanguage,
}) => {
  const isTr = guideLanguage === 'tr';
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 620;
  const height = 220;
  const margin = { top: 18, right: 20, bottom: 28, left: 42 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const {
    xScale,
    yScale,
    healthLinePath,
    healthAreaPath,
    alertLinePath,
    alertAreaPath,
    yTicks,
    xTickIndices,
  } = useMemo(() => {
    const safeData =
      data.length > 0
        ? data
        : [
            {
              step: 0,
              met: 'T+142:18:04',
              healthScore: 96,
              alertIntensity: 6,
              severity: 'nominal' as const,
              activeAlerts: 0,
            },
          ];

    const x = d3
      .scaleLinear()
      .domain([0, Math.max(1, safeData.length - 1)])
      .range([0, innerW]);

    const y = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

    const hLine = d3
      .line<TelemetryHealthPoint>()
      .x((_d, i) => x(i))
      .y((d) => y(d.healthScore))
      .curve(d3.curveMonotoneX);

    const hArea = d3
      .area<TelemetryHealthPoint>()
      .x((_d, i) => x(i))
      .y0(innerH)
      .y1((d) => y(d.healthScore))
      .curve(d3.curveMonotoneX);

    const aLine = d3
      .line<TelemetryHealthPoint>()
      .x((_d, i) => x(i))
      .y((d) => y(d.alertIntensity))
      .curve(d3.curveMonotoneX);

    const aArea = d3
      .area<TelemetryHealthPoint>()
      .x((_d, i) => x(i))
      .y0(innerH)
      .y1((d) => y(d.alertIntensity))
      .curve(d3.curveMonotoneX);

    const tickCount = Math.min(4, safeData.length);
    const xIndices: number[] = [];
    if (safeData.length === 1) {
      xIndices.push(0);
    } else {
      for (let t = 0; t < tickCount; t++) {
        xIndices.push(
          Math.round((t / Math.max(1, tickCount - 1)) * (safeData.length - 1))
        );
      }
    }

    return {
      xScale: x,
      yScale: y,
      healthLinePath: hLine(safeData) ?? '',
      healthAreaPath: hArea(safeData) ?? '',
      alertLinePath: aLine(safeData) ?? '',
      alertAreaPath: aArea(safeData) ?? '',
      yTicks: y.ticks(4),
      xTickIndices: Array.from(new Set(xIndices)),
    };
  }, [data, innerW, innerH]);

  const activePoint =
    hoverIdx !== null && data[hoverIdx]
      ? data[hoverIdx]
      : data[data.length - 1];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (data.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width - margin.left;
    const clampedX = Math.max(0, Math.min(innerW, svgX));
    const idx = Math.round(xScale.invert(clampedX));
    if (idx >= 0 && idx < data.length) {
      setHoverIdx(idx);
    }
  };

  return (
    <div className="hud-trough p-3.5 flex flex-col justify-between h-full">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <div className="label-caps text-[#0F172A]">
            {isTr
              ? 'SİSTEM SAĞLIĞI VE UYARI PİKLERİ (D3)'
              : 'SYSTEM HEALTH & ALERT PEAKS (D3)'}
          </div>
          {activePoint && (
            <div className="text-[11px] font-mono text-[#475569] mt-0.5 flex flex-wrap items-center gap-2 tabular-nums">
              <span>{activePoint.met}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#0284C7] font-semibold">
                {isTr ? 'Sağlık' : 'Health'} {activePoint.healthScore}%
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-semibold ${
                  activePoint.alertIntensity >= 70
                    ? 'text-[#DC2626]'
                    : activePoint.alertIntensity >= 35
                      ? 'text-[#D97706]'
                      : 'text-[#059669]'
                }`}
              >
                {isTr ? 'Uyarı Piki' : 'Alert Peak'} {activePoint.alertIntensity}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="inline-flex items-center gap-1 text-[#0284C7] font-semibold">
            <span className="w-2.5 h-0.5 bg-[#0284C7] inline-block" />
            {isTr ? 'Sağlık' : 'Health'}
          </span>
          <span className="inline-flex items-center gap-1 text-[#DC2626] font-semibold">
            <span className="w-2.5 h-0.5 bg-[#DC2626] inline-block" />
            {isTr ? 'Uyarı' : 'Alerts'}
          </span>
        </div>
      </div>

      {/* D3 SVG Chart */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[215px] cursor-crosshair bg-white rounded-[6px] border border-[#D5E5F2]"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label="D3 telemetry trend line chart comparing system health versus alert peaks"
      >
        <defs>
          <linearGradient id="d3HealthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="d3AlertGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Nominal Healthy Threshold Band (>= 80%) */}
          <rect
            x={0}
            y={0}
            width={innerW}
            height={yScale(80)}
            fill="#ECFDF5"
            fillOpacity="0.6"
          />

          {/* Y Gridlines & Labels */}
          {yTicks.map((tickVal) => {
            const yPos = yScale(tickVal);
            return (
              <g key={tickVal}>
                <line
                  x1={0}
                  y1={yPos}
                  x2={innerW}
                  y2={yPos}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
                <text
                  x={-8}
                  y={yPos + 3}
                  textAnchor="end"
                  fill="#475569"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                >
                  {tickVal}%
                </text>
              </g>
            );
          })}

          {/* Nominal 80% Threshold Line */}
          <line
            x1={0}
            y1={yScale(80)}
            x2={innerW}
            y2={yScale(80)}
            stroke="#059669"
            strokeOpacity="0.45"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <text
            x={innerW - 4}
            y={yScale(80) - 4}
            textAnchor="end"
            fill="#059669"
            fontSize="9"
            fontWeight="600"
            fontFamily="JetBrains Mono"
          >
            NOMINAL ≥ 80%
          </text>

          {/* Alert Intensity Area & Line */}
          <path d={alertAreaPath} fill="url(#d3AlertGrad)" />
          <path
            d={alertLinePath}
            fill="none"
            stroke="#DC2626"
            strokeWidth="1.9"
            strokeDasharray="4 2"
          />

          {/* System Health Area & Line */}
          <path d={healthAreaPath} fill="url(#d3HealthGrad)" />
          <path
            d={healthLinePath}
            fill="none"
            stroke="#0284C7"
            strokeWidth="2.4"
          />

          {/* Alert Peak Dots */}
          {data.map((pt, i) => {
            if (pt.severity === 'nominal') return null;
            return (
              <circle
                key={`${pt.step}-${i}`}
                cx={xScale(i)}
                cy={yScale(pt.alertIntensity)}
                r="3.8"
                fill={pt.severity === 'emergency' ? '#DC2626' : '#D97706'}
                stroke="#FFFFFF"
                strokeWidth="1.3"
              />
            );
          })}

          {/* Hover Crosshair */}
          {hoverIdx !== null && data[hoverIdx] && (
            <g pointerEvents="none">
              <line
                x1={xScale(hoverIdx)}
                y1={0}
                x2={xScale(hoverIdx)}
                y2={innerH}
                stroke="#0F172A"
                strokeOpacity="0.35"
                strokeDasharray="3 3"
              />
              <circle
                cx={xScale(hoverIdx)}
                cy={yScale(data[hoverIdx].healthScore)}
                r="4.5"
                fill="#0284C7"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <circle
                cx={xScale(hoverIdx)}
                cy={yScale(data[hoverIdx].alertIntensity)}
                r="4.2"
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* X-axis MET labels */}
          {xTickIndices.map((idx) => {
            const pt = data[idx];
            if (!pt) return null;
            return (
              <text
                key={idx}
                x={xScale(idx)}
                y={innerH + 18}
                textAnchor={
                  idx === 0
                    ? 'start'
                    : idx === data.length - 1
                      ? 'end'
                      : 'middle'
                }
                fill="#475569"
                fontSize="9.5"
                fontFamily="JetBrains Mono"
              >
                {pt.met.replace('T+', '')}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
