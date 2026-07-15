import type { Zone } from '@pk/shared';
import type { PlayerRole } from '@pk/shared';
import {
  type BallState,
  resetBall,
  startBallFlight,
  updateBall,
} from './ball';
import {
  type CameraState,
  setCameraRole,
} from './camera';
import type { Layout } from './geometry';
import { zoneCenter } from './geometry';
import {
  type KeeperState,
  resetKeeper,
  startKeeperDive,
  updateKeeper,
} from './keeper';
import {
  type StrikerState,
  resetStriker,
  setStrikerPose,
  startStrikerKick,
  updateStriker,
} from './striker';

export function syncCameraToRole(
  camera: CameraState,
  canvasWidth: number,
  canvasHeight: number,
  playerRole: PlayerRole,
  lastRole: { value: PlayerRole },
  onRoleChange: () => void,
): void {
  if (playerRole === lastRole.value) return;
  setCameraRole(camera, canvasWidth, canvasHeight, playerRole);
  lastRole.value = playerRole;
  onRoleChange();
}

export function triggerDuelAnimations(
  layout: Layout,
  ball: BallState,
  keeper: KeeperState,
  kickerStriker: StrikerState,
  kickZone: Zone,
  keepZone: Zone,
): void {
  const ballStartX = layout.spotX;
  const ballStartY = layout.spotY + layout.ballRadius * 0.5;
  const kickTarget = zoneCenter(layout, kickZone);
  const keepTarget = zoneCenter(layout, keepZone);

  startBallFlight(
    ball,
    ballStartX,
    ballStartY,
    kickZone,
    kickTarget.x,
    kickTarget.y,
    0.65,
  );
  startKeeperDive(keeper, keepZone, keepTarget.x, keepTarget.y);
  startStrikerKick(kickerStriker);
}

export function updateDuelEntities(
  ball: BallState,
  keeper: KeeperState,
  striker: StrikerState,
  opponentStriker: StrikerState,
  dt: number,
  animating: boolean,
): void {
  updateStriker(striker, dt);
  updateStriker(opponentStriker, dt);

  if (animating) {
    updateBall(ball, dt);
    updateKeeper(keeper, dt);
  }
}

export function resetDuelEntities(
  layout: Layout,
  ball: BallState,
  keeper: KeeperState,
  striker: StrikerState,
  opponentStriker: StrikerState,
): void {
  resetBall(ball, layout.spotX, layout.spotY + layout.ballRadius * 0.5);
  resetKeeper(keeper);
  resetStriker(striker);
  resetStriker(opponentStriker);
}

export function syncStrikerPoses(
  striker: StrikerState,
  opponentStriker: StrikerState,
  phase: string,
  playerRole: 'shooter' | 'keeper',
  playerPick: Zone | null,
  hoverZone: Zone | null,
  animating: boolean,
): void {
  if (animating) {
    if (playerRole === 'shooter') setStrikerPose(striker, 'kick');
    else setStrikerPose(opponentStriker, 'kick');
    return;
  }

  if (phase === 'PICK') {
    if (playerRole === 'shooter') {
      setStrikerPose(striker, playerPick !== null || hoverZone !== null ? 'aiming' : 'idle');
      setStrikerPose(opponentStriker, 'idle');
    } else {
      setStrikerPose(opponentStriker, 'windup');
      setStrikerPose(striker, 'idle');
    }
  } else {
    setStrikerPose(striker, 'idle');
    setStrikerPose(opponentStriker, 'idle');
  }
}

export function kickerUsesPlayerStriker(playerRole: 'shooter' | 'keeper'): boolean {
  return playerRole === 'shooter';
}

export interface DuelAnimState {
  animStarted: boolean;
}

export function handleDuelAnimUpdate(
  anim: DuelAnimState,
  layout: Layout,
  ball: BallState,
  keeper: KeeperState,
  striker: StrikerState,
  opponentStriker: StrikerState,
  snapshot: {
    phase: string;
    playerRole: 'shooter' | 'keeper';
    kickZone: Zone | null;
    keepZone: Zone | null;
    playerPick: Zone | null;
    hoverZone: Zone | null;
  },
  dt: number,
): void {
  const animating =
    snapshot.phase === 'REVEAL' ||
    snapshot.phase === 'RESOLVE' ||
    ball.active ||
    keeper.diving;

  if (
    snapshot.phase === 'REVEAL' &&
    !anim.animStarted &&
    snapshot.kickZone !== null &&
    snapshot.keepZone !== null
  ) {
    const kickerStriker = kickerUsesPlayerStriker(snapshot.playerRole)
      ? striker
      : opponentStriker;
    triggerDuelAnimations(
      layout,
      ball,
      keeper,
      kickerStriker,
      snapshot.kickZone,
      snapshot.keepZone,
    );
    anim.animStarted = true;
  }

  if (snapshot.phase === 'PICK') {
    if (anim.animStarted || ball.active || keeper.diving) {
      resetDuelEntities(layout, ball, keeper, striker, opponentStriker);
    }
    anim.animStarted = false;
  }

  updateDuelEntities(ball, keeper, striker, opponentStriker, dt, animating);
  syncStrikerPoses(
    striker,
    opponentStriker,
    snapshot.phase,
    snapshot.playerRole,
    snapshot.playerPick,
    snapshot.hoverZone,
    ball.active || keeper.diving,
  );
}
