import type { DuelPoint, PlayerRole, Zone } from '@pk/shared';
import {
  PICK_CLOCK_SECONDS,
  scoreForClient,
  winnerForClient,
  type MatchSide,
} from '@pk/shared';

export type OnlinePhase = 'PICK' | 'REVEAL' | 'RESOLVE' | 'NEXT_TURN';

export interface OnlineSnapshot {
  round: number;
  playerRole: PlayerRole;
  phase: OnlinePhase;
  score: { player: number; opponent: number };
  pickClock: number;
  playerPick: Zone | null;
  hoverZone: Zone | null;
  kickZone: Zone | null;
  keepZone: Zone | null;
  lastPoint: DuelPoint | null;
  isSuddenDeath: boolean;
  isComplete: boolean;
  winner: 'player' | 'opponent' | 'draw' | null;
  showGrid: boolean;
  resolveTimer: number;
  nextTurnTimer: number;
  playerLocked: boolean;
  opponentLocked: boolean;
}

export interface OnlineStateConfig {
  localSide: MatchSide;
  onSubmitPick: (zone: Zone) => void;
  onTurnResolved: (snap: OnlineSnapshot) => void;
  onMatchComplete: (snap: OnlineSnapshot) => void;
}

const RESOLVE_DURATION = 1.8;
const NEXT_TURN_DURATION = 0.8;
const REVEAL_DURATION = 1.2;

export function createOnlineSnapshot(role: PlayerRole = 'shooter'): OnlineSnapshot {
  return {
    round: 1,
    playerRole: role,
    phase: 'PICK',
    score: { player: 0, opponent: 0 },
    pickClock: PICK_CLOCK_SECONDS,
    playerPick: null,
    hoverZone: null,
    kickZone: null,
    keepZone: null,
    lastPoint: null,
    isSuddenDeath: false,
    isComplete: false,
    winner: null,
    showGrid: true,
    resolveTimer: 0,
    nextTurnTimer: 0,
    playerLocked: false,
    opponentLocked: false,
  };
}

export class OnlineStateMachine {
  snapshot: OnlineSnapshot;
  private config: OnlineStateConfig;
  private revealTimer = 0;

  constructor(config: OnlineStateConfig) {
    this.config = config;
    this.snapshot = createOnlineSnapshot();
  }

  initFromMatchStart(
    round: number,
    role: PlayerRole,
    score: { host: number; guest: number },
    isSuddenDeath = false,
  ): void {
    const s = this.snapshot;
    s.round = round;
    s.playerRole = role;
    s.phase = 'PICK';
    s.score = scoreForClient(this.config.localSide, score);
    s.isSuddenDeath = isSuddenDeath;
    s.pickClock = PICK_CLOCK_SECONDS;
    s.playerPick = null;
    s.hoverZone = null;
    s.kickZone = null;
    s.keepZone = null;
    s.lastPoint = null;
    s.playerLocked = false;
    s.opponentLocked = false;
    s.showGrid = true;
  }

  update(dt: number): void {
    const s = this.snapshot;
    if (s.isComplete) return;

    if (s.phase === 'PICK') {
      s.pickClock = Math.max(0, s.pickClock - dt);
    }

    if (s.phase === 'REVEAL') {
      this.revealTimer -= dt;
      if (this.revealTimer <= 0) {
        s.phase = 'RESOLVE';
        s.resolveTimer = RESOLVE_DURATION;
        this.config.onTurnResolved({ ...s });
      }
    }

    if (s.phase === 'RESOLVE') {
      s.resolveTimer -= dt;
      if (s.resolveTimer <= 0) {
        s.phase = 'NEXT_TURN';
        s.nextTurnTimer = NEXT_TURN_DURATION;
      }
    }

    if (s.phase === 'NEXT_TURN') {
      s.nextTurnTimer -= dt;
      if (s.nextTurnTimer <= 0) {
        s.phase = 'PICK';
        s.lastPoint = null;
        s.playerPick = null;
        s.hoverZone = null;
        s.kickZone = null;
        s.keepZone = null;
        s.pickClock = PICK_CLOCK_SECONDS;
        s.playerLocked = false;
        s.opponentLocked = false;
        s.showGrid = true;
      }
    }
  }

  setHoverZone(zone: Zone | null): void {
    if (this.snapshot.phase === 'PICK' && !this.snapshot.playerLocked) {
      this.snapshot.hoverZone = zone;
    }
  }

  pickZone(zone: Zone): boolean {
    const s = this.snapshot;
    if (s.phase !== 'PICK' || s.playerLocked) return false;
    s.playerPick = zone;
    s.hoverZone = zone;
    s.playerLocked = true;
    this.config.onSubmitPick(zone);
    return true;
  }

  applyTurnResult(payload: {
    round: number;
    kickZone: Zone;
    keepZone: Zone;
    point: DuelPoint;
    score: { host: number; guest: number };
    kicker: MatchSide;
    nextKicker: MatchSide | null;
    isSuddenDeath: boolean;
  }): void {
    const s = this.snapshot;
    s.kickZone = payload.kickZone;
    s.keepZone = payload.keepZone;
    s.lastPoint = payload.point;
    s.score = scoreForClient(this.config.localSide, payload.score);
    s.isSuddenDeath = payload.isSuddenDeath;
    s.round = payload.round;
    s.phase = 'REVEAL';
    s.opponentLocked = true;
    s.showGrid = true;
    this.revealTimer = REVEAL_DURATION;

    if (payload.nextKicker) {
      s.playerRole =
        payload.nextKicker === this.config.localSide ? 'shooter' : 'keeper';
    }
  }

  finishMatch(score: { host: number; guest: number }, winner: MatchSide | 'draw'): void {
    const s = this.snapshot;
    s.isComplete = true;
    s.score = scoreForClient(this.config.localSide, score);
    s.winner = winnerForClient(this.config.localSide, winner);
    s.phase = 'RESOLVE';
    this.config.onMatchComplete({ ...s });
  }
}
