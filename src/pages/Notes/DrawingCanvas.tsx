import { useState, useEffect, useCallback, useRef } from "react";
import type { StrokeData } from "../../db.ts";
import { usePencilEvents } from "../../hooks/usePencilEvents.ts";
import { pointsToPath } from "../../utils/strokeUtils.ts";
import Button from "../../components/ui/Button.tsx";

const penColors = ["#e5e5e5", "#3b82f6", "#22c55e", "#f97066", "#a855f7", "#eab308"];
const penSizes = [3, 6, 10, 16];

interface DrawingCanvasProps {
  strokes: StrokeData[];
  onChange: (strokes: StrokeData[]) => void;
}

export default function DrawingCanvas({ strokes, onChange }: DrawingCanvasProps) {
  const [color, setColor] = useState(penColors[0]);
  const [size, setSize] = useState(penSizes[1]);
  const [erasing, setErasing] = useState(false);
  const [livePathD, setLivePathD] = useState("");
  const rafRef = useRef(0);

  const handleStrokeComplete = useCallback(
    (points: [number, number, number][]) => {
      if (erasing) return;
      const newStroke: StrokeData = { points, color, size };
      onChange([...strokes, newStroke]);
      setLivePathD("");
    },
    [strokes, onChange, color, size, erasing]
  );

  const { onPointerDown, onPointerMove, onPointerUp, currentPoints, isDrawing } =
    usePencilEvents(handleStrokeComplete);

  // Live preview with rAF
  useEffect(() => {
    function tick() {
      if (isDrawing.current && currentPoints.current.length > 1) {
        setLivePathD(pointsToPath(currentPoints.current, size));
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size, currentPoints, isDrawing]);

  function handleEraserClick(e: React.PointerEvent<SVGPathElement>, index: number) {
    if (!erasing) return;
    e.stopPropagation();
    const updated = strokes.filter((_, i) => i !== index);
    onChange(updated);
  }

  function undo() {
    if (strokes.length === 0) return;
    onChange(strokes.slice(0, -1));
  }

  function clear() {
    onChange([]);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-surface border-b border-border">
        <div className="flex gap-1">
          {penColors.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setErasing(false); }}
              className={`w-7 h-7 rounded-full transition-all ${
                color === c && !erasing ? "ring-2 ring-white scale-110" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        <div className="flex gap-1">
          {penSizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                size === s ? "bg-accent-blue/20" : "hover:bg-surface-hover"
              }`}
            >
              <div
                className="rounded-full bg-text"
                style={{ width: s, height: s }}
              />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        <Button
          variant={erasing ? "primary" : "ghost"}
          size="sm"
          onClick={() => setErasing(!erasing)}
        >
          Eraser
        </Button>
        <Button variant="ghost" size="sm" onClick={undo}>
          Undo
        </Button>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear
        </Button>
      </div>

      {/* Canvas */}
      <svg
        className="flex-1 bg-bg cursor-crosshair"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {strokes.map((stroke, i) => (
          <path
            key={i}
            d={pointsToPath(stroke.points, stroke.size)}
            fill={stroke.color}
            onPointerDown={(e) => handleEraserClick(e, i)}
            className={erasing ? "cursor-pointer hover:opacity-50" : ""}
          />
        ))}
        {livePathD && !erasing && (
          <path d={livePathD} fill={color} opacity={0.8} />
        )}
      </svg>
    </div>
  );
}
