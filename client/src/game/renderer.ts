import type { DuelPoint, Zone } from '@pk/shared';
import type { BallState } from './ball';
import { drawGoalkeeper, drawStriker } from './characters';
import type { Layout } from './geometry';
import { zoneCenter } from './geometry';
import type { KeeperState } from './keeper';
import type { StrikerState } from './striker';

export interface DuelRenderState {
  phase: string;
  playerRole: 'shooter' | 'keeper';
  playerPick: Zone | null;
  hoverZone: Zone | null;
  kickZone: Zone | null;
  keepZone: Zone | null;
  playerLocked: boolean;
  opponentLocked: boolean;
  showOpponentPick: boolean;
  lastPoint: DuelPoint | null;
  animating: boolean;
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  ball: BallState,
  keeper: KeeperState,
  striker: StrikerState,
  opponentStriker: StrikerState,
  state: DuelRenderState,
): void {
  if (layout.mode === 'shooter') {
    drawShooterScene(ctx, layout, ball, keeper, striker, opponentStriker, state);
  } else {
    drawKeeperScene(ctx, layout, ball, keeper, striker, opponentStriker, state);
  }
}

function kickerStriker(
  state: DuelRenderState,
  striker: StrikerState,
  opponentStriker: StrikerState,
): StrikerState {
  return state.playerRole === 'shooter' ? striker : opponentStriker;
}

function drawShooterScene(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  ball: BallState,
  keeper: KeeperState,
  striker: StrikerState,
  opponentStriker: StrikerState,
  state: DuelRenderState,
): void {
  const { width, height } = layout;
  ctx.clearRect(0, 0, width, height);
  drawSky(ctx, width, height);
  drawPitch(ctx, layout);
  drawGoal(ctx, layout);
  drawZoneGrid(ctx, layout, state);
  drawGoalkeeper(ctx, keeper, false);
  drawStriker(ctx, kickerStriker(state, striker, opponentStriker));
  drawBallEntity(ctx, layout, ball);

  if (state.phase === 'RESOLVE' && state.lastPoint) {
    drawDuelResult(ctx, layout, state.lastPoint);
  }
}

function drawKeeperScene(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  ball: BallState,
  keeper: KeeperState,
  striker: StrikerState,
  opponentStriker: StrikerState,
  state: DuelRenderState,
): void {
  const { width, height } = layout;
  ctx.clearRect(0, 0, width, height);
  drawSky(ctx, width, height);
  drawDistantPitch(ctx, layout);
  drawStriker(ctx, kickerStriker(state, striker, opponentStriker));
  drawGoal(ctx, layout);
  drawZoneGrid(ctx, layout, state);
  drawGoalkeeper(ctx, keeper, true);
  drawBallEntity(ctx, layout, ball);

  if (state.phase === 'RESOLVE' && state.lastPoint) {
    drawDuelResult(ctx, layout, state.lastPoint);
  }
}

