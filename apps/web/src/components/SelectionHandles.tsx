// Selection handles and transform controls for direct manipulation

import React from 'react';
import type { BoundingBox, TransformHandle } from '../types/transform';

interface SelectionHandlesProps {
  bounds: BoundingBox;
  zoom: number;
  onHandleMouseDown: (handle: string, e: React.MouseEvent) => void;
}

export function SelectionHandles({ bounds, zoom, onHandleMouseDown }: SelectionHandlesProps) {
  const handleSize = 8 / zoom; // Keep handles consistent size regardless of zoom
  const rotateKnobDistance = 20 / zoom;
  
  const handles: TransformHandle[] = [
    // 8 resize handles
    { type: 'resize', position: 'nw', cursor: 'nw-resize', 
      point: { x: bounds.x, y: bounds.y } },
    { type: 'resize', position: 'n', cursor: 'n-resize', 
      point: { x: bounds.x + bounds.width / 2, y: bounds.y } },
    { type: 'resize', position: 'ne', cursor: 'ne-resize', 
      point: { x: bounds.x + bounds.width, y: bounds.y } },
    { type: 'resize', position: 'e', cursor: 'e-resize', 
      point: { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 } },
    { type: 'resize', position: 'se', cursor: 'se-resize', 
      point: { x: bounds.x + bounds.width, y: bounds.y + bounds.height } },
    { type: 'resize', position: 's', cursor: 's-resize', 
      point: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height } },
    { type: 'resize', position: 'sw', cursor: 'sw-resize', 
      point: { x: bounds.x, y: bounds.y + bounds.height } },
    { type: 'resize', position: 'w', cursor: 'w-resize', 
      point: { x: bounds.x, y: bounds.y + bounds.height / 2 } },
    
    // 1 rotate knob
    { type: 'rotate', position: 'rotate', cursor: 'crosshair',
      point: { 
        x: bounds.x + bounds.width / 2, 
        y: bounds.y - rotateKnobDistance 
      } 
    },
  ];

  return (
    <g className="selection-handles">
      {/* Selection outline */}
      <rect
        x={bounds.x - 1}
        y={bounds.y - 1}
        width={bounds.width + 2}
        height={bounds.height + 2}
        fill="none"
        stroke="hsl(var(--selection-stroke))"
        strokeWidth={1 / zoom}
        strokeDasharray={`${4 / zoom} ${4 / zoom}`}
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      
      {/* Resize handles */}
      {handles.filter(h => h.type === 'resize').map(handle => (
        <rect
          key={handle.position}
          x={handle.point.x - handleSize / 2}
          y={handle.point.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="white"
          stroke="hsl(var(--selection-stroke))"
          strokeWidth={1 / zoom}
          vectorEffect="non-scaling-stroke"
          style={{ cursor: handle.cursor }}
          onMouseDown={(e) => onHandleMouseDown(handle.position, e)}
        />
      ))}
      
      {/* Rotate knob */}
      {handles.filter(h => h.type === 'rotate').map(handle => (
        <g key={handle.position}>
          {/* Connection line */}
          <line
            x1={bounds.x + bounds.width / 2}
            y1={bounds.y}
            x2={handle.point.x}
            y2={handle.point.y}
            stroke="hsl(var(--selection-stroke))"
            strokeWidth={1 / zoom}
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
          {/* Rotate handle */}
          <circle
            cx={handle.point.x}
            cy={handle.point.y}
            r={handleSize / 2}
            fill="white"
            stroke="hsl(var(--selection-stroke))"
            strokeWidth={1 / zoom}
            vectorEffect="non-scaling-stroke"
            style={{ cursor: handle.cursor }}
            onMouseDown={(e) => onHandleMouseDown(handle.position, e)}
          />
        </g>
      ))}
    </g>
  );
}