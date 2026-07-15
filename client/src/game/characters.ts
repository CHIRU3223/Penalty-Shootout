import type { KeeperState } from './keeper';
import type { StrikerState } from './striker';

export interface CharacterColors {
  jersey: string;
  jerseyDark: string;
  shorts: string;
  skin: string;
  gloves: string;
}

const PLAYER_COLORS: CharacterColors = {
  jersey: '#2563eb',
  jerseyDark: '#1d4ed8',
  shorts: '#1e293b',
  skin: '#fbbf9b',
  gloves: '#facc15',
};

const OPPONENT_COLORS: CharacterColors = {
  jersey: '#dc2626',
  jerseyDark: '#b91c1c',
  shorts: '#1e293b',
  skin: '#fbbf9b',
  gloves: '#facc15',
};

const KEEPER_COLORS: CharacterColors = {
  jersey: '#f97316',
  jerseyDark: '#ea580c',
  shorts: '#1e293b',
  skin: '#fbbf9b',
  gloves: '#fef08a',
};

export function drawStriker(ctx: CanvasRenderingContext2D, striker: StrikerState): void {
  const colors = striker.isPlayer ? PLAYER_COLORS : OPPONENT_COLORS;
  const s = striker.scale;
  const { x, y, pose, kickProgress, idlePhase } = striker;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  const bounce = pose === 'idle' ? Math.sin(idlePhase) * 1.5 : 0;
  ctx.translate(0, bounce);

  let legAngle = 0;
  let torsoLean = 0;
  if (pose === 'aiming') {
    legAngle = -0.15;
    torsoLean = 0.05;
  } else if (pose === 'windup') {
    legAngle = -0.55;
    torsoLean = -0.08;
  } else if (pose === 'kick') {
    legAngle = -0.55 + kickProgress * 1.1;
    torsoLean = -0.08 + kickProgress * 0.15;
  }

  drawLeg(ctx, -8, 18, 0.08, colors.shorts, colors.skin);
  drawLeg(ctx, 8, 18, legAngle, colors.shorts, colors.skin);

  ctx.save();
  ctx.rotate(torsoLean);
  drawTorso(ctx, colors);
  drawHead(ctx, colors.skin);
  drawArm(ctx, -16, -2, -0.6, colors);
  drawArm(ctx, 16, -2, 0.4, colors);
  ctx.restore();

  ctx.restore();
}

export function drawGoalkeeper(
  ctx: CanvasRenderingContext2D,
  keeper: KeeperState,
  isPlayer: boolean,
): void {
  const colors = KEEPER_COLORS;
  const { x, y, w, h, diving, progress, lean } = keeper;
  const cx = x + w / 2;
  const cy = y + h / 2;

  ctx.save();
  ctx.translate(cx, cy);

  if (diving) {
    const diveT = progress;
    const diveAngle = lean * 1.2 * diveT;
    ctx.rotate(diveAngle);
    ctx.translate(lean * w * 0.3 * diveT, h * 0.1 * diveT);
    drawKeeperDiving(ctx, w, h, colors, lean);
  } else {
    const bounce = Math.sin(Date.now() * 0.003) * 2;
    ctx.translate(0, bounce);
    drawKeeperReady(ctx, w, h, colors, isPlayer);
  }

  ctx.restore();
}

function drawKeeperReady(
  ctx: CanvasRenderingContext2D,
  w: number,
  _h: number,
  colors: CharacterColors,
  isPlayer: boolean,
): void {
  const scale = w / 80;

  drawLeg(ctx, -10 * scale, 22 * scale, 0.2, colors.shorts, colors.skin);
  drawLeg(ctx, 10 * scale, 22 * scale, -0.2, colors.shorts, colors.skin);

  ctx.fillStyle = colors.jersey;
  ctx.beginPath();
  ctx.roundRect(-18 * scale, -8 * scale, 36 * scale, 32 * scale, 6 * scale);
  ctx.fill();

  ctx.fillStyle = colors.jerseyDark;
  ctx.fillRect(-18 * scale, -8 * scale, 36 * scale, 8 * scale);

  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(0, -18 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.fill();

  drawGlove(ctx, -28 * scale, -4 * scale, colors.gloves, -0.4);
  drawGlove(ctx, 28 * scale, -4 * scale, colors.gloves, 0.4);

  if (isPlayer) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `bold ${9 * scale}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('YOU', 0, 38 * scale);
  }
}

function drawKeeperDiving(
  ctx: CanvasRenderingContext2D,
  w: number,
  _h: number,
  colors: CharacterColors,
  lean: number,
): void {
  const scale = w / 80;
  const dir = lean >= 0 ? 1 : -1;

  ctx.fillStyle = colors.jersey;
  ctx.beginPath();
  ctx.ellipse(0, 0, 30 * scale, 12 * scale, dir * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(dir * 22 * scale, -6 * scale, 8 * scale, 0, Math.PI * 2);
  ctx.fill();

  drawGlove(ctx, dir * 32 * scale, 0, colors.gloves, dir * 0.5);

  ctx.fillStyle = colors.shorts;
  ctx.fillRect(-dir * 8 * scale, 8 * scale, 20 * scale, 10 * scale);
  ctx.fillRect(dir * 4 * scale, 10 * scale, 16 * scale, 8 * scale);
}

function drawTorso(ctx: CanvasRenderingContext2D, colors: CharacterColors): void {
  ctx.fillStyle = colors.jersey;
  ctx.beginPath();
  ctx.roundRect(-14, -28, 28, 34, 5);
  ctx.fill();
  ctx.fillStyle = colors.jerseyDark;
  ctx.fillRect(-14, -28, 28, 8);
}

function drawHead(ctx: CanvasRenderingContext2D, skin: string): void {
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -38, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a3728';
  ctx.beginPath();
  ctx.arc(0, -42, 11, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fill();
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  angle: number,
  colors: CharacterColors,
): void {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(angle);
  ctx.fillStyle = colors.jersey;
  ctx.fillRect(-4, 0, 8, 18);
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(0, 20, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLeg(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  angle: number,
  shorts: string,
  skin: string,
): void {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(angle);
  ctx.fillStyle = shorts;
  ctx.fillRect(-5, 0, 10, 14);
  ctx.fillStyle = skin;
  ctx.fillRect(-4, 14, 8, 16);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-6, 28, 12, 6);
  ctx.restore();
}

function drawGlove(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  angle: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
