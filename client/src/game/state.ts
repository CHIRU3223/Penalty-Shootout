import type { DifficultyConfig, DuelPoint, PlayerProfile, PlayerRole, Zone } from '@pk/shared';
import {
  computeZoneDuel,
  duelPointLabel,
  MAX_DUELS,
  PICK_CLOCK_SECONDS,
} from '@pk/shared';

export type GamePhase = 'PICK' | 'REVEAL' | 'RESOLVE' | 'NEXT_TURN';

export interface DuelScore {
  player: number;
  opponent: number;
}

export interface TurnSnapshot {
  round: number;
  playerRole: PlayerRole;
  phase: GamePhase;
  score: DuelScore;
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
  activeKicker: PlayerProfile;
  activeKeeper: PlayerProfile;
  sdPairPlayerWon: boolean | null;
  sdPairOpponentWon: boolean | null;
}

export interface StateMachineConfig {
  difficulty: DifficultyConfig;
  playerProfile: PlayerProfile;
  opponentProfile: PlayerProfile;
  onTurnResolved: (snapshot: TurnSnapshot) => void;
  onMatchComplete: (snapshot: TurnSnapshot) => void;
  pickOpponentZone: (role: PlayerRole) => Zone;
  /** When true, match ends after the first duel resolves */
  singleDuel?: boolean;
}

const RESOLVE_DURATION = 1.8;
const NEXT_TURN_DURATION = 0.8;
const REVEAL_DURATION = 1.2;

export function createInitialSnapshot(
  kicker: PlayerProfile,
  keeper: PlayerProfile,
): TurnSnapshot {
  return {
    round: 1,
    playerRole: 'shooter',
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
    activeKicker: kicker,
    activeKeeper: keeper,
    sdPairPlayerWon: null,
    sdPairOpponentWon: null,
  };
}

export class GameStateMachine {
  snapshot: TurnSnapshot;
  private config: StateMachineConfig;
  private revealTimer = 0;

  constructor(config: StateMachineConfig) {
    this.config = config;
    this.snapshot = createInitialSnapshot(
      config.playerProfile,
      config.opponentProfile,
    );
  }

  reset(): void {
    this.snapshot = createInitialSnapshot(
      this.config.playerProfile,
      this.config.opponentProfile,
    );
    this.revealTimer = 0;
  }

