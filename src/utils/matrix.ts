// SVG transform matrix utilities

import type { Matrix, Point, BoundingBox } from '../types/transform';

export const identityMatrix = (): Matrix => ({
  a: 1, b: 0, c: 0, d: 1, e: 0, f: 0
});

export const matrixToString = (m: Matrix): string => 
  `matrix(${m.a},${m.b},${m.c},${m.d},${m.e},${m.f})`;

export const parseMatrix = (transform: string): Matrix => {
  const match = transform.match(/matrix\(([^)]+)\)/);
  if (!match) return identityMatrix();
  
  const values = match[1].split(/[,\s]+/).map(Number);
  if (values.length !== 6) return identityMatrix();
  
  return {
    a: values[0], b: values[1], c: values[2],
    d: values[3], e: values[4], f: values[5]
  };
};

export const multiplyMatrix = (a: Matrix, b: Matrix): Matrix => ({
  a: a.a * b.a + a.c * b.b,
  b: a.b * b.a + a.d * b.b,
  c: a.a * b.c + a.c * b.d,
  d: a.b * b.c + a.d * b.d,
  e: a.a * b.e + a.c * b.f + a.e,
  f: a.b * b.e + a.d * b.f + a.f
});

export const translateMatrix = (x: number, y: number): Matrix => ({
  a: 1, b: 0, c: 0, d: 1, e: x, f: y
});

export const scaleMatrix = (sx: number, sy: number): Matrix => ({
  a: sx, b: 0, c: 0, d: sy, e: 0, f: 0
});

export const rotateMatrix = (angle: number): Matrix => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0
  };
};

export const transformPoint = (point: Point, matrix: Matrix): Point => ({
  x: matrix.a * point.x + matrix.c * point.y + matrix.e,
  y: matrix.b * point.x + matrix.d * point.y + matrix.f
});

export const getBounds = (points: Point[]): BoundingBox => {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  
  let minX = points[0].x, maxX = points[0].x;
  let minY = points[0].y, maxY = points[0].y;
  
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

export const degreesToRadians = (degrees: number): number => 
  degrees * Math.PI / 180;

export const radiansToDegrees = (radians: number): number => 
  radians * 180 / Math.PI;

export const constrainAngle = (angle: number): number => {
  const deg = radiansToDegrees(angle);
  const snapped = Math.round(deg / 15) * 15; // Snap to 15° increments
  return degreesToRadians(snapped);
};