import type { DuelPoint, PlayerProfile, PlayerRole, Zone } from '@pk/shared';
import { PICK_CLOCK_SECONDS, teamWinnerForClient } from '@pk/shared';

export type OnlineTeamPhase = 'PICK' | 'REVEAL' | 'RESOLVE' | 'NEXT_TURN';

export interface OnlineTeamSnapshot {
  turnIndex: number;
  totalTurns: number;
  playerRole: PlayerRole;
  yourRole: 'shooter' | 'keeper' | 'spectator';
  phase: OnlineTeamPhase;
  score: { player: number; opponent: number };
  pickClock: number;
  playerPick: Zone | null;
  hoverZone: Zone | null;
  kickZone: Zone | null;
  keepZone: Zone | null;
  lastPoint: DuelPoint | null;
  isComplete: boolean;
  winner: 'player' | 'opponent' | 'draw' | null;
  showGrid: boolean;
  resolveTimer: number;
  nextTurnTimer: number;
  playerLocked: boolean;
  opponentLocked: boolean;
  activeKicker: PlayerProfile | null;
  activeKeeper: PlayerProfile | null;
  teamLeg: 'first' | 'second';
  teamNameA: string;
  teamNameB: string;
}

export interface OnlineTeamStateConfig {
  onSubmitPick: (zone: Zone) => void;
  onTurnResolved: (snap: OnlineTeamSnapshot) => void;
  onMatchComplete: (snap: OnlineTeamSnapshot) => void;
}

const RESOLVE_DURATION = 1.8;
const NEXT_TURN_DURATION = 0.8;
const REVEAL_DURATION = 1.2;

export function createOnlineTeamSnapshot(): OnlineTeamSnapshot {
  return {
    turnIndex: 1,
    totalTurns: 1,
    playerRole: 'shooter',
    yourRole: 'spectator',
    phase: 'PICK',
    score: { player: 0, opponent: 0 },
    pickClock: PICK_CLOCK_SECONDS,
    playerPick: null,
    hoverZone: null,
    kickZone: null,
    keepZone: null,
    lastPoint: null,
    isComplete: false,
    winner: null,
    showGrid: true,
    resolveTimer: 0,
    nextTurnTimer: 0,
    playerLocked: false,
    opponentLocked: false,
    activeKicker: null,
    activeKeeper: null,
    teamLeg: 'first',
    teamNameA: 'Your Team',
    teamNameB: 'Opponents',
  };
}

export class OnlineTeamStateMachine {
  snapshot: OnlineTeamSnapshot;
  private config: OnlineTeamStateConfig;
  private revealTimer = 0;

  constructor(config: OnlineTeamStateConfig) {
    this.config = config;
    this.snapshot = createOnlineTeamSnapshot();
  }

  initFromTurnStart(payload: {
    turnIndex: number;
    totalTurns: number;
    leg: 'first' | 'second';
    teamAScore: number;
    teamBScore: number;
    teamNameA: string;
    teamNameB: string;
    activeKicker: PlayerProfile;
    activeKeeper: PlayerProfile;
    yourRole: 'shooter' | 'keeper' | 'spectator';
  }): void {
    const s = this.snapshot;
    s.turnIndex = payload.turnIndex;
    s.totalTurns = payload.totalTurns;
    s.teamLeg = payload.leg;
    s.score = { player: payload.teamAScore, opponent: payload.teamBScore };
    s.teamNameA = payload.teamNameA;
    s.teamNameB = payload.teamNameB;
    s.activeKicker = payload.activeKicker;
    s.activeKeeper = payload.activeKeeper;
    s.yourRole = payload.yourRole;
    s.playerRole =
      payload.yourRole === 'spectator' ? 'shooter' : payload.yourRole;
    s.phase = 'PICK';
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
    const s = this.snapshot;
    if (s.phase === 'PICK' && !s.playerLocked && s.yourRole !== 'spectator') {
      s.hoverZone = zone;
    }
  }

  pickZone(zone: Zone): boolean {
    const s = this.snapshot;
    if (s.phase !== 'PICK' || s.playerLocked || s.yourRole === 'spectator') {
      return false;
    }
    s.playerPick = zone;
    s.hoverZone = zone;
    s.playerLocked = true;
    this.config.onSubmitPick(zone);
    return true;
  }

  applyTurnResult(payload: {
    kickZone: Zone;
    keepZone: Zone;
    point: DuelPoint;
    teamAScore: number;
    teamBScore: number;
  }): void {
    const s = this.snapshot;
    s.kickZone = payload.kickZone;
    s.keepZone = payload.keepZone;
    s.lastPoint = payload.point;
    s.score = { player: payload.teamAScore, opponent: payload.teamBScore };
    s.phase = 'REVEAL';
    s.opponentLocked = true;
    s.showGrid = true;
    this.revealTimer = REVEAL_DURATION;
  }

  finishMatch(payload: {
    teamAScore: number;
    teamBScore: number;
    winner: 'A' | 'B' | 'draw';
    teamNameA: string;
    teamNameB: string;
  }): void {
    const s = this.snapshot;
    s.isComplete = true;
    s.score = { player: payload.teamAScore, opponent: payload.teamBScore };
    s.teamNameA = payload.teamNameA;
    s.teamNameB = payload.teamNameB;
    s.winner = teamWinnerForClient(payload.winner);
    s.phase = 'RESOLVE';
    this.config.onMatchComplete({ ...s });
  }
}
