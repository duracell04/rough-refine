import { useRef, useEffect, useState, useCallback } from 'react';
import { Tool } from './Toolbar';
import { SelectionHandles } from './SelectionHandles';
import { SnapGuides } from './SnapGuides';
import { useTransformController } from '../hooks/useTransformController';
import { snapSystem } from '../utils/snap';
import { getBounds } from '../utils/matrix';
import type { BoundingBox, Point, Command } from '../types/transform';

interface CanvasProps {
  tool: Tool;
  onShapeCreate?: (shape: any) => void;
  onSelection?: (elements: string[]) => void;
}

interface Shape {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  transform?: string;
  vectorEffect?: string;
}

export function Canvas({ tool, onShapeCreate, onSelection }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 800 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [commandHistory, setCommandHistory] = useState<Command[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [snapGuides, setSnapGuides] = useState<any[]>([]);

  // Calculate zoom level
  const zoom = viewBox.width / 1200;

  // Command execution for undo/redo
  const executeCommand = useCallback((command: Command) => {
    switch (command.type) {
      case 'transform':
        setShapes(prevShapes => 
          prevShapes.map(shape => {
            if (command.shapeIds.includes(shape.id)) {
              return {
                ...shape,
                transform: `matrix(${command.matrix.a},${command.matrix.b},${command.matrix.c},${command.matrix.d},${command.matrix.e},${command.matrix.f})`
              };
            }
            return shape;
          })
        );
        break;
      case 'create':
        setShapes(prev => [...prev, command.shape]);
        break;
      case 'delete':
        setShapes(prev => prev.filter(s => !command.shapeIds.includes(s.id)));
        break;
      case 'select':
        setSelectedShapes(command.shapeIds);
        break;
    }
    
    // Add to history
    const newHistory = commandHistory.slice(0, historyIndex + 1);
    newHistory.push(command);
    if (newHistory.length > 100) newHistory.shift(); // Cap at 100
    setCommandHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [commandHistory, historyIndex]);

  // Transform controller
  const {
    transformState,
    currentSnapResult,
    startTransform,
    updateTransform,
    endTransform,
    cancelTransform,
    isTransforming
  } = useTransformController({
    onTransformStart: () => {
      // Pause any code sync while transforming
    },
    onTransformEnd: (shapeIds, matrix, bounds) => {
      // Apply transform to shapes and add to history
      executeCommand({
        type: 'transform',
        shapeIds,
        matrix,
        bounds
      });
    },
    onSnapUpdate: (snapResult, bounds) => {
      const guides = snapSystem.getSnapGuides(snapResult, bounds);
      setSnapGuides(guides);
    }
  });

  // Convert screen coordinates to SVG coordinates
  const screenToSVG = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = viewBox.width / rect.width;
    const scaleY = viewBox.height / rect.height;
    
    return {
      x: viewBox.x + (clientX - rect.left) * scaleX,
      y: viewBox.y + (clientY - rect.top) * scaleY
    };
  }, [viewBox]);

  // Get selection bounds for handles
  const getSelectionBounds = useCallback((): BoundingBox | null => {
    if (selectedShapes.length === 0) return null;
    
    const selectedShapeObjects = shapes.filter(s => selectedShapes.includes(s.id));
    if (selectedShapeObjects.length === 0) return null;
    
    const points: Point[] = [];
    selectedShapeObjects.forEach(shape => {
      points.push(
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.width, y: shape.y },
        { x: shape.x + shape.width, y: shape.y + shape.height },
        { x: shape.x, y: shape.y + shape.height }
      );
    });
    
    return getBounds(points);
  }, [shapes, selectedShapes]);

  // Handle selection handle interactions
  const handleHandleMouseDown = useCallback((handle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const bounds = getSelectionBounds();
    if (!bounds) return;
    
    const point = screenToSVG(e.clientX, e.clientY);
    const mode = handle === 'rotate' ? 'rotate' : 'resize';
    
    startTransform(
      mode,
      handle,
      point,
      bounds,
      e.shiftKey, // constrainAspect for resize
      e.shiftKey  // constrainAngle for rotate
    );
  }, [getSelectionBounds, screenToSVG, startTransform]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const point = screenToSVG(e.clientX, e.clientY);

    if (tool === 'hand') {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (tool === 'pointer') {
      // Hit test for shape selection
      const target = e.target as SVGElement;
      const shapeId = target.getAttribute('data-shape-id');
      
      if (shapeId) {
        // Shape clicked
        if (e.shiftKey) {
          setSelectedShapes(prev => 
            prev.includes(shapeId) 
              ? prev.filter(id => id !== shapeId)
              : [...prev, shapeId]
          );
        } else {
          setSelectedShapes([shapeId]);
        }
        
        // Start move transform if not already transforming
        if (!isTransforming) {
          const bounds = getSelectionBounds();
          if (bounds) {
            startTransform('move', undefined, point, bounds);
          }
        }
      } else if (!e.shiftKey) {
        // Clicked empty space - clear selection
        setSelectedShapes([]);
        setSnapGuides([]);
      }
      return;
    }

    // Drawing tools
    if (['rect', 'ellipse', 'line', 'text'].includes(tool)) {
      setIsDrawing(true);
      setStartPoint(point);
      
      const newShape: Shape = {
        id: `shape-${Date.now()}`,
        type: tool,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        fill: tool === 'line' ? 'none' : '#e5e7eb',
        stroke: '#374151',
        strokeWidth: 2
      };
      
      setCurrentShape(newShape);
    }
  }, [tool, screenToSVG, isTransforming, getSelectionBounds, startTransform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = screenToSVG(e.clientX, e.clientY);

    if (isPanning) {
      const deltaX = (e.clientX - lastPanPoint.x) * (viewBox.width / svgRef.current!.getBoundingClientRect().width);
      const deltaY = (e.clientY - lastPanPoint.y) * (viewBox.height / svgRef.current!.getBoundingClientRect().height);
      
      setViewBox(prev => ({
        ...prev,
        x: prev.x - deltaX,
        y: prev.y - deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // Handle transform updates
    if (isTransforming && transformState) {
      const result = updateTransform(point, selectedShapes, e.shiftKey, e.shiftKey);
      if (result) {
        // Update shapes temporarily during transform
        setShapes(prevShapes => 
          prevShapes.map(shape => {
            if (selectedShapes.includes(shape.id)) {
              return {
                ...shape,
                transform: `matrix(${result.matrix.a},${result.matrix.b},${result.matrix.c},${result.matrix.d},${result.matrix.e},${result.matrix.f})`
              };
            }
            return shape;
          })
        );
      }
      return;
    }

    // Handle drawing
    if (!isDrawing || !currentShape) return;

    const width = point.x - startPoint.x;
    const height = point.y - startPoint.y;

    setCurrentShape(prev => prev ? {
      ...prev,
      width: Math.abs(width),
      height: Math.abs(height),
      x: width < 0 ? point.x : startPoint.x,
      y: height < 0 ? point.y : startPoint.y
    } : null);
  }, [isPanning, screenToSVG, lastPanPoint, viewBox, isTransforming, transformState, updateTransform, selectedShapes, isDrawing, currentShape, startPoint]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // End transform
    if (isTransforming) {
      endTransform(selectedShapes);
      setSnapGuides([]);
      return;
    }

    // End drawing
    if (isDrawing && currentShape) {
      if (currentShape.width > 5 || currentShape.height > 5) {
        executeCommand({
          type: 'create',
          shape: currentShape
        });
        onShapeCreate?.(currentShape);
      }
      setCurrentShape(null);
      setIsDrawing(false);
    }
  }, [isPanning, isTransforming, endTransform, selectedShapes, isDrawing, currentShape, executeCommand, onShapeCreate]);

  // Keyboard handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (selectedShapes.length === 0) return;

    let dx = 0, dy = 0;
    const step = e.shiftKey ? 10 : 1;

    switch (e.key) {
      case 'ArrowLeft': dx = -step; break;
      case 'ArrowRight': dx = step; break;
      case 'ArrowUp': dy = -step; break;
      case 'ArrowDown': dy = step; break;
      case 'Delete':
        executeCommand({
          type: 'delete',
          shapeIds: selectedShapes
        });
        setSelectedShapes([]);
        return;
      default: return;
    }

    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
        executeCommand({
          type: 'transform',
          shapeIds: selectedShapes,
          matrix: { a: 1, b: 0, c: 0, d: 1, e: dx, f: dy },
          bounds: { x: 0, y: 0, width: 0, height: 0 }
        });
    }
  }, [selectedShapes, executeCommand]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const rect = svgRef.current!.getBoundingClientRect();
    const centerX = viewBox.x + viewBox.width / 2;
    const centerY = viewBox.y + viewBox.height / 2;
    
    setViewBox(prev => ({
      x: centerX - (prev.width * scaleFactor) / 2,
      y: centerY - (prev.height * scaleFactor) / 2,
      width: prev.width * scaleFactor,
      height: prev.height * scaleFactor
    }));
  }, [viewBox]);

  // Effects
  useEffect(() => {
    onSelection?.(selectedShapes);
  }, [selectedShapes, onSelection]);

  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener('wheel', handleWheel, { passive: false });
      return () => svg.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Update snap system when shapes change
  useEffect(() => {
    const candidates = shapes
      .filter(s => !selectedShapes.includes(s.id))
      .map(s => ({
        id: s.id,
        bounds: { x: s.x, y: s.y, width: s.width, height: s.height }
      }));
    
    snapSystem.setCandidates(candidates);
    snapSystem.setZoom(zoom);
  }, [shapes, selectedShapes, zoom]);

  const renderShape = (shape: Shape) => {
    const isSelected = selectedShapes.includes(shape.id);
    const commonProps = {
      key: shape.id,
      'data-shape-id': shape.id,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      transform: shape.transform,
      vectorEffect: shape.vectorEffect,
      style: { cursor: tool === 'pointer' ? 'pointer' : 'default' }
    };

    switch (shape.type) {
      case 'rect':
        return (
          <rect
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
          />
        );
      case 'ellipse':
        return (
          <ellipse
            {...commonProps}
            cx={shape.x + shape.width / 2}
            cy={shape.y + shape.height / 2}
            rx={shape.width / 2}
            ry={shape.height / 2}
          />
        );
      case 'line':
        return (
          <line
            {...commonProps}
            x1={shape.x}
            y1={shape.y}
            x2={shape.x + shape.width}
            y2={shape.y + shape.height}
          />
        );
      case 'text':
        return (
          <text
            {...commonProps}
            x={shape.x}
            y={shape.y + shape.height * 0.8}
            fontSize={Math.max(12, shape.height * 0.8)}
            dominantBaseline="alphabetic"
          >
            Text
          </text>
        );
      default:
        return null;
    }
  };

  const selectionBounds = getSelectionBounds();

  return (
    <div className="editor-canvas-area">
      <svg
        ref={svgRef}
        className="w-full h-full canvas-grid"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: tool === 'hand' ? 'grab' : isPanning ? 'grabbing' : 'default' }}
      >
        {/* Grid pattern */}
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.5" fill="hsl(var(--canvas-grid))" />
          </pattern>
        </defs>
        
        {/* Grid background */}
        <rect width="100%" height="100%" fill="#fafafa" />
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />
        
        {/* Artboard outline */}
        <rect
          x="100"
          y="100"
          width="800"
          height="600"
          fill="white"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray="5 5"
        />
        
        {/* Rendered shapes */}
        {shapes.map(renderShape)}
        
        {/* Current drawing shape */}
        {currentShape && renderShape(currentShape)}
        
        {/* Selection handles */}
        {selectionBounds && selectedShapes.length > 0 && (
          <SelectionHandles 
            bounds={selectionBounds}
            zoom={zoom}
            onHandleMouseDown={handleHandleMouseDown}
          />
        )}
        
        {/* Snap guides */}
        <SnapGuides guides={snapGuides} zoom={zoom} />
      </svg>
    </div>
  );
}