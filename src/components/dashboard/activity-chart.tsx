"use client";

import { useState, useRef } from "react";

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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const dataset = CHART_DATA[period] || CHART_DATA["7d"];
  const { labels, compile, query } = dataset;

  // Chart configuration constants matching globals.css
  const width = 800;
  const height = 170;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 25;

  const activeWidth = width - paddingLeft - paddingRight;
  const activeHeight = height - paddingTop - paddingBottom;

  // Find max value in dataset to scale Y axis dynamically
  const rawMax = Math.max(...compile, ...query, 1);
  let maxVal = rawMax;
  if (rawMax <= 5) maxVal = 5;
  else if (rawMax <= 10) maxVal = 10;
  else if (rawMax <= 20) maxVal = 20;
  else if (rawMax <= 50) maxVal = 50;
  else maxVal = Math.ceil(rawMax / 10) * 10;

  const n = labels.length;
  const stepX = activeWidth / (n - 1);

  // Compute exact point coordinates
  const compilePoints = compile.map((val, idx) => ({
    x: paddingLeft + idx * stepX,
    y: paddingTop + activeHeight - (val / maxVal) * activeHeight,
  }));

  const queryPoints = query.map((val, idx) => ({
    x: paddingLeft + idx * stepX,
    y: paddingTop + activeHeight - (val / maxVal) * activeHeight,
  }));

  // Bezier curve calculation using cubic spline segment generation (tension = 0.3)
  const getBezierPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    const tension = 0.3;
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

  const compilePath = getBezierPath(compilePoints);
  const queryPath = getBezierPath(queryPoints);

  const compileFillPath = compilePoints.length
    ? `${compilePath} L ${compilePoints[compilePoints.length - 1].x} ${paddingTop + activeHeight} L ${compilePoints[0].x} ${paddingTop + activeHeight} Z`
    : "";

  const queryFillPath = queryPoints.length
    ? `${queryPath} L ${queryPoints[queryPoints.length - 1].x} ${paddingTop + activeHeight} L ${queryPoints[0].x} ${paddingTop + activeHeight} Z`
    : "";

  // Mouse interactivity calculations
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert mouse x to internal SVG coordinate system (width: 800)
    const svgX = (x / rect.width) * width;

    let idx = Math.round((svgX - paddingLeft) / stepX);
    if (idx < 0) idx = 0;
    if (idx >= n) idx = n - 1;

    setHoveredIdx(idx);

    // Calculate tooltip coordinates relative to SVG container bounding box
    const pointX = paddingLeft + idx * stepX;
    const compileY = compilePoints[idx].y;
    const queryY = queryPoints[idx].y;
    const tooltipY = Math.min(compileY, queryY);

    setTooltipPos({
      x: (pointX / width) * rect.width,
      y: (tooltipY / height) * rect.height,
    });
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
    setTooltipPos(null);
  };

  // Generate grid values
  const gridLines = [0, 1, 2, 3, 4];

  return (
    <div className="section-block">
      {/* Label section */}
      <div className="card-label">
        <div className="card-label-title text-white flex items-center gap-2">
          Activity Over Time
        </div>
        <div className="card-label-right">
          <div className="flex items-center gap-2">
            <span className="tech-sort-label text-xs text-auth-text-3">Period</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="tech-sort-select bg-[#18181b] border border-[#27272a] text-xs text-auth-text font-semibold rounded-lg px-2.5 py-1 cursor-pointer focus:border-auth-accent transition-all appearance-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="1Q">Q1 (3 months)</option>
              <option value="3Q">Q3 (9 months)</option>
              <option value="1Y">1 Year</option>
              <option value="5Y">5 Years</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      {/* SVG Chart Card */}
      <div className="chart-card fade-up relative" onMouseLeave={handleMouseLeave}>
        <div className="text-center pb-2 pt-1 font-mono text-[10px] text-auth-text-3 tracking-widest uppercase">
          Knowledge compilation &amp; query activity
        </div>

        <div className="chart-area w-full" style={{ height: "170px" }}>
          <svg
            ref={svgRef}
            className="w-full h-full"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
          >
            <defs>
              {/* Gradients matching spec */}
              <linearGradient id="compileGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="queryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines & Y Axis Labels */}
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
                    stroke="rgba(255, 255, 255, 0.04)"
                    strokeWidth={1}
                  />
                  <text
                    x={paddingLeft - 10}
                    y={yVal + 4}
                    fill="#52525b"
                    fontSize={10}
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="end"
                  >
                    {textVal}
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines & X Axis Labels */}
            {labels.map((lbl, idx) => {
              const xVal = paddingLeft + idx * stepX;
              // Limit showing labels to avoid clutter
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
                        stroke="rgba(255, 255, 255, 0.02)"
                        strokeWidth={1}
                      />
                      <text
                        x={xVal}
                        y={height - 5}
                        fill="#52525b"
                        fontSize={9}
                        fontFamily="Inter, sans-serif"
                        textAnchor="middle"
                      >
                        {lbl}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Area Fills */}
            {compileFillPath && (
              <path d={compileFillPath} fill="url(#compileGrad)" />
            )}
            {queryFillPath && (
              <path d={queryFillPath} fill="url(#queryGrad)" />
            )}

            {/* Lines */}
            {compilePath && (
              <path
                d={compilePath}
                fill="none"
                stroke="#10b981"
                strokeWidth={2}
                strokeLinecap="round"
              />
            )}
            {queryPath && (
              <path
                d={queryPath}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeLinecap="round"
              />
            )}

            {/* Hover Vertical Line marker */}
            {hoveredIdx !== null && (
              <line
                x1={paddingLeft + hoveredIdx * stepX}
                y1={paddingTop}
                x2={paddingLeft + hoveredIdx * stepX}
                y2={paddingTop + activeHeight}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            {/* Interactive Data Point Dots */}
            {compilePoints.map((pt, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <circle
                  key={`pt-c-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : 3}
                  fill="#10b981"
                  stroke="#141416"
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all duration-75"
                />
              );
            })}

            {/* Interactive Query Dots */}
            {queryPoints.map((pt, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <circle
                  key={`pt-q-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : 3}
                  fill="#8b5cf6"
                  stroke="#141416"
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all duration-75"
                />
              );
            })}
          </svg>
        </div>

        {/* HTML Tooltip overlay styled to match Chart.js */}
        {hoveredIdx !== null && tooltipPos && (
          <div
            className="absolute z-30 pointer-events-none bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 shadow-xl text-[11px] font-sans text-left transition-all duration-75"
            style={{
              left: `${tooltipPos.x + 15}px`,
              top: `${tooltipPos.y + 10}px`,
              transform: tooltipPos.x > 500 ? "translateX(-110%)" : "none",
            }}
          >
            <div className="font-bold text-[#fafafa] mb-1">{labels[hoveredIdx]}</div>
            <div className="flex items-center gap-1.5 text-[#a1a1aa] mb-0.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span>Compiled: <strong className="text-white">{compile[hoveredIdx]}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[#a1a1aa]">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
              <span>Queries: <strong className="text-white">{query[hoveredIdx]}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
