import { useRef, useCallback } from "react";

type Point = [number, number, number]; // x, y, pressure

export function usePencilEvents(
  onStrokeComplete: (points: Point[]) => void
) {
  const pointsRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);

  const getPoint = useCallback((e: React.PointerEvent): Point => {
    const rect = (e.target as SVGSVGElement).closest("svg")!.getBoundingClientRect();
    return [
      e.clientX - rect.left,
      e.clientY - rect.top,
      e.pressure || 0.5,
    ];
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return; // Ignore finger touches on canvas
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    pointsRef.current = [getPoint(e)];
  }, [getPoint]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    pointsRef.current.push(getPoint(e));
  }, [getPoint]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;
    if (pointsRef.current.length > 0) {
      onStrokeComplete([...pointsRef.current]);
    }
    pointsRef.current = [];
  }, [onStrokeComplete]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    currentPoints: pointsRef,
    isDrawing: isDrawingRef,
  };
}