function drawBallEntity(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  ball: BallState,
): void {
  if (ball.active) {
    drawBallTrail(ctx, ball, layout.ballRadius);
    drawBall(ctx, ball.x, ball.y, layout.ballRadius);
  } else {
    drawBall(ctx, layout.spotX, layout.spotY + layout.ballRadius * 0.5, layout.ballRadius);
  }
}

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  grad.addColorStop(0, '#0c1929');
  grad.addColorStop(0.5, '#1a2f4a');
  grad.addColorStop(1, '#1e3a2f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawPitch(ctx: CanvasRenderingContext2D, layout: Layout): void {
  const { width, height, spotX, spotY } = layout;
  const pitchTop = height * 0.28;

  const grad = ctx.createLinearGradient(0, pitchTop, 0, height);
  grad.addColorStop(0, '#1a6b35');
  grad.addColorStop(1, '#134226');
  ctx.fillStyle = grad;
  ctx.fillRect(0, pitchTop, width, height - pitchTop);

  ctx.strokeStyle = 'rgba(232,245,233,0.2)';
  ctx.lineWidth = 1.5;
  const lineLeft = layout.goalX;
  const lineRight = layout.goalX + layout.goalW;
  for (let i = 0; i < 8; i++) {
    const y = pitchTop + ((height - pitchTop) / 8) * i;
    ctx.beginPath();
    ctx.moveTo(lineLeft, y);
    ctx.lineTo(lineRight, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(spotX, spotY + 6, 32, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(spotX, spotY, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawDistantPitch(ctx: CanvasRenderingContext2D, layout: Layout): void {
  const { width, height, spotX, spotY } = layout;
  const grad = ctx.createLinearGradient(0, 0, 0, height * 0.55);
  grad.addColorStop(0, '#1a5c2e');
  grad.addColorStop(1, '#134226');
  ctx.fillStyle = grad;
  ctx.fillRect(0, height * 0.08, width, height * 0.5);

  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(spotX, spotY, 14, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGoal(ctx: CanvasRenderingContext2D, layout: Layout): void {
  const { goalX, goalY, goalW, goalH } = layout;

  ctx.fillStyle = 'rgba(15,23,42,0.4)';
  ctx.fillRect(goalX - 6, goalY - 4, goalW + 12, goalH + 8);

  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 5;
  ctx.strokeRect(goalX, goalY, goalW, goalH);

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  const rows = 6;
  const cols = 12;
  for (let r = 0; r <= rows; r++) {
    const y = goalY + (goalH / rows) * r;
    ctx.beginPath();
    ctx.moveTo(goalX, y);
    ctx.lineTo(goalX + goalW, y);
    ctx.stroke();
  }
  for (let c = 0; c <= cols; c++) {
    const x = goalX + (goalW / cols) * c;
    ctx.beginPath();
    ctx.moveTo(x, goalY);
    ctx.lineTo(x, goalY + goalH);
    ctx.stroke();
  }
}

function drawZoneGrid(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  state: DuelRenderState,
): void {
  const gridAlpha = state.animating ? 0.55 : 1;

  const playerZone =
    state.phase === 'PICK'
      ? state.playerPick ?? state.hoverZone
      : state.playerRole === 'shooter'
        ? state.kickZone
        : state.keepZone;

  const opponentZone = state.showOpponentPick
    ? state.playerRole === 'shooter'
      ? state.keepZone
      : state.kickZone
    : null;

  ctx.save();
  ctx.globalAlpha = gridAlpha;

  for (let z = 0; z < 9; z++) {
    const zone = z as Zone;
    const col = zone % 3;
    const row = Math.floor(zone / 3);
    const cellW = layout.goalW / 3;
    const cellH = layout.goalH / 3;
    const x = layout.goalX + col * cellW;
    const y = layout.goalY + row * cellH;
    const pad = 6;

    const isPlayer = playerZone === zone;
    const isOpponent = opponentZone === zone;
    const isMatch =
      state.showOpponentPick &&
      state.kickZone !== null &&
      state.keepZone !== null &&
      state.kickZone === state.keepZone &&
      state.kickZone === zone;

    ctx.fillStyle = isMatch
      ? 'rgba(34,197,94,0.45)'
      : isPlayer
        ? 'rgba(59,130,246,0.45)'
        : isOpponent
          ? 'rgba(248,113,113,0.4)'
          : 'rgba(255,255,255,0.08)';
    ctx.fillRect(x + pad, y + pad, cellW - pad * 2, cellH - pad * 2);

    ctx.strokeStyle = isPlayer
      ? '#3b82f6'
      : isOpponent
        ? '#f87171'
        : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = isPlayer || isOpponent ? 2.5 : 1;
    ctx.strokeRect(x + pad, y + pad, cellW - pad * 2, cellH - pad * 2);

    if (isPlayer && state.phase === 'PICK' && !state.playerLocked) {
      drawPickHint(ctx, x + cellW / 2, y + cellH / 2);
    }
  }

  ctx.restore();

  if (state.phase === 'PICK') {
    drawPickStatus(ctx, layout, state);
  }

  if (state.showOpponentPick && state.kickZone !== null && state.keepZone !== null) {
    drawRevealMarkers(ctx, layout, state.kickZone, state.keepZone);
  }
}

function drawPickHint(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = 'rgba(250,204,21,0.7)';
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawPickStatus(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  state: DuelRenderState,
): void {
  const status = state.playerLocked
    ? state.opponentLocked
      ? 'Both locked — revealing…'
      : 'Locked — waiting for opponent…'
    : state.playerRole === 'shooter'
      ? 'Tap a zone to aim your kick'
      : 'Tap a zone to dive';

  ctx.fillStyle = 'rgba(15,23,42,0.75)';
  ctx.beginPath();
  ctx.roundRect(layout.width / 2 - 160, layout.height - 56, 320, 36, 8);
  ctx.fill();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '13px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(status, layout.width / 2, layout.height - 32);
}

function drawRevealMarkers(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  kickZone: Zone,
  keepZone: Zone,
): void {
  const kick = zoneCenter(layout, kickZone);
  const keep = zoneCenter(layout, keepZone);

  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 11px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KICK', kick.x, kick.y - 14);

  ctx.fillStyle = '#f87171';
  ctx.fillText('KEEP', keep.x, keep.y + 18);
}

function drawBallTrail(ctx: CanvasRenderingContext2D, ball: BallState, radius: number): void {
  for (const point of ball.trail) {
    ctx.fillStyle = `rgba(255,255,255,${point.alpha * 0.35})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 1, x, y, radius);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, '#e2e8f0');
  grad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0.2, Math.PI * 0.8);
  ctx.stroke();
}

function drawDuelResult(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  point: DuelPoint,
): void {
  const isKicker = point === 'KICKER_POINT';
  const color = isKicker ? 'rgba(34,197,94,' : 'rgba(59,130,246,';
  ctx.fillStyle = `${color}0.2)`;
  ctx.fillRect(0, 0, layout.width, layout.height);

  ctx.fillStyle = isKicker ? '#86efac' : '#93c5fd';
  ctx.font = 'bold 28px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    isKicker ? 'KICKER POINT' : 'KEEPER POINT',
    layout.width / 2,
    layout.height * 0.42,
  );
}

export function drawDuelFlash(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  point: DuelPoint,
  alpha: number,
): void {
  const isKicker = point === 'KICKER_POINT';
  const color = isKicker ? 'rgba(34,197,94,' : 'rgba(59,130,246,';
  ctx.fillStyle = `${color}${alpha * 0.25})`;
  ctx.fillRect(0, 0, layout.width, layout.height);
}