  updateConfig(config: Partial<StateMachineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  update(dt: number): void {
    const s = this.snapshot;
    if (s.isComplete) return;

    if (s.phase === 'PICK') {
      s.pickClock = Math.max(0, s.pickClock - dt);
      if (s.pickClock <= 0) {
        this.finalizePicks();
      }
    }

    if (s.phase === 'REVEAL') {
      this.revealTimer -= dt;
      if (this.revealTimer <= 0) {
        this.resolveDuel();
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
        this.advanceTurn();
      }
    }
  }

  setHoverZone(zone: Zone | null): void {
    if (this.snapshot.phase === 'PICK' && !this.snapshot.playerLocked) {
      this.snapshot.hoverZone = zone;
    }
  }

  /** Player taps a grid cell during PICK phase */
  pickZone(zone: Zone): boolean {
    const s = this.snapshot;
    if (s.isComplete || s.phase !== 'PICK' || s.playerLocked) return false;

    s.playerPick = zone;
    s.hoverZone = zone;
    s.playerLocked = true;

    if (!s.opponentLocked) {
      this.pickOpponentZone();
    }

    if (s.playerLocked && s.opponentLocked) {
      this.startReveal();
    }
    return true;
  }

  private pickOpponentZone(): void {
    const s = this.snapshot;
    const oppRole = s.playerRole === 'shooter' ? 'keeper' : 'shooter';
    const zone = this.config.pickOpponentZone(oppRole);
    if (s.playerRole === 'shooter') {
      s.keepZone = zone;
    } else {
      s.kickZone = zone;
    }
    s.opponentLocked = true;
  }

  private finalizePicks(): void {
    const s = this.snapshot;
    if (!s.playerLocked) {
      const zone = (s.playerPick ?? s.hoverZone ?? (4 as Zone)) as Zone;
      s.playerPick = zone;
      if (s.playerRole === 'shooter') s.kickZone = zone;
      else s.keepZone = zone;
      s.playerLocked = true;
    }
    if (!s.opponentLocked) {
      this.pickOpponentZone();
    }
    this.startReveal();
  }

  private startReveal(): void {
    const s = this.snapshot;
    if (s.playerRole === 'shooter') {
      s.kickZone = s.playerPick;
    } else {
      s.keepZone = s.playerPick;
    }
    s.phase = 'REVEAL';
    s.showGrid = true;
    this.revealTimer = REVEAL_DURATION;
  }

  private resolveDuel(): void {
    const s = this.snapshot;
    const kick = s.kickZone ?? (4 as Zone);
    const keep = s.keepZone ?? (4 as Zone);
    const winner = computeZoneDuel(kick, keep);
    s.lastPoint = duelPointLabel(winner);

    const playerGotPoint =
      (winner === 'kicker' && s.playerRole === 'shooter') ||
      (winner === 'keeper' && s.playerRole === 'keeper');

    if (s.isSuddenDeath) {
      if (s.playerRole === 'shooter') {
        s.sdPairPlayerWon = winner === 'kicker';
      } else {
        s.sdPairOpponentWon = winner === 'kicker';
      }
    } else if (playerGotPoint) {
      s.score.player += 1;
    } else {
      s.score.opponent += 1;
    }

    s.phase = 'RESOLVE';
    s.resolveTimer = RESOLVE_DURATION;
    this.config.onTurnResolved({ ...s });

    if (!this.config.singleDuel) {
      this.checkMatchEnd();
    }
  }

  private advanceTurn(): void {
    const s = this.snapshot;
    if (s.isComplete) return;

    if (this.config.singleDuel) {
      this.config.onMatchComplete({ ...s });
      return;
    }

    if (!s.isSuddenDeath) {
      s.round += 1;
      if (s.round > MAX_DUELS) {
        if (s.score.player === s.score.opponent) {
          s.isSuddenDeath = true;
          s.round = MAX_DUELS + 1;
        } else {
          this.finishMatch();
          return;
        }
      }
    } else {
      s.round += 1;
      if (s.sdPairPlayerWon !== null && s.sdPairOpponentWon !== null) {
        const playerSdWin = s.sdPairPlayerWon && !s.sdPairOpponentWon;
        const oppSdWin = s.sdPairOpponentWon && !s.sdPairPlayerWon;
        if (playerSdWin || oppSdWin) {
          if (playerSdWin) s.score.player += 1;
          if (oppSdWin) s.score.opponent += 1;
          this.finishMatch();
          return;
        }
        s.sdPairPlayerWon = null;
        s.sdPairOpponentWon = null;
      }
    }

    s.playerRole = s.playerRole === 'shooter' ? 'keeper' : 'shooter';
    if (s.playerRole === 'shooter') {
      s.activeKicker = this.config.playerProfile;
      s.activeKeeper = this.config.opponentProfile;
    } else {
      s.activeKicker = this.config.opponentProfile;
      s.activeKeeper = this.config.playerProfile;
    }

    s.phase = 'PICK';
    s.playerPick = null;
    s.hoverZone = null;
    s.kickZone = null;
    s.keepZone = null;
    s.pickClock = PICK_CLOCK_SECONDS;
    s.lastPoint = null;
    s.playerLocked = false;
    s.opponentLocked = false;
    s.showGrid = true;
    s.resolveTimer = 0;
    s.nextTurnTimer = 0;
  }

  private checkMatchEnd(): void {
    const s = this.snapshot;
    if (s.isSuddenDeath) return;
    const remaining = MAX_DUELS - s.round;
    const playerLead = s.score.player - s.score.opponent;
    const opponentLead = s.score.opponent - s.score.player;
    if (playerLead > remaining || opponentLead > remaining) {
      this.finishMatch();
    }
  }

  private finishMatch(): void {
    const s = this.snapshot;
    s.isComplete = true;
    if (s.score.player > s.score.opponent) s.winner = 'player';
    else if (s.score.opponent > s.score.player) s.winner = 'opponent';
    else s.winner = 'draw';
    this.config.onMatchComplete({ ...s });
  }
}
