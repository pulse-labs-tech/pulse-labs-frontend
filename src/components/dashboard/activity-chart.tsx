"use client";

import { useState, useRef } from "react";
import { Select } from "../ui/select";
import { LineIcon } from "@/components/shared/line-icon";

// Mock datasets defined in design contract specification
interface ChartDataset {
  labels: string[];
  compile: number[];
  query: number[];
}

const CHART_DATA: Record<string, ChartDataset> = {
  "7d": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    compile: [2, 4, 1, 5, 3, 2, 4],
    query: [1, 2, 3, 1, 4, 2, 3],
  },
  "30d": {
    labels: Array.from({ length: 10 }, (_, i) => `Apr ${i * 3 + 1}`),
    compile: [3, 5, 2, 8, 4, 6, 3, 7, 5, 4],
    query: [2, 3, 4, 2, 5, 3, 4, 2, 6, 3],
  },
  "1Q": {
    labels: ["Jan W1", "Jan W2", "Jan W3", "Jan W4", "Feb W1", "Feb W2", "Feb W3", "Feb W4", "Mar W1", "Mar W2", "Mar W3", "Mar W4"],
    compile: [4, 6, 3, 8, 5, 7, 4, 9, 6, 8, 5, 10],
    query: [2, 4, 3, 5, 4, 6, 3, 7, 5, 6, 4, 8],
  },
  "3Q": {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    compile: [12, 18, 15, 22, 19, 24, 20, 28, 25],
    query: [8, 12, 10, 15, 13, 17, 14, 19, 18],
  },
  "1Y": {
    labels: ["Apr'25", "Jun", "Aug", "Oct", "Dec", "Feb'26", "Apr'26"],
    compile: [5, 12, 18, 25, 30, 38, 42],
    query: [3, 7, 11, 14, 18, 16, 18],
  },
  "5Y": {
    labels: ["2022", "2023", "2024", "2025", "2026"],
    compile: [0, 0, 5, 28, 42],
    query: [0, 0, 3, 15, 18],
  },
  "all": {
    labels: ["2022", "2023", "2024", "2025", "Apr '26"],
    compile: [0, 0, 5, 28, 42],
    query: [0, 0, 3, 15, 18],
  },
};

