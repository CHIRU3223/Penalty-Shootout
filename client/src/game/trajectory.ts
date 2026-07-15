export interface TrajectoryPoint {
  x: number;
  y: number;
}

export function computeArcHeight(
  startY: number,
  targetY: number,
  power: number,
): number {
  const base = Math.abs(startY - targetY) * 0.35 + 40;
  return base * (0.6 + power * 0.5);
}

export function computeBallPositionAt(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  power: number,
  t: number,
): TrajectoryPoint {
  const arcHeight = computeArcHeight(startY, targetY, power);
  const x = startX + (targetX - startX) * t;
  const baseY = startY + (targetY - startY) * t;
  const arc = Math.sin(Math.PI * t) * arcHeight;
  return { x, y: baseY - arc };
}

export function computePreviewPath(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  power: number,
  steps = 24,
): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push(computeBallPositionAt(startX, startY, targetX, targetY, power, t));
  }
  return points;
}

export function drawTrajectoryPreview(
  ctx: CanvasRenderingContext2D,
  points: TrajectoryPoint[],
  power: number,
  landingX: number,
  landingY: number,
): void {
  if (points.length < 2) return;

  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = power > 0.9 ? 'rgba(251,191,36,0.85)' : 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  const dotR = 10;
  ctx.fillStyle = power > 0.9 ? 'rgba(251,191,36,0.5)' : 'rgba(251,191,36,0.35)';
  ctx.beginPath();
  ctx.arc(landingX, landingY, dotR + 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(landingX, landingY, dotR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (power > 0.9) {
    ctx.fillStyle = 'rgba(239,68,68,0.75)';
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', landingX, landingY + 4);
  }

  ctx.restore();
}
