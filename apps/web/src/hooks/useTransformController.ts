// Transform controller hook for direct manipulation

import { useState, useCallback } from 'react';
import type { 
  TransformState, 
  TransformMode, 
  BoundingBox, 
  Point, 
  SnapResult,
  Matrix
} from '../types/transform';
import { 
  identityMatrix, 
  multiplyMatrix, 
  translateMatrix, 
  scaleMatrix, 
  rotateMatrix,
  transformPoint,
  getBounds,
  degreesToRadians,
  radiansToDegrees,
  constrainAngle
} from '../utils/matrix';
import { snapSystem } from '../utils/snap';

interface UseTransformControllerProps {
  onTransformStart?: () => void;
  onTransformEnd?: (shapeIds: string[], matrix: Matrix, bounds: BoundingBox) => void;
  onSnapUpdate?: (snapResult: SnapResult, bounds: BoundingBox) => void;
}

export function useTransformController({
  onTransformStart,
  onTransformEnd,
  onSnapUpdate
}: UseTransformControllerProps) {
  const [transformState, setTransformState] = useState<TransformState | null>(null);
  const [currentSnapResult, setCurrentSnapResult] = useState<SnapResult>({ 
    dx: 0, dy: 0, kind: null, distance: 0 
  });

  const startTransform = useCallback((
    mode: TransformMode,
    handle: string | undefined,
    startPoint: Point,
    bounds: BoundingBox,
    constrainAspect = false,
    constrainAngle = false
  ) => {
    setTransformState({
      mode,
      handle,
      startBounds: bounds,
      startPoint,
      currentPoint: startPoint,
      constrainAspect,
      constrainAngle
    });
    onTransformStart?.();
  }, [onTransformStart]);

  const updateTransform = useCallback((
    currentPoint: Point,
    selectedIds: string[],
    constrainAspect = false,
    constrainAngleParam = false
  ): { matrix: Matrix; bounds: BoundingBox } | null => {
    if (!transformState) return null;

    const newState = {
      ...transformState,
      currentPoint,
      constrainAspect: constrainAspect || transformState.constrainAspect,
      constrainAngle: constrainAngleParam || transformState.constrainAngle
    };
    setTransformState(newState);

    const { mode, handle, startBounds, startPoint } = newState;
    const dx = currentPoint.x - startPoint.x;
    const dy = currentPoint.y - startPoint.y;

    let matrix = identityMatrix();
    let newBounds = { ...startBounds };

    switch (mode) {
      case 'move': {
        // Apply snapping for move operations
        const potentialBounds = {
          ...startBounds,
          x: startBounds.x + dx,
          y: startBounds.y + dy
        };
        
        const snapResult = snapSystem.snap(potentialBounds, selectedIds);
        setCurrentSnapResult(snapResult);
        onSnapUpdate?.(snapResult, potentialBounds);

        const finalDx = dx + snapResult.dx;
        const finalDy = dy + snapResult.dy;
        
        matrix = translateMatrix(finalDx, finalDy);
        newBounds = {
          ...startBounds,
          x: startBounds.x + finalDx,
          y: startBounds.y + finalDy
        };
        break;
      }

      case 'resize': {
        if (!handle) break;
        
        let scaleX = 1, scaleY = 1;
        let originX = startBounds.x + startBounds.width / 2;
        let originY = startBounds.y + startBounds.height / 2;

        // Calculate scale based on handle
        switch (handle) {
          case 'nw':
            scaleX = (startBounds.width - dx) / startBounds.width;
            scaleY = (startBounds.height - dy) / startBounds.height;
            originX = startBounds.x + startBounds.width;
            originY = startBounds.y + startBounds.height;
            break;
          case 'ne':
            scaleX = (startBounds.width + dx) / startBounds.width;
            scaleY = (startBounds.height - dy) / startBounds.height;
            originX = startBounds.x;
            originY = startBounds.y + startBounds.height;
            break;
          case 'se':
            scaleX = (startBounds.width + dx) / startBounds.width;
            scaleY = (startBounds.height + dy) / startBounds.height;
            originX = startBounds.x;
            originY = startBounds.y;
            break;
          case 'sw':
            scaleX = (startBounds.width - dx) / startBounds.width;
            scaleY = (startBounds.height + dy) / startBounds.height;
            originX = startBounds.x + startBounds.width;
            originY = startBounds.y;
            break;
          case 'n':
            scaleY = (startBounds.height - dy) / startBounds.height;
            originY = startBounds.y + startBounds.height;
            break;
          case 's':
            scaleY = (startBounds.height + dy) / startBounds.height;
            originY = startBounds.y;
            break;
          case 'w':
            scaleX = (startBounds.width - dx) / startBounds.width;
            originX = startBounds.x + startBounds.width;
            break;
          case 'e':
            scaleX = (startBounds.width + dx) / startBounds.width;
            originX = startBounds.x;
            break;
        }

        // Constrain aspect ratio if needed
        if (newState.constrainAspect && ['nw', 'ne', 'se', 'sw'].includes(handle)) {
          const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
          scaleX = scaleX < 0 ? -avgScale : avgScale;
          scaleY = scaleY < 0 ? -avgScale : avgScale;
        }

        // Prevent negative scales (minimum 0.1)
        scaleX = Math.max(0.1, Math.abs(scaleX)) * Math.sign(scaleX);
        scaleY = Math.max(0.1, Math.abs(scaleY)) * Math.sign(scaleY);

        // Build transform matrix
        const translateToOrigin = translateMatrix(-originX, -originY);
        const scale = scaleMatrix(scaleX, scaleY);
        const translateBack = translateMatrix(originX, originY);
        
        matrix = multiplyMatrix(
          multiplyMatrix(translateBack, scale),
          translateToOrigin
        );

        // Calculate new bounds
        const corners = [
          { x: startBounds.x, y: startBounds.y },
          { x: startBounds.x + startBounds.width, y: startBounds.y },
          { x: startBounds.x + startBounds.width, y: startBounds.y + startBounds.height },
          { x: startBounds.x, y: startBounds.y + startBounds.height }
        ];
        
        const transformedCorners = corners.map(corner => transformPoint(corner, matrix));
        newBounds = getBounds(transformedCorners);
        break;
      }

      case 'rotate': {
        const centerX = startBounds.x + startBounds.width / 2;
        const centerY = startBounds.y + startBounds.height / 2;
        
        const startAngle = Math.atan2(startPoint.y - centerY, startPoint.x - centerX);
        const currentAngle = Math.atan2(currentPoint.y - centerY, currentPoint.x - centerX);
        let rotation = currentAngle - startAngle;

        // Constrain to 15° increments if Shift is held
        if (newState.constrainAngle) {
          rotation = constrainAngle(rotation);
        }

        // Build rotation matrix around center
        const translateToOrigin = translateMatrix(-centerX, -centerY);
        const rotate = rotateMatrix(rotation);
        const translateBack = translateMatrix(centerX, centerY);
        
        matrix = multiplyMatrix(
          multiplyMatrix(translateBack, rotate),
          translateToOrigin
        );

        // For rotation, bounds may change
        const corners = [
          { x: startBounds.x, y: startBounds.y },
          { x: startBounds.x + startBounds.width, y: startBounds.y },
          { x: startBounds.x + startBounds.width, y: startBounds.y + startBounds.height },
          { x: startBounds.x, y: startBounds.y + startBounds.height }
        ];
        
        const transformedCorners = corners.map(corner => transformPoint(corner, matrix));
        newBounds = getBounds(transformedCorners);
        break;
      }
    }

    return { matrix, bounds: newBounds };
  }, [transformState, onSnapUpdate]);

  const endTransform = useCallback((selectedIds: string[]) => {
    if (!transformState) return;

    const result = updateTransform(transformState.currentPoint, selectedIds);
    if (result) {
      onTransformEnd?.(selectedIds, result.matrix, result.bounds);
    }

    setTransformState(null);
    setCurrentSnapResult({ dx: 0, dy: 0, kind: null, distance: 0 });
  }, [transformState, updateTransform, onTransformEnd]);

  const cancelTransform = useCallback(() => {
    setTransformState(null);
    setCurrentSnapResult({ dx: 0, dy: 0, kind: null, distance: 0 });
  }, []);

  return {
    transformState,
    currentSnapResult,
    startTransform,
    updateTransform,
    endTransform,
    cancelTransform,
    isTransforming: transformState !== null
  };
}