import { getStroke } from "perfect-freehand";

export function getSvgPathFromStroke(points: number[][]): string {
  if (points.length < 2) return "";

  const d: string[] = [];
  d.push(`M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`);

  for (let i = 1; i < points.length - 1; i++) {
    const cp = points[i];
    const next = points[i + 1];
    const midX = (cp[0] + next[0]) / 2;
    const midY = (cp[1] + next[1]) / 2;
    d.push(`Q ${cp[0].toFixed(2)} ${cp[1].toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`);
  }

  const last = points[points.length - 1];
  d.push(`L ${last[0].toFixed(2)} ${last[1].toFixed(2)}`);
  d.push("Z");

  return d.join(" ");
}

export function pointsToPath(
  inputPoints: [number, number, number][],
  size: number
): string {
  const outlinePoints = getStroke(inputPoints, {
    size,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  });
  return getSvgPathFromStroke(outlinePoints);
}
