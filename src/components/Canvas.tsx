import { useRef, useEffect, useState, useCallback } from 'react';
import { Tool } from './Toolbar';

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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const point = screenToSVG(e.clientX, e.clientY);

    if (tool === 'hand') {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (tool === 'pointer') {
      // Handle selection
      const target = e.target as SVGElement;
      const shapeId = target.getAttribute('data-shape-id');
      
      if (shapeId) {
        if (e.shiftKey) {
          setSelectedShapes(prev => 
            prev.includes(shapeId) 
              ? prev.filter(id => id !== shapeId)
              : [...prev, shapeId]
          );
        } else {
          setSelectedShapes([shapeId]);
        }
      } else if (!e.shiftKey) {
        setSelectedShapes([]);
      }
      return;
    }

    // Drawing tools
    if (['rect', 'ellipse', 'line'].includes(tool)) {
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
  }, [tool, screenToSVG]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
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

    if (!isDrawing || !currentShape) return;

    const point = screenToSVG(e.clientX, e.clientY);
    const width = point.x - startPoint.x;
    const height = point.y - startPoint.y;

    setCurrentShape(prev => prev ? {
      ...prev,
      width: Math.abs(width),
      height: Math.abs(height),
      x: width < 0 ? point.x : startPoint.x,
      y: height < 0 ? point.y : startPoint.y
    } : null);
  }, [isDrawing, isPanning, currentShape, startPoint, screenToSVG, lastPanPoint, viewBox]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentShape) {
      if (currentShape.width > 5 || currentShape.height > 5) {
        setShapes(prev => [...prev, currentShape]);
        onShapeCreate?.(currentShape);
      }
      setCurrentShape(null);
      setIsDrawing(false);
    }
  }, [isPanning, isDrawing, currentShape, onShapeCreate]);

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

  const renderShape = (shape: Shape) => {
    const isSelected = selectedShapes.includes(shape.id);
    const commonProps = {
      key: shape.id,
      'data-shape-id': shape.id,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      className: isSelected ? 'ring-2 ring-selection-stroke' : '',
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
      default:
        return null;
    }
  };

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
        
        {/* Selection indicators */}
        {selectedShapes.length > 0 && shapes
          .filter(shape => selectedShapes.includes(shape.id))
          .map(shape => (
            <rect
              key={`selection-${shape.id}`}
              x={shape.x - 2}
              y={shape.y - 2}
              width={shape.width + 4}
              height={shape.height + 4}
              className="svg-selection-outline"
              pointerEvents="none"
            />
          ))
        }
      </svg>
    </div>
  );
}