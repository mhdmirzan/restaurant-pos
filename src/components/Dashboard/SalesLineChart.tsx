'use client';

import { useState, useMemo } from 'react';
import { ChartPoint } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

interface SalesLineChartProps {
  salesChart: {
    week: ChartPoint[];
    month: ChartPoint[];
    year: ChartPoint[];
  };
}

export default function SalesLineChart({ salesChart }: SalesLineChartProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activePoints = useMemo(() => {
    return salesChart[timeframe] || [];
  }, [salesChart, timeframe]);

  // Aggregate stats for the current timeframe
  const totalPeriodSales = useMemo(() => {
    return activePoints.reduce((sum, p) => sum + p.sales, 0);
  }, [activePoints]);

  const totalPeriodBills = useMemo(() => {
    return activePoints.reduce((sum, p) => sum + p.bills, 0);
  }, [activePoints]);

  // Chart dimensions & scale
  const width = 800;
  const height = 220;
  const padLeft = 65;
  const padRight = 25;
  const padTop = 20;
  const padBottom = 35;

  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const maxVal = useMemo(() => {
    const highest = Math.max(...activePoints.map((p) => p.sales), 0);
    return highest > 0 ? highest * 1.15 : 1000;
  }, [activePoints]);

  // Coordinates calculation
  const pointsWithCoords = useMemo(() => {
    if (activePoints.length === 0) return [];
    const count = activePoints.length;
    const step = count > 1 ? chartWidth / (count - 1) : chartWidth / 2;

    return activePoints.map((p, idx) => {
      const x = padLeft + (count > 1 ? idx * step : chartWidth / 2);
      const ratio = p.sales / maxVal;
      const y = padTop + chartHeight - ratio * chartHeight;
      return { ...p, x, y, index: idx };
    });
  }, [activePoints, chartWidth, chartHeight, maxVal, padLeft, padTop]);

  // Smooth bezier curve path
  const { linePath, areaPath } = useMemo(() => {
    if (pointsWithCoords.length === 0) return { linePath: '', areaPath: '' };
    if (pointsWithCoords.length === 1) {
      const p = pointsWithCoords[0];
      return {
        linePath: `M ${padLeft} ${p.y} L ${padLeft + chartWidth} ${p.y}`,
        areaPath: `M ${padLeft} ${p.y} L ${padLeft + chartWidth} ${p.y} L ${padLeft + chartWidth} ${padTop + chartHeight} L ${padLeft} ${padTop + chartHeight} Z`,
      };
    }

    let d = `M ${pointsWithCoords[0].x} ${pointsWithCoords[0].y}`;
    for (let i = 0; i < pointsWithCoords.length - 1; i++) {
      const p0 = pointsWithCoords[i];
      const p1 = pointsWithCoords[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const first = pointsWithCoords[0];
    const last = pointsWithCoords[pointsWithCoords.length - 1];
    const area = `${d} L ${last.x} ${padTop + chartHeight} L ${first.x} ${padTop + chartHeight} Z`;

    return { linePath: d, areaPath: area };
  }, [pointsWithCoords, padLeft, chartWidth, padTop, chartHeight]);

  // Y-axis grid ticks (4 levels)
  const yTicks = [0, 0.33, 0.66, 1].map((ratio) => {
    const val = Math.round(maxVal * ratio);
    const y = padTop + chartHeight - ratio * chartHeight;
    return { val, y };
  });

  const activeHoverPoint = hoveredIndex !== null && pointsWithCoords[hoveredIndex] ? pointsWithCoords[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-2xs mb-7">
      {/* Header and Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              Sales Trends (Time vs Sales)
            </h2>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              {timeframe === 'week' ? 'Last 7 Days' : timeframe === 'month' ? 'Last 30 Days' : 'Last 12 Months'}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-lg font-extrabold text-slate-900 font-mono">
              {formatCurrency(totalPeriodSales)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {totalPeriodBills} completed bills
            </span>
          </div>
        </div>

        {/* Timeframe Buttons: Week, Month, Year */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          {(['week', 'month', 'year'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTimeframe(t);
                setHoveredIndex(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                timeframe === t
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Line Chart Container */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-56 overflow-visible"
        >
          <defs>
            <linearGradient id="salesLineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines and Y-axis labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={width - padRight}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={tick.y + 3}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono font-medium"
              >
                {tick.val >= 1000 ? `Rs. ${(tick.val / 1000).toFixed(0)}k` : `Rs. ${tick.val}`}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          {areaPath && (
            <path d={areaPath} fill="url(#salesLineGradient)" />
          )}

          {/* Stroke Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#334155"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover Crosshair vertical line */}
          {activeHoverPoint && (
            <line
              x1={activeHoverPoint.x}
              y1={padTop}
              x2={activeHoverPoint.x}
              y2={padTop + chartHeight}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Data Points */}
          {pointsWithCoords.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            // Only draw dots for all points if count <= 14, or on hover
            const showDot = pointsWithCoords.length <= 14 || isHovered;

            return (
              <g key={i} className="cursor-pointer">
                {showDot && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 3.5}
                    className="transition-all duration-150"
                    fill={isHovered ? '#1e293b' : '#334155'}
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                  />
                )}
                {/* Hit area for mouse interaction */}
                <rect
                  x={pt.x - (chartWidth / pointsWithCoords.length) / 2}
                  y={padTop}
                  width={chartWidth / pointsWithCoords.length}
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* X-axis labels at the bottom */}
          {pointsWithCoords.map((pt, i) => {
            // Filter labels on month view to prevent overlap
            if (timeframe === 'month' && i % 5 !== 0 && i !== pointsWithCoords.length - 1) {
              return null;
            }

            return (
              <text
                key={i}
                x={pt.x}
                y={padTop + chartHeight + 18}
                textAnchor="middle"
                className={`text-[10px] font-medium transition-colors ${
                  hoveredIndex === i ? 'fill-slate-900 font-bold' : 'fill-slate-400'
                }`}
              >
                {pt.label}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {activeHoverPoint && (
          <div
            className="absolute top-1 z-20 pointer-events-none transform -translate-x-1/2 bg-slate-900 text-white text-xs rounded-xl py-1.5 px-3 shadow-lg border border-slate-700 animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: `${(activeHoverPoint.x / width) * 100}%`,
            }}
          >
            <p className="text-[10px] text-slate-300 font-medium">{activeHoverPoint.label} ({activeHoverPoint.date})</p>
            <p className="font-extrabold text-white font-mono mt-0.5">{formatCurrency(activeHoverPoint.sales)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{activeHoverPoint.bills} bills</p>
          </div>
        )}
      </div>
    </div>
  );
}
