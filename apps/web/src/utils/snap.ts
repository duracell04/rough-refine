// Snapping system for RoughRefine transforms

import type { BoundingBox, Point, SnapResult } from '../types/transform';

export interface SnapCandidate {
  id: string;
  bounds: BoundingBox;
}

export class SnapSystem {
  private candidates: SnapCandidate[] = [];
  private threshold = 6;
  private zoom = 1;

  setZoom(zoom: number) {
    this.zoom = zoom;
    this.threshold = 6 / zoom;
  }

  setCandidates(candidates: SnapCandidate[]) {
    this.candidates = candidates;
  }

  snap(bounds: BoundingBox, excludeIds: string[] = []): SnapResult {
    const neighbors = this.candidates.filter(c => !excludeIds.includes(c.id));
    
    let best: SnapResult = { dx: 0, dy: 0, kind: null, distance: Infinity };
    
    for (const neighbor of neighbors) {
      const snaps = [
        // X-axis snaps
        { kind: 'edge-x' as const, dx: neighbor.bounds.x - bounds.x, dy: 0 },
        { kind: 'edge-x' as const, dx: (neighbor.bounds.x + neighbor.bounds.width) - (bounds.x + bounds.width), dy: 0 },
        { kind: 'center-x' as const, dx: (neighbor.bounds.x + neighbor.bounds.width / 2) - (bounds.x + bounds.width / 2), dy: 0 },
        
        // Y-axis snaps
        { kind: 'edge-y' as const, dx: 0, dy: neighbor.bounds.y - bounds.y },
        { kind: 'edge-y' as const, dx: 0, dy: (neighbor.bounds.y + neighbor.bounds.height) - (bounds.y + bounds.height) },
        { kind: 'center-y' as const, dx: 0, dy: (neighbor.bounds.y + neighbor.bounds.height / 2) - (bounds.y + bounds.height / 2) },
      ];
      
      for (const snap of snaps) {
        const distance = Math.abs(snap.dx + snap.dy);
        if (distance <= this.threshold && distance < best.distance) {
          best = { ...snap, distance };
        }
      }
    }
    
    return best.distance === Infinity ? { dx: 0, dy: 0, kind: null, distance: 0 } : best;
  }

  getSnapGuides(snapResult: SnapResult, bounds: BoundingBox): { x1: number; y1: number; x2: number; y2: number; label: string }[] {
    if (!snapResult.kind) return [];
    
    const guides = [];
    
    if (snapResult.kind.includes('x')) {
      const x = snapResult.kind === 'center-x' 
        ? bounds.x + bounds.width / 2 + snapResult.dx
        : bounds.x + snapResult.dx;
      
      guides.push({
        x1: x, y1: bounds.y - 20,
        x2: x, y2: bounds.y + bounds.height + 20,
        label: snapResult.kind === 'center-x' ? 'Center' : 'Edge'
      });
    }
    
    if (snapResult.kind.includes('y')) {
      const y = snapResult.kind === 'center-y'
        ? bounds.y + bounds.height / 2 + snapResult.dy
        : bounds.y + snapResult.dy;
      
      guides.push({
        x1: bounds.x - 20, y1: y,
        x2: bounds.x + bounds.width + 20, y2: y,
        label: snapResult.kind === 'center-y' ? 'Center' : 'Edge'
      });
    }
    
    return guides;
  }
}

export const snapSystem = new SnapSystem();