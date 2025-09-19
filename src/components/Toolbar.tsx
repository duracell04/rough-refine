import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer2, 
  Hand, 
  Square, 
  Circle, 
  Minus, 
  Pentagon, 
  Pen, 
  Type,
  Download,
  Upload,
  Save
} from "lucide-react";
import { Logo } from "./Logo";

export type Tool = 'pointer' | 'hand' | 'rect' | 'ellipse' | 'line' | 'polygon' | 'pen' | 'text';

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onImport: () => void;
  onExport: () => void;
  onSave: () => void;
}

const tools = [
  { id: 'pointer' as Tool, icon: MousePointer2, label: 'Select' },
  { id: 'hand' as Tool, icon: Hand, label: 'Pan' },
  { id: 'rect' as Tool, icon: Square, label: 'Rectangle' },
  { id: 'ellipse' as Tool, icon: Circle, label: 'Ellipse' },
  { id: 'line' as Tool, icon: Minus, label: 'Line' },
  { id: 'polygon' as Tool, icon: Pentagon, label: 'Polygon' },
  { id: 'pen' as Tool, icon: Pen, label: 'Pen' },
  { id: 'text' as Tool, icon: Type, label: 'Text' },
];

export function Toolbar({ 
  activeTool, 
  onToolChange, 
  onImport, 
  onExport, 
  onSave 
}: ToolbarProps) {
  return (
    <div className="editor-toolbar flex items-center justify-between px-4 py-2">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Logo size={32} showRough={false} />
        <div>
          <h1 className="font-semibold text-lg text-ink">RoughRefine</h1>
          <p className="text-xs text-muted-foreground">Sketch fast. Refine precisely.</p>
        </div>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-1">
        {tools.map((tool, index) => (
          <div key={tool.id} className="flex items-center">
            {(index === 2 || index === 6) && <Separator orientation="vertical" className="h-6 mx-2" />}
            <Button
              variant="ghost"
              size="sm"
              className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => onToolChange(tool.id)}
              title={tool.label}
            >
              <tool.icon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onImport} title="Import SVG">
          <Upload className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onSave} title="Save Project">
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onExport} title="Export SVG">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}