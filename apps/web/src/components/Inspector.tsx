import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Lock, AlignLeft, AlignCenter, AlignRight, 
         AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, 
         BringToFront, SendToBack } from "lucide-react";
import { useState } from "react";

interface InspectorProps {
  selectedCount: number;
  transform?: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  };
  style?: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    scaleStrokes: boolean;
  };
  onTransformChange?: (transform: any) => void;
  onStyleChange?: (style: any) => void;
  onAlign?: (type: string) => void;
  onOrder?: (type: string) => void;
}

export function Inspector({ 
  selectedCount, 
  transform,
  style,
  onTransformChange,
  onStyleChange,
  onAlign,
  onOrder 
}: InspectorProps) {
  const [transformOpen, setTransformOpen] = useState(true);
  const [appearanceOpen, setAppearanceOpen] = useState(true);
  const [aspectLocked, setAspectLocked] = useState(false);

  if (selectedCount === 0) {
    return (
      <div className="editor-inspector p-4">
        <div className="text-center text-muted-foreground py-8">
          <p className="text-sm">No objects selected</p>
          <p className="text-xs mt-1">Select objects to edit properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-inspector p-4 space-y-4">
      {/* Selection Info */}
      <div className="text-sm text-muted-foreground">
        {selectedCount === 1 ? '1 object selected' : `${selectedCount} objects selected`}
      </div>

      {/* Context Actions for Multiple Selection */}
      {selectedCount > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Alignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onAlign?.('left')} title="Align Left">
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onAlign?.('center')} title="Align Center">
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onAlign?.('right')} title="Align Right">
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onAlign?.('top')} title="Align Top">
                <AlignHorizontalJustifyStart className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onAlign?.('middle')} title="Align Middle">
                <AlignHorizontalJustifyCenter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onAlign?.('bottom')} title="Align Bottom">
                <AlignHorizontalJustifyEnd className="h-4 w-4" />
              </Button>
            </div>
            <Separator />
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onOrder?.('front')} title="Bring to Front">
                <BringToFront className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOrder?.('back')} title="Send to Back">
                <SendToBack className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transform Panel */}
      {transform && (
        <Collapsible open={transformOpen} onOpenChange={setTransformOpen}>
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  Transform
                  <ChevronDown className={`h-4 w-4 transition-transform ${transformOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="x" className="text-xs">X</Label>
                    <Input
                      id="x"
                      type="number"
                      value={Math.round(transform.x * 100) / 100}
                      onChange={(e) => onTransformChange?.({ ...transform, x: parseFloat(e.target.value) || 0 })}
                      className="precision-input h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="y" className="text-xs">Y</Label>
                    <Input
                      id="y"
                      type="number"
                      value={Math.round(transform.y * 100) / 100}
                      onChange={(e) => onTransformChange?.({ ...transform, y: parseFloat(e.target.value) || 0 })}
                      className="precision-input h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="width" className="text-xs flex items-center gap-1">
                      W
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-4 w-4 p-0 ${aspectLocked ? 'text-primary' : 'text-muted-foreground'}`}
                        onClick={() => setAspectLocked(!aspectLocked)}
                      >
                        <Lock className="h-3 w-3" />
                      </Button>
                    </Label>
                    <Input
                      id="width"
                      type="number"
                      value={Math.round(transform.width * 100) / 100}
                      onChange={(e) => {
                        const newWidth = parseFloat(e.target.value) || 0;
                        const newTransform = { ...transform, width: newWidth };
                        if (aspectLocked && transform.width > 0) {
                          const ratio = newWidth / transform.width;
                          newTransform.height = transform.height * ratio;
                        }
                        onTransformChange?.(newTransform);
                      }}
                      className="precision-input h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-xs">H</Label>
                    <Input
                      id="height"
                      type="number"
                      value={Math.round(transform.height * 100) / 100}
                      onChange={(e) => {
                        const newHeight = parseFloat(e.target.value) || 0;
                        const newTransform = { ...transform, height: newHeight };
                        if (aspectLocked && transform.height > 0) {
                          const ratio = newHeight / transform.height;
                          newTransform.width = transform.width * ratio;
                        }
                        onTransformChange?.(newTransform);
                      }}
                      className="precision-input h-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="rotation" className="text-xs">Rotation (°)</Label>
                  <Input
                    id="rotation"
                    type="number"
                    value={Math.round(transform.rotation * 100) / 100}
                    onChange={(e) => onTransformChange?.({ ...transform, rotation: parseFloat(e.target.value) || 0 })}
                    className="precision-input h-8"
                  />
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Appearance Panel */}
      {style && (
        <Collapsible open={appearanceOpen} onOpenChange={setAppearanceOpen}>
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  Appearance
                  <ChevronDown className={`h-4 w-4 transition-transform ${appearanceOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <Label htmlFor="fill" className="text-xs">Fill</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fill"
                      type="color"
                      value={style.fill}
                      onChange={(e) => onStyleChange?.({ ...style, fill: e.target.value })}
                      className="h-8 w-16 p-1"
                    />
                    <Input
                      type="text"
                      value={style.fill}
                      onChange={(e) => onStyleChange?.({ ...style, fill: e.target.value })}
                      className="precision-input h-8 flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="stroke" className="text-xs">Stroke</Label>
                  <div className="flex gap-2">
                    <Input
                      id="stroke"
                      type="color"
                      value={style.stroke}
                      onChange={(e) => onStyleChange?.({ ...style, stroke: e.target.value })}
                      className="h-8 w-16 p-1"
                    />
                    <Input
                      type="text"
                      value={style.stroke}
                      onChange={(e) => onStyleChange?.({ ...style, stroke: e.target.value })}
                      className="precision-input h-8 flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="strokeWidth" className="text-xs">Stroke Width</Label>
                  <Input
                    id="strokeWidth"
                    type="number"
                    min="0"
                    step="0.5"
                    value={style.strokeWidth}
                    onChange={(e) => onStyleChange?.({ ...style, strokeWidth: parseFloat(e.target.value) || 0 })}
                    className="precision-input h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="opacity" className="text-xs">Opacity</Label>
                  <Input
                    id="opacity"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={style.opacity}
                    onChange={(e) => onStyleChange?.({ ...style, opacity: parseFloat(e.target.value) || 1 })}
                    className="precision-input h-8"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="scaleStrokes" className="text-xs">Scale Strokes</Label>
                  <Switch
                    id="scaleStrokes"
                    checked={style.scaleStrokes}
                    onCheckedChange={(checked) => onStyleChange?.({ ...style, scaleStrokes: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}