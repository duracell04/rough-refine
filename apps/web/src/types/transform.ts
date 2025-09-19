// Transform system types for RoughRefine

export interface Matrix {
  a: number; // scale-x
  b: number; // skew-y
  c: number; // skew-x  
  d: number; // scale-y
  e: number; // translate-x
  f: number; // translate-y
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface SnapResult {
  dx: number;
  dy: number;
  kind: 'edge-x' | 'center-x' | 'edge-y' | 'center-y' | null;
  distance: number;
}

export interface TransformHandle {
  type: 'resize' | 'rotate';
  position: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate';
  cursor: string;
  point: Point;
}

export type TransformMode = 'none' | 'move' | 'resize' | 'rotate';

export interface TransformState {
  mode: TransformMode;
  handle?: string;
  startBounds: BoundingBox;
  startPoint: Point;
  currentPoint: Point;
  constrainAspect: boolean;
  constrainAngle: boolean;
}

// Command types for undo/redo
export type Command = 
  | { type: 'transform'; shapeIds: string[]; matrix: Matrix; bounds: BoundingBox }
  | { type: 'create'; shape: any }
  | { type: 'delete'; shapeIds: string[] }
  | { type: 'select'; shapeIds: string[] };