export function ActivityChart() {
  const [period, setPeriod] = useState<string>("7d");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [showCompile, setShowCompile] = useState<boolean>(true);
  const [showQuery, setShowQuery] = useState<boolean>(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const dataset = CHART_DATA[period] || CHART_DATA["7d"];
  const { labels, compile, query } = dataset;

  // Chart configuration constants
  const width = 800;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const activeWidth = width - paddingLeft - paddingRight;
  const activeHeight = height - paddingTop - paddingBottom;

  const n = labels.length;
  const stepX = activeWidth / (n - 1 || 1);

  // Compute values based on toggles
  const visibleCompile = compile.map((val) => (showCompile ? val : 0));
  const visibleQuery = query.map((val) => (showQuery ? val : 0));

  // Find max value in dataset to scale Y axis dynamically
  let maxVal = 1;
  if (chartType === "bar") {
    // Stacked height max
    const maxStacked = Math.max(
      ...compile.map((_, i) => visibleCompile[i] + visibleQuery[i]),
      1
    );
    maxVal = maxStacked;
  } else {
    // Overlaid max
    maxVal = Math.max(...visibleCompile, ...visibleQuery, 1);
  }

  // Round max values for clean grid lines
  if (maxVal <= 5) maxVal = 5;
  else if (maxVal <= 10) maxVal = 10;
  else if (maxVal <= 20) maxVal = 20;
  else if (maxVal <= 50) maxVal = 50;
  else maxVal = Math.ceil(maxVal / 10) * 10;

  // Compute exact point coordinates for Line mode
  const compilePoints = compile.map((val, idx) => ({
    x: paddingLeft + idx * stepX,
    y: paddingTop + activeHeight - ((showCompile ? val : 0) / maxVal) * activeHeight,
  }));

  const queryPoints = query.map((val, idx) => ({
    x: paddingLeft + idx * stepX,
    y: paddingTop + activeHeight - ((showQuery ? val : 0) / maxVal) * activeHeight,
  }));

  // Bezier curve path generator
  const getBezierPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    const tension = 0.25;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) * tension;
      const cp1y = p0.y;
      const cp2x = p1.x - (p1.x - p0.x) * tension;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const compilePath = showCompile ? getBezierPath(compilePoints) : "";
  const queryPath = showQuery ? getBezierPath(queryPoints) : "";

  const compileFillPath = showCompile && compilePoints.length
    ? `${compilePath} L ${compilePoints[compilePoints.length - 1].x} ${paddingTop + activeHeight} L ${compilePoints[0].x} ${paddingTop + activeHeight} Z`
    : "";

  const queryFillPath = showQuery && queryPoints.length
    ? `${queryPath} L ${queryPoints[queryPoints.length - 1].x} ${paddingTop + activeHeight} L ${queryPoints[0].x} ${paddingTop + activeHeight} Z`
    : "";

  // Mouse move callback to calculate tooltip and cursor tracking
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const svgX = (x / rect.width) * width;
    let idx = Math.round((svgX - paddingLeft) / stepX);
    if (idx < 0) idx = 0;
    if (idx >= n) idx = n - 1;

    setHoveredIdx(idx);

    const pointX = paddingLeft + idx * stepX;
    
    // Position tooltip vertically near the highest active series
    let activeY = paddingTop + activeHeight / 2;
    if (chartType === "bar") {
      const totalStacked = visibleCompile[idx] + visibleQuery[idx];
      activeY = paddingTop + activeHeight - (totalStacked / maxVal) * activeHeight;
    } else {
      const cY = compilePoints[idx].y;
      const qY = queryPoints[idx].y;
      activeY = Math.min(
        showCompile ? cY : Infinity,
        showQuery ? qY : Infinity,
        paddingTop + activeHeight
      );
    }

    setTooltipPos({
      x: (pointX / width) * rect.width,
      y: (activeY / height) * rect.height,
    });
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
    setTooltipPos(null);
  };

  const gridLines = [0, 1, 2, 3, 4];
  const barWidth = Math.max(Math.min(stepX * 0.35, 14), 2);

  return (
    <div className="section-block">
      {/* Label section */}
      <div className="card-label flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="card-label-title text-white flex items-center gap-2">
          Activity Over Time
        </div>
        
        {/* Responsive controls */}
        <div className="card-label-right flex items-center gap-3.5 flex-wrap">
          {/* Legend series toggles */}
          <div className="flex items-center gap-3.5 text-xs font-semibold select-none mr-2">
            <button
              type="button"
              onClick={() => setShowCompile(!showCompile)}
              className={`flex items-center gap-1.5 cursor-pointer transition-colors duration-200 ${
                showCompile ? "text-[#fafafa]" : "text-auth-text-3 hover:text-auth-text-2"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-sm block border transition-all ${
                  showCompile 
                    ? "bg-[#ff6b4a] border-[#ff6b4a] shadow-[0_0_8px_rgba(255,107,74,0.4)]" 
                    : "border-white/10 bg-transparent"
                }`}
              />
              <span>Ingests</span>
            </button>
            <button
              type="button"
              onClick={() => setShowQuery(!showQuery)}
              className={`flex items-center gap-1.5 cursor-pointer transition-colors duration-200 ${
                showQuery ? "text-[#fafafa]" : "text-auth-text-3 hover:text-auth-text-2"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-sm block border transition-all ${
                  showQuery 
                    ? "bg-[#9055ff] border-[#9055ff] shadow-[0_0_8px_rgba(144,85,255,0.4)]" 
                    : "border-white/10 bg-transparent"
                }`}
              />
              <span>Queries</span>
            </button>
          </div>

          {/* Chart Type Toggle: Line vs Bar */}
          <div className="flex items-center rounded-lg bg-[#18181b] border border-[#27272a] p-0.5">
            <button
              type="button"
              onClick={() => setChartType("line")}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                chartType === "line" 
                  ? "bg-white/5 text-white border border-white/[0.04] shadow-sm" 
                  : "text-auth-text-3 hover:text-auth-text-2"
              }`}
            >
              Line
            </button>
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                chartType === "bar" 
                  ? "bg-white/5 text-white border border-white/[0.04] shadow-sm" 
                  : "text-auth-text-3 hover:text-auth-text-2"
              }`}
            >
              Bar
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="tech-sort-label text-xs text-auth-text-3">Period</span>
            <Select
              value={period}
              onChange={setPeriod}
              options={[
                { value: "7d", label: "Last 7 days" },
                { value: "30d", label: "Last 30 days" },
                { value: "1Q", label: "Q1 (3 months)" },
                { value: "3Q", label: "Q3 (9 months)" },
                { value: "1Y", label: "1 Year" },
                { value: "5Y", label: "5 Years" },
                { value: "all", label: "All time" },
              ]}
              align="right"
              className="bg-[#18181b] border border-[#27272a] text-auth-text rounded-lg px-2.5 py-1"
            />
          </div>
        </div>
      </div>

      {/* SVG Chart Card */}
      <div className="chart-card fade-up relative" onMouseLeave={handleMouseLeave}>
        <div className="text-center pb-2 pt-1 font-mono text-[9px] text-auth-text-3 tracking-widest uppercase flex items-center justify-center gap-1 select-none">
          <span>Pulse Knowledge Analytics</span>
          <span className="text-[#52525b]">•</span>
          <span className="text-[var(--color-auth-accent)] flex items-center gap-0.5">
            <LineIcon name="alarm" className="w-2.5 h-2.5 inline" /> updated 9m ago
          </span>
        </div>

        <div className="chart-area w-full relative">
          <svg
            ref={svgRef}
            className="w-full h-full overflow-visible"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="compileGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6b4a" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#ff6b4a" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="queryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9055ff" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#9055ff" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="barCompileGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6b4a" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#ff6b4a" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="barQueryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9055ff" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#9055ff" stopOpacity={0.25} />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {gridLines.map((i) => {
              const yVal = paddingTop + activeHeight - (i / 4) * activeHeight;
              const textVal = Math.round((maxVal * i) / 4);
              return (
                <g key={`grid-y-${i}`}>
                  <line
                    x1={paddingLeft}
                    y1={yVal}
                    x2={width - paddingRight}
                    y2={yVal}
                    stroke={i === 0 ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)"}
                    strokeWidth={1}
                  />
                  <text
                    x={paddingLeft - 10}
                    y={yVal + 3.5}
                    fill="#71717a"
                    fontSize={9}
                    fontFamily="var(--font-mono)"
                    textAnchor="end"
                    className="select-none"
                  >
                    {textVal}
                  </text>
                </g>
              );
            })}

            {/* Vertical grid markers & labels */}
            {labels.map((lbl, idx) => {
              const xVal = paddingLeft + idx * stepX;
              const showLabel = n <= 10 || idx % Math.ceil(n / 8) === 0 || idx === n - 1;
              return (
                <g key={`grid-x-${idx}`}>
                  {showLabel && (
                    <>
                      <line
                        x1={xVal}
                        y1={paddingTop}
                        x2={xVal}
                        y2={paddingTop + activeHeight}
                        stroke="rgba(255, 255, 255, 0.015)"
                        strokeWidth={1}
                      />
                      <text
                        x={xVal}
                        y={paddingTop + activeHeight + 15}
                        fill="#71717a"
                        fontSize={9}
                        fontFamily="var(--font-sans)"
                        textAnchor="middle"
                        className="select-none"
                      >
                        {lbl}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Render lines if chartType is line */}
            {chartType === "line" && (
              <>
                {/* Area Fills */}
                {compileFillPath && (
                  <path d={compileFillPath} fill="url(#compileGrad)" className="transition-all duration-300" />
                )}
                {queryFillPath && (
                  <path d={queryFillPath} fill="url(#queryGrad)" className="transition-all duration-300" />
                )}

                {/* Strokes */}
                {compilePath && (
                  <path
                    d={compilePath}
                    fill="none"
                    stroke="#ff6b4a"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                )}
                {queryPath && (
                  <path
                    d={queryPath}
                    fill="none"
                    stroke="#9055ff"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                )}

                {/* Line point dots (Only shown on hover for high-end look) */}
                {compilePoints.map((pt, idx) => {
                  if (!showCompile) return null;
                  const isHovered = hoveredIdx === idx;
                  if (!isHovered) return null;
                  return (
                    <circle
                      key={`pt-c-${idx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={5}
                      fill="#ff6b4a"
                      stroke="#09090b"
                      strokeWidth={2.5}
                      className="transition-all duration-75"
                    />
                  );
                })}

                {/* Query point dots (Only shown on hover for high-end look) */}
                {queryPoints.map((pt, idx) => {
                  if (!showQuery) return null;
                  const isHovered = hoveredIdx === idx;
                  if (!isHovered) return null;
                  return (
                    <circle
                      key={`pt-q-${idx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={5}
                      fill="#9055ff"
                      stroke="#09090b"
                      strokeWidth={2.5}
                      className="transition-all duration-75"
                    />
                  );
                })}
              </>
            )}

            {/* Render stacked bars if chartType is bar */}
            {chartType === "bar" &&
              compile.map((_, idx) => {
                const cVal = visibleCompile[idx];
                const qVal = visibleQuery[idx];
                
                const hCompile = (cVal / maxVal) * activeHeight;
                const hQuery = (qVal / maxVal) * activeHeight;

                const hasBoth = cVal > 0 && qVal > 0;
                const gap = hasBoth ? 2 : 0;

                const hCompileAdjusted = Math.max(hCompile - gap / 2, 0);
                const hQueryAdjusted = Math.max(hQuery - gap / 2, 0);

                const yCompileAdjusted = paddingTop + activeHeight - hCompileAdjusted;
                const yQueryAdjusted = yCompileAdjusted - hQueryAdjusted - gap;

                const xPos = paddingLeft + idx * stepX - barWidth / 2;
                const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;

                return (
                  <g 
                    key={`bar-group-${idx}`}
                    className="transition-opacity duration-200"
                    style={{ opacity: isDimmed ? 0.25 : 1 }}
                  >
                    {/* Ingestion bar */}
                    {cVal > 0 && (
                      <rect
                        x={xPos}
                        y={yCompileAdjusted}
                        width={barWidth}
                        height={hCompileAdjusted}
                        fill="url(#barCompileGrad)"
                        stroke="#ff6b4a"
                        strokeWidth={1}
                        strokeOpacity={0.3}
                        rx={hasBoth ? 0 : 2} // round top if no query on top
                      />
                    )}
                    {/* Query bar stacked */}
                    {qVal > 0 && (
                      <rect
                        x={xPos}
                        y={yQueryAdjusted}
                        width={barWidth}
                        height={hQueryAdjusted}
                        fill="url(#barQueryGrad)"
                        stroke="#9055ff"
                        strokeWidth={1}
                        strokeOpacity={0.3}
                        rx={2} // always round top of the query bar
                      />
                    )}
                  </g>
                );
              })}

            {/* Hover Crosshair vertical tracker */}
            {hoveredIdx !== null && (
              <line
                x1={paddingLeft + hoveredIdx * stepX}
                y1={paddingTop}
                x2={paddingLeft + hoveredIdx * stepX}
                y2={paddingTop + activeHeight}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={1}
                strokeDasharray="4 4"
                className="pointer-events-none"
              />
            )}
          </svg>
        </div>        {/* HTML Tooltip overlay styled to match Dune Analytics */}
        {hoveredIdx !== null && tooltipPos && (
          <div
            className="absolute z-30 pointer-events-none rounded-xl p-3 shadow-2xl text-[11px] font-sans text-left transition-all duration-75"
            style={{
              left: `${tooltipPos.x + 16}px`,
              top: `${tooltipPos.y + 8}px`,
              transform: tooltipPos.x > 540 ? "translateX(-110%)" : "none",
              background: "rgba(8, 8, 10, 0.88)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.7)",
            }}
          >
            <div className="font-bold text-[#fafafa] mb-1.5 pb-1 border-b border-white/5 flex items-center justify-between gap-4">
              <span>{labels[hoveredIdx]}</span>
              <span className="text-[9px] text-[#52525b] font-normal font-mono">Index #{hoveredIdx + 1}</span>
            </div>
            
            {showCompile && (
              <div className="flex items-center justify-between gap-6 text-[#a1a1aa] mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ff6b4a] shadow-[0_0_6px_#ff6b4a]" />
                  <span>Compiled Sources:</span>
                </div>
                <strong className="text-white font-mono">{compile[hoveredIdx]}</strong>
              </div>
            )}
 
            {showQuery && (
              <div className="flex items-center justify-between gap-6 text-[#a1a1aa] mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#9055ff] shadow-[0_0_6px_#9055ff]" />
                  <span>AI Queries:</span>
                </div>
                <strong className="text-white font-mono">{query[hoveredIdx]}</strong>
              </div>
            )}
            
            {(showCompile && showQuery) && (
              <div className="flex items-center justify-between gap-6 text-[#71717a] pt-1 mt-1 border-t border-white/5 text-[10px]">
                <span>Total Activity:</span>
                <strong className="text-[#a1a1aa] font-mono">{compile[hoveredIdx] + query[hoveredIdx]}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
