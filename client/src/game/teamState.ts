import type { Difficulty, PlayerProfile } from '@pk/shared';
import {
  getDifficultyConfig,
  TEAM_KEEPS_PER_PLAYER,
  TEAM_KICKS_PER_PLAYER,
} from '@pk/shared';
import type { TurnSnapshot } from './state';
import { GameStateMachine } from './state';
import { createAiOpponent } from './ai';

export interface TeamTurnInfo {
  turnIndex: number;
  totalTurns: number;
  leg: 'first' | 'second';
  teamAScore: number;
  teamBScore: number;
  teamNameA: string;
  teamNameB: string;
  activeKicker: PlayerProfile;
  activeKeeper: PlayerProfile;
  playerControls: 'kicker' | 'keeper';
  duelLabel: string;
}

export interface TeamSnapshot extends TurnSnapshot {
  teamInfo: TeamTurnInfo;
}

export interface TeamMatchConfig {
  teamA: PlayerProfile[];
  teamB: PlayerProfile[];
  teamNameA: string;
  teamNameB: string;
  difficulty: Difficulty;
  onTurnResolved: (snap: TeamSnapshot) => void;
  onMatchComplete: (snap: TeamSnapshot) => void;
}

interface TurnSpec {
  kickerTeam: 'A' | 'B';
  slot: number;
  leg: 'first' | 'second';
  duelType: 'kick' | 'keep';
}

function buildTurnOrder(teamSize: number): TurnSpec[] {
  const turns: TurnSpec[] = [];

  const addLeg = (leg: 'first' | 'second', kickerTeam: 'A' | 'B') => {
    for (let slot = 0; slot < teamSize; slot++) {
      for (let i = 0; i < TEAM_KICKS_PER_PLAYER; i++) {
        turns.push({ kickerTeam, slot, leg, duelType: 'kick' });
      }
      const keeperTeam = kickerTeam === 'A' ? 'B' : 'A';
      for (let i = 0; i < TEAM_KEEPS_PER_PLAYER; i++) {
        turns.push({ kickerTeam: keeperTeam, slot, leg, duelType: 'keep' });
      }
    }
  };

  addLeg('first', 'A');
  addLeg('second', 'B');
  return turns;
}

export class TeamStateMachine {
  readonly duel: GameStateMachine;
  private teamA: PlayerProfile[];
  private teamB: PlayerProfile[];
  private teamNameA: string;
  private teamNameB: string;
  private turnOrder: TurnSpec[];
  private turnIndex = 0;
  private teamAScore = 0;
  private teamBScore = 0;
  private config: TeamMatchConfig;

  constructor(config: TeamMatchConfig) {
    this.config = config;
    this.teamA = config.teamA;
    this.teamB = config.teamB;
    this.teamNameA = config.teamNameA;
    this.teamNameB = config.teamNameB;
    this.turnOrder = buildTurnOrder(config.teamA.length);

    const first = this.currentPairing();
    const ai = createAiOpponent(config.difficulty);

    this.duel = new GameStateMachine({
      difficulty: getDifficultyConfig(config.difficulty),
      playerProfile: first.playerControls === 'kicker' ? first.kicker : first.keeper,
      opponentProfile: first.playerControls === 'kicker' ? first.keeper : first.kicker,
      pickOpponentZone: (role) => ai.pickZone(role),
      singleDuel: true,
      onTurnResolved: (snap) => this.handleTurnResolved(snap),
      onMatchComplete: () => this.tryAdvanceTeam(),
    });

    this.applyPairingToDuel(first);
  }

  get snapshot(): TeamSnapshot {
    return {
      ...this.duel.snapshot,
      teamInfo: this.buildTeamInfo(),
    };
  }

  private currentPairing() {
    const turn = this.turnOrder[this.turnIndex]!;
    const kickerTeam = turn.kickerTeam;
    const keeperTeam = kickerTeam === 'A' ? 'B' : 'A';
    const kicker = (kickerTeam === 'A' ? this.teamA : this.teamB)[turn.slot]!;
    const keeper = (keeperTeam === 'A' ? this.teamA : this.teamB)[turn.slot]!;
    const playerControls: 'kicker' | 'keeper' = kickerTeam === 'A' ? 'kicker' : 'keeper';
    return { kicker, keeper, playerControls, kickerTeam, turn };
  }

  private buildTeamInfo(): TeamTurnInfo {
    const pairing = this.currentPairing();

    return {
      turnIndex: this.turnIndex + 1,
      totalTurns: this.turnOrder.length,
      leg: pairing.turn.leg,
      teamAScore: this.teamAScore,
      teamBScore: this.teamBScore,
      teamNameA: this.teamNameA,
      teamNameB: this.teamNameB,
      activeKicker: pairing.kicker,
      activeKeeper: pairing.keeper,
      playerControls: pairing.playerControls,
      duelLabel:
        pairing.turn.duelType === 'kick'
          ? `${pairing.kicker.name} kicking`
          : `${pairing.keeper.name} keeping`,
    };
  }

  private applyPairingToDuel(pairing: ReturnType<typeof this.currentPairing>): void {
    this.duel.snapshot.playerRole = pairing.playerControls === 'kicker' ? 'shooter' : 'keeper';
    this.duel.snapshot.activeKicker = pairing.kicker;
    this.duel.snapshot.activeKeeper = pairing.keeper;
    this.duel.snapshot.isComplete = false;
    this.duel.snapshot.round = this.turnIndex + 1;
    this.duel.snapshot.score = { player: this.teamAScore, opponent: this.teamBScore };
  }

  update(dt: number): void {
    this.duel.update(dt);
  }

  setHoverZone(zone: Parameters<GameStateMachine['setHoverZone']>[0]): void {
    this.duel.setHoverZone(zone);
  }

  pickZone(zone: Parameters<GameStateMachine['pickZone']>[0]): boolean {
    return this.duel.pickZone(zone);
  }

  private handleTurnResolved(snap: TurnSnapshot): void {
    const pairing = this.currentPairing();
    const kickerWon = snap.lastPoint === 'KICKER_POINT';

    if (pairing.kickerTeam === 'A') {
      if (kickerWon) this.teamAScore += 1;
      else this.teamBScore += 1;
    } else {
      if (kickerWon) this.teamBScore += 1;
      else this.teamAScore += 1;
    }

    this.config.onTurnResolved(this.snapshot);
  }

  private tryAdvanceTeam(): void {
    this.turnIndex += 1;
    if (this.turnIndex >= this.turnOrder.length) {
      this.finishTeamMatch();
      return;
    }

    const pairing = this.currentPairing();
    const ai = createAiOpponent(this.config.difficulty);

    this.duel.reset();
    this.duel.updateConfig({
      playerProfile: pairing.playerControls === 'kicker' ? pairing.kicker : pairing.keeper,
      opponentProfile: pairing.playerControls === 'kicker' ? pairing.keeper : pairing.kicker,
      pickOpponentZone: (role) => ai.pickZone(role),
      singleDuel: true,
    });

    this.applyPairingToDuel(pairing);
  }

  private finishTeamMatch(): void {
    const s = this.duel.snapshot;
    s.isComplete = true;
    if (this.teamAScore > this.teamBScore) s.winner = 'player';
    else if (this.teamBScore > this.teamAScore) s.winner = 'opponent';
    else s.winner = 'draw';
    this.config.onMatchComplete(this.snapshot);
  }
}
