// Visual snap guides and tooltips

import React from 'react';

interface SnapGuide {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

interface SnapGuidesProps {
  guides: SnapGuide[];
  zoom: number;
}

export function SnapGuides({ guides, zoom }: SnapGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <g className="snap-guides">
      {guides.map((guide, index) => (
        <g key={index}>
          {/* Guide line */}
          <line
            x1={guide.x1}
            y1={guide.y1}
            x2={guide.x2}
            y2={guide.y2}
            stroke="hsl(var(--snap-guide))"
            strokeWidth={1 / zoom}
            vectorEffect="non-scaling-stroke"
            strokeDasharray={`${3 / zoom} ${3 / zoom}`}
            pointerEvents="none"
          />
          
          {/* Label tooltip */}
          <g transform={`translate(${(guide.x1 + guide.x2) / 2}, ${(guide.y1 + guide.y2) / 2})`}>
            <rect
              x={-20 / zoom}
              y={-12 / zoom}
              width={40 / zoom}
              height={16 / zoom}
              fill="hsl(var(--snap-guide))"
              rx={3 / zoom}
              pointerEvents="none"
            />
            <text
              x={0}
              y={2 / zoom}
              textAnchor="middle"
              fill="white"
              fontSize={10 / zoom}
              fontFamily="var(--font-mono)"
              pointerEvents="none"
            >
              {guide.label}
            </text>
          </g>
        </g>
      ))}
    </g>
  );
}