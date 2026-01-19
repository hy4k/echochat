import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Download, RotateCcw, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface DrawingPoint {
  x: number;
  y: number;
}

interface Stroke {
  points: DrawingPoint[];
  color: string;
  brushSize: number;
  opacity: number;
}

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#d4af37");
  const [brushSize, setBrushSize] = useState(3);
  const [opacity, setOpacity] = useState(100);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Fill with dark background
    ctx.fillStyle = "#0f1419";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all strokes
    strokes.forEach((stroke) => {
      ctx.strokeStyle = stroke.color;
      ctx.globalAlpha = stroke.opacity / 100;
      ctx.lineWidth = stroke.brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }

        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1;
  }, [strokes]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentStroke((prev) => [...prev, { x, y }]);

    // Draw the current line
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity / 100;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (currentStroke.length === 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      const lastPoint = currentStroke[currentStroke.length - 1];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  const handleMouseUp = () => {
    if (isDrawing && currentStroke.length > 0) {
      setStrokes((prev) => [
        ...prev,
        {
          points: currentStroke,
          color,
          brushSize,
          opacity,
        },
      ]);
      setCurrentStroke([]);
    }
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0f1419";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `echochat-drawing-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/chat")}
            className="p-2 hover:bg-card rounded-lg transition-colors"
            title="Back to Chat"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-xl font-playfair">Shared Whiteboard</h1>
        </div>
        <div className="text-xs text-muted-foreground">Draw together in real-time</div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 bg-[#0f1419] rounded-lg overflow-hidden shadow-lg border border-border">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-full cursor-crosshair"
          />
        </div>

        {/* Tools Sidebar */}
        <div className="w-48 flex flex-col gap-4 bg-card rounded-lg p-4 border border-border">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border border-border"
              />
              <span className="text-xs font-mono">{color}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              Brush Size: {brushSize}px
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              Opacity: {opacity}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Actions</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleUndo}
                variant="outline"
                size="sm"
                className="w-full justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Undo
              </Button>
              <Button
                onClick={handleClear}
                variant="destructive"
                size="sm"
                className="w-full justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
              <Button
                onClick={handleDownload}
                variant="default"
                size="sm"
                className="w-full justify-center gap-2 bg-accent hover:bg-accent/90"
              >
                <Download className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-auto">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Draw together in real-time. Your strokes sync instantly to share your creativity and brainstorm ideas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
