import type { Difficulty, PlayerProfile } from '@pk/shared';
import { DEFAULT_TEAM_SIZE, getDifficultyConfig } from '@pk/shared';
import type { TurnSnapshot } from './state';
import { GameStateMachine } from './state';
import { createAiOpponent } from './ai';

export interface TeamTurnInfo {
  turnIndex: number;
  totalTurns: number;
  leg: 'first' | 'second';
  teamAScore: number;
  teamBScore: number;
  activeKicker: PlayerProfile;
  activeKeeper: PlayerProfile;
  playerControls: 'kicker' | 'keeper';
}

export interface TeamSnapshot extends TurnSnapshot {
  teamInfo: TeamTurnInfo;
}

export interface TeamMatchConfig {
  teamA: PlayerProfile[];
  teamB: PlayerProfile[];
  difficulty: Difficulty;
  onTurnResolved: (snap: TeamSnapshot) => void;
  onMatchComplete: (snap: TeamSnapshot) => void;
}

function buildTurnOrder(teamSize: number): Array<{ kickerTeam: 'A' | 'B'; slot: number }> {
  const turns: Array<{ kickerTeam: 'A' | 'B'; slot: number }> = [];
  for (let i = 0; i < teamSize; i++) {
    turns.push({ kickerTeam: 'A', slot: i });
  }
  for (let i = 0; i < teamSize; i++) {
    turns.push({ kickerTeam: 'B', slot: i });
  }
  return turns;
}

export class TeamStateMachine {
  readonly duel: GameStateMachine;
  private teamA: PlayerProfile[];
  private teamB: PlayerProfile[];
  private turnOrder: Array<{ kickerTeam: 'A' | 'B'; slot: number }>;
  private turnIndex = 0;
  private teamAScore = 0;
  private teamBScore = 0;
  private config: TeamMatchConfig;

  constructor(config: TeamMatchConfig) {
    this.config = config;
    this.teamA = config.teamA;
    this.teamB = config.teamB;
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

    this.duel.snapshot.playerRole = first.playerControls === 'kicker' ? 'shooter' : 'keeper';
    this.duel.snapshot.activeKicker = first.kicker;
    this.duel.snapshot.activeKeeper = first.keeper;
    this.duel.snapshot.isComplete = false;
    this.duel.snapshot.round = 1;
    this.duel.snapshot.score = { player: 0, opponent: 0 };
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
    return { kicker, keeper, playerControls, kickerTeam };
  }

  private buildTeamInfo(): TeamTurnInfo {
    const pairing = this.currentPairing();
    return {
      turnIndex: this.turnIndex + 1,
      totalTurns: this.turnOrder.length,
      leg: this.turnIndex < this.teamA.length ? 'first' : 'second',
      teamAScore: this.teamAScore,
      teamBScore: this.teamBScore,
      activeKicker: pairing.kicker,
      activeKeeper: pairing.keeper,
      playerControls: pairing.playerControls,
    };
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

    this.duel.snapshot.playerRole = pairing.playerControls === 'kicker' ? 'shooter' : 'keeper';
    this.duel.snapshot.activeKicker = pairing.kicker;
    this.duel.snapshot.activeKeeper = pairing.keeper;
    this.duel.snapshot.isComplete = false;
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

export function defaultTeamSize(): number {
  return DEFAULT_TEAM_SIZE;
}
