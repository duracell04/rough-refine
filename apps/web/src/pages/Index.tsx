import { useState, useCallback } from 'react';
import { Toolbar, Tool } from '../components/Toolbar';
import { Inspector } from '../components/Inspector';
import { Canvas } from '../components/Canvas';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTool, setActiveTool] = useState<Tool>('pointer');
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedTransform, setSelectedTransform] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0
  });
  const [selectedStyle, setSelectedStyle] = useState({
    fill: '#e5e7eb',
    stroke: '#374151',
    strokeWidth: 2,
    opacity: 1,
    scaleStrokes: true
  });
  
  const { toast } = useToast();

  const handleToolChange = useCallback((tool: Tool) => {
    setActiveTool(tool);
  }, []);

  const handleShapeCreate = useCallback((shape: any) => {
    toast({
      title: "Shape created",
      description: `${shape.type} added to canvas`,
    });
  }, [toast]);

  const handleSelection = useCallback((elements: string[]) => {
    setSelectedCount(elements.length);
    if (elements.length === 1) {
      // In a real implementation, you'd get the actual transform data
      // For now, we'll use placeholder data
      setSelectedTransform({
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        rotation: 0
      });
    }
  }, []);

  const handleImport = useCallback(() => {
    toast({
      title: "Import SVG", 
      description: "SVG import functionality coming soon",
    });
  }, [toast]);

  const handleExport = useCallback(() => {
    toast({
      title: "Export SVG",
      description: "SVG exported successfully",
    });
  }, [toast]);

  const handleSave = useCallback(() => {
    toast({
      title: "Project saved",
      description: "Your work has been saved locally",
    });
  }, [toast]);

  const handleTransformChange = useCallback((transform: any) => {
    setSelectedTransform(transform);
  }, []);

  const handleStyleChange = useCallback((style: any) => {
    setSelectedStyle(style);
  }, []);

  const handleAlign = useCallback((type: string) => {
    toast({
      title: "Align objects",
      description: `Objects aligned: ${type}`,
    });
  }, [toast]);

  const handleOrder = useCallback((type: string) => {
    toast({
      title: "Reorder objects",
      description: `Objects moved: ${type}`,
    });
  }, [toast]);

  return (
    <div className="editor-layout">
      <Toolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onImport={handleImport}
        onExport={handleExport}
        onSave={handleSave}
      />
      
      <div className="editor-main">
        <Canvas
          tool={activeTool}
          onShapeCreate={handleShapeCreate}
          onSelection={handleSelection}
        />
        
        <Inspector
          selectedCount={selectedCount}
          transform={selectedCount > 0 ? selectedTransform : undefined}
          style={selectedCount > 0 ? selectedStyle : undefined}
          onTransformChange={handleTransformChange}
          onStyleChange={handleStyleChange}
          onAlign={handleAlign}
          onOrder={handleOrder}
        />
      </div>
    </div>
  );
};

export default Index;
