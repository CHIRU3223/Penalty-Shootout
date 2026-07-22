import { randomBytes } from 'node:crypto';
import type {
  CreateTeamLobbyMessage,
  ServerToClientMessage,
  TeamLobbySlotState,
  TeamTurnStartMessage,
} from '@pk/shared';
import {
  applyTeamTurn,
  centerZone,
  createTeamMatchState,
  getTeamTurnPairing,
  getZoneGrid,
  isValidZone,
  pickAiZone,
  pickFamousFootballerNames,
  PICK_CLOCK_SECONDS,
  type TeamMatchState,
  type TeamSide,
} from '@pk/shared';
import type { Difficulty, PlayerProfile, Zone } from '@pk/shared';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const TEAM_RECONNECT_MS = 30_000;

export type TeamLobbyStatus = 'waiting' | 'playing' | 'finished';

export interface TeamLobbyMember {
  socketId: string;
  name: string;
  flagId: string;
  slot: number | null;
  ready: boolean;
  isHost: boolean;
}

export interface TeamLobbySlot {
  slot: number;
  name: string;
  flagId: string;
  isAi: boolean;
}

export interface TeamLobby {
  code: string;
  hostId: string;
  status: TeamLobbyStatus;
  teamNameA: string;
  teamNameB: string;
  slots: TeamLobbySlot[];
  teamB: PlayerProfile[];
  difficulty: Difficulty;
  members: Map<string, TeamLobbyMember>;
  slotOwners: Map<number, string>;
  match: TeamMatchState | null;
  pickTimer: ReturnType<typeof setTimeout> | null;
  aiSlots: Set<number>;
  createdAt: number;
}

export class TeamLobbyStore {
  private lobbies = new Map<string, TeamLobby>();
  private playerLobby = new Map<string, string>();

  createLobby(hostId: string, config: CreateTeamLobbyMessage): TeamLobby {
    const code = this.generateCode();
    const names = pickFamousFootballerNames(config.slots.length);
    const flags = ['de', 'fr', 'es', 'it', 'pt', 'nl', 'ar', 'us'];

    const lobby: TeamLobby = {
      code,
      hostId,
      status: 'waiting',
      teamNameA: config.teamNameA,
      teamNameB: config.teamNameB,
      slots: config.slots.map((s) => ({ ...s })),
      teamB: config.slots.map((_, i) => ({
        id: `ai-b-${i}`,
        name: names[i]!,
        flagId: flags[i % flags.length]!,
      })),
      difficulty: config.difficulty,
      members: new Map(),
      slotOwners: new Map(),
      match: null,
      pickTimer: null,
      aiSlots: new Set(config.slots.filter((s) => s.isAi).map((s) => s.slot)),
      createdAt: Date.now(),
    };

    this.lobbies.set(code, lobby);
    this.playerLobby.set(hostId, code);

    const firstHuman = config.slots.find((s) => !s.isAi);
    lobby.members.set(hostId, {
      socketId: hostId,
      name: firstHuman?.name ?? 'Host',
      flagId: firstHuman?.flagId ?? 'us',
      slot: null,
      ready: false,
      isHost: true,
    });

    if (firstHuman) {
      this.assignSlot(lobby, hostId, firstHuman.slot);
    }

    return lobby;
  }

  joinLobby(code: string, socketId: string, name: string, flagId: string): TeamLobby | null {
    const lobby = this.lobbies.get(code.toUpperCase());
    if (!lobby || lobby.status !== 'waiting') return null;
    if (lobby.members.has(socketId)) return lobby;

    lobby.members.set(socketId, {
      socketId,
      name,
      flagId,
      slot: null,
      ready: false,
      isHost: false,
    });
    this.playerLobby.set(socketId, code.toUpperCase());
    return lobby;
  }

  claimSlot(lobby: TeamLobby, socketId: string, slot: number): boolean {
    const slotConfig = lobby.slots.find((s) => s.slot === slot);
    if (!slotConfig || slotConfig.isAi) return false;
    if (lobby.slotOwners.has(slot) && lobby.slotOwners.get(slot) !== socketId) {
      return false;
    }

    const member = lobby.members.get(socketId);
    if (!member) return false;

    if (member.slot !== null && member.slot !== slot) {
      lobby.slotOwners.delete(member.slot);
    }

    this.assignSlot(lobby, socketId, slot);
    member.ready = false;
    return true;
  }

  setReady(lobby: TeamLobby, socketId: string, ready: boolean): void {
    const member = lobby.members.get(socketId);
    if (member) member.ready = ready;
  }

  canStart(lobby: TeamLobby): boolean {
    if (lobby.status !== 'waiting') return false;
    for (const slot of lobby.slots) {
      if (slot.isAi) continue;
      const owner = lobby.slotOwners.get(slot.slot);
      if (!owner) return false;
      if (!lobby.members.get(owner)?.ready) return false;
    }
    return lobby.members.get(lobby.hostId)?.ready === true;
  }

  getLobbyForPlayer(playerId: string): TeamLobby | null {
    const code = this.playerLobby.get(playerId);
    if (!code) return null;
    return this.lobbies.get(code) ?? null;
  }

  removePlayer(playerId: string): TeamLobby | null {
    const lobby = this.getLobbyForPlayer(playerId);
    if (!lobby) return null;

    const member = lobby.members.get(playerId);
    if (member?.slot !== null && member?.slot !== undefined && playerId !== lobby.hostId) {
      lobby.slotOwners.delete(member.slot);
    }

    this.playerLobby.delete(playerId);
    lobby.members.delete(playerId);

    if (playerId === lobby.hostId) {
      this.deleteLobby(lobby.code);
    }

    return lobby;
  }

  deleteLobby(code: string): void {
    const lobby = this.lobbies.get(code);
    if (!lobby) return;
    this.clearPickTimer(lobby);
    for (const member of lobby.members.values()) {
      this.playerLobby.delete(member.socketId);
    }
    this.lobbies.delete(code);
  }

  beginMatch(lobby: TeamLobby): void {
    lobby.status = 'playing';
    lobby.match = createTeamMatchState(lobby.slots.length);
  }

  resetMatch(lobby: TeamLobby): void {
    lobby.status = 'waiting';
    lobby.match = null;
    this.clearPickTimer(lobby);
    for (const member of lobby.members.values()) {
      member.ready = false;
    }
  }

  getTeamAProfiles(lobby: TeamLobby): PlayerProfile[] {
    return lobby.slots.map((slot) => {
      const owner = lobby.slotOwners.get(slot.slot);
      const member = owner ? lobby.members.get(owner) : null;
      return {
        id: slot.isAi ? `ai-a-${slot.slot}` : `human-a-${slot.slot}`,
        name: member?.name ?? slot.name,
        flagId: member?.flagId ?? slot.flagId,
      };
    });
  }

  clearPickTimer(lobby: TeamLobby): void {
    if (lobby.pickTimer) {
      clearTimeout(lobby.pickTimer);
      lobby.pickTimer = null;
    }
  }

  startPickTimer(lobby: TeamLobby, onExpire: () => void): void {
    this.clearPickTimer(lobby);
    lobby.pickTimer = setTimeout(onExpire, PICK_CLOCK_SECONDS * 1000);
  }

  private assignSlot(lobby: TeamLobby, socketId: string, slot: number): void {
    const member = lobby.members.get(socketId);
    if (!member) return;
    member.slot = slot;
    lobby.slotOwners.set(slot, socketId);
    const slotConfig = lobby.slots.find((s) => s.slot === slot);
    if (slotConfig && !slotConfig.isAi) {
      slotConfig.name = member.name;
      slotConfig.flagId = member.flagId;
    }
  }

  private generateCode(): string {
    let code = '';
    for (let i = 0; i < 5; i++) {
      const idx = randomBytes(1)[0]! % CODE_CHARS.length;
      code += CODE_CHARS[idx];
    }
    if (this.lobbies.has(code)) return this.generateCode();
    return code;
  }
}

export function teamLobbyStateMessage(
  store: TeamLobbyStore,
  lobby: TeamLobby,
  viewerId: string,
): ServerToClientMessage {
  const viewer = lobby.members.get(viewerId);
  const slots: TeamLobbySlotState[] = lobby.slots.map((slot) => {
    const owner = lobby.slotOwners.get(slot.slot);
    const member = owner ? lobby.members.get(owner) : null;
    return {
      slot: slot.slot,
      name: slot.name,
      flagId: slot.flagId,
      isAi: slot.isAi,
      playerConnected: Boolean(owner),
      ready: member?.ready ?? false,
    };
  });

  return {
    type: 'team_lobby_state',
    code: lobby.code,
    teamNameA: lobby.teamNameA,
    teamNameB: lobby.teamNameB,
    slots,
    youAreHost: viewerId === lobby.hostId,
    yourSlot: viewer?.slot ?? null,
    canStart: store.canStart(lobby),
    difficulty: lobby.difficulty,
  };
}

export function buildTeamTurnStart(
  store: TeamLobbyStore,
  lobby: TeamLobby,
  viewerId: string,
): TeamTurnStartMessage | null {
  if (!lobby.match) return null;
  const teamA = store.getTeamAProfiles(lobby);
  const pairing = getTeamTurnPairing(lobby.match, teamA, lobby.teamB);
  if (!pairing) return null;

  const viewer = lobby.members.get(viewerId);
  const yourRole = roleForViewer(viewer, pairing);

  return {
    type: 'team_turn_start',
    turnIndex: lobby.match.turnIndex + 1,
    totalTurns: lobby.match.turnOrder.length,
    leg: pairing.turn.leg,
    teamAScore: lobby.match.teamAScore,
    teamBScore: lobby.match.teamBScore,
    teamNameA: lobby.teamNameA,
    teamNameB: lobby.teamNameB,
    activeKicker: pairing.kicker,
    activeKeeper: pairing.keeper,
    yourRole,
  };
}

function roleForViewer(
  viewer: TeamLobbyMember | undefined,
  pairing: ReturnType<typeof getTeamTurnPairing>,
): 'shooter' | 'keeper' | 'spectator' {
  if (!viewer || viewer.slot === null || !pairing?.teamAControls) return 'spectator';
  if (pairing.turn.slot !== viewer.slot) return 'spectator';
  return pairing.teamAControls === 'kicker' ? 'shooter' : 'keeper';
}

export interface ActivePickControllers {
  kickerSocket: string | null;
  keeperSocket: string | null;
  kickerIsAi: boolean;
  keeperIsAi: boolean;
}

export function getActivePickControllers(
  store: TeamLobbyStore,
  lobby: TeamLobby,
): ActivePickControllers {
  if (!lobby.match) {
    return { kickerSocket: null, keeperSocket: null, kickerIsAi: true, keeperIsAi: true };
  }

  const pairing = getTeamTurnPairing(
    lobby.match,
    store.getTeamAProfiles(lobby),
    lobby.teamB,
  );
  if (!pairing) {
    return { kickerSocket: null, keeperSocket: null, kickerIsAi: true, keeperIsAi: true };
  }

  const kickerTeam: TeamSide = pairing.turn.kickerTeam;
  const keeperTeam: TeamSide = kickerTeam === 'A' ? 'B' : 'A';
  const slot = pairing.turn.slot;

  const kickerIsAi = kickerTeam === 'B' || lobby.aiSlots.has(slot);
  const keeperIsAi = keeperTeam === 'B' || lobby.aiSlots.has(slot);

  return {
    kickerSocket: kickerIsAi ? null : lobby.slotOwners.get(slot) ?? null,
    keeperSocket: keeperIsAi ? null : lobby.slotOwners.get(slot) ?? null,
    kickerIsAi,
    keeperIsAi,
  };
}

export function fillAiPicks(store: TeamLobbyStore, lobby: TeamLobby): void {
  if (!lobby.match) return;
  const controllers = getActivePickControllers(store, lobby);
  if (controllers.kickerIsAi && lobby.match.pendingKickZone === null) {
    lobby.match.pendingKickZone = pickAiZone(lobby.difficulty, 'shooter');
  }
  if (controllers.keeperIsAi && lobby.match.pendingKeepZone === null) {
    lobby.match.pendingKeepZone = pickAiZone(lobby.difficulty, 'keeper');
  }
}

export function tryResolveTeamTurn(
  store: TeamLobbyStore,
  lobby: TeamLobby,
): ServerToClientMessage | null {
  if (!lobby.match) return null;
  const { match } = lobby;
  if (match.pendingKickZone === null || match.pendingKeepZone === null) return null;

  store.clearPickTimer(lobby);
  const result = applyTeamTurn(match, match.pendingKickZone, match.pendingKeepZone);

  if (result.isComplete) {
    lobby.status = 'finished';
    return {
      type: 'team_match_end',
      teamAScore: result.teamAScore,
      teamBScore: result.teamBScore,
      winner: result.winner ?? 'draw',
      teamNameA: lobby.teamNameA,
      teamNameB: lobby.teamNameB,
    };
  }

  return {
    type: 'team_turn_result',
    turnIndex: result.turnIndex,
    kickZone: result.kickZone,
    keepZone: result.keepZone,
    point: result.point,
    teamAScore: result.teamAScore,
    teamBScore: result.teamBScore,
    nextTurn: null,
  };
}

export function emitTeamLobby(
  store: TeamLobbyStore,
  lobby: TeamLobby,
  io: { to: (id: string) => { emit: (ev: string, msg: unknown) => void } },
): void {
  for (const member of lobby.members.values()) {
    io.to(member.socketId).emit(
      'message',
      teamLobbyStateMessage(store, lobby, member.socketId),
    );
  }
}

export function emitTeamTurnStart(
  store: TeamLobbyStore,
  lobby: TeamLobby,
  io: { to: (id: string) => { emit: (ev: string, msg: unknown) => void } },
): void {
  for (const member of lobby.members.values()) {
    const msg = buildTeamTurnStart(store, lobby, member.socketId);
    if (msg) io.to(member.socketId).emit('message', msg);
  }
}

export function emitTeamAll(
  lobby: TeamLobby,
  io: { to: (id: string) => { emit: (ev: string, msg: unknown) => void } },
  msg: ServerToClientMessage,
): void {
  for (const member of lobby.members.values()) {
    io.to(member.socketId).emit('message', msg);
  }
}

export function handleTeamPickClock(
  store: TeamLobbyStore,
  lobby: TeamLobby,
): ServerToClientMessage | null {
  if (!lobby.match) return null;
  const defaultZone = centerZone(getZoneGrid(lobby.difficulty));
  if (lobby.match.pendingKickZone === null) lobby.match.pendingKickZone = defaultZone;
  if (lobby.match.pendingKeepZone === null) lobby.match.pendingKeepZone = defaultZone;
  return tryResolveTeamTurn(store, lobby);
}

export function validateTeamZone(zone: number, difficulty: Difficulty): zone is Zone {
  return isValidZone(zone, getZoneGrid(difficulty));
}

export function isTeamMessage(type: string): boolean {
  return (
    type === 'create_team_lobby' ||
    type === 'join_team_lobby' ||
    type === 'claim_team_slot' ||
    type === 'team_player_ready' ||
    type === 'start_team_match' ||
    type === 'submit_team_zone_pick' ||
    type === 'rematch_team'
  );
}

export function startTeamTurn(
  store: TeamLobbyStore,
  lobby: TeamLobby,
  io: { to: (id: string) => { emit: (ev: string, msg: unknown) => void } },
  onExpire: () => void,
): void {
  fillAiPicks(store, lobby);
  const instant = tryResolveTeamTurn(store, lobby);
  if (instant) {
    emitTurnResultAndContinue(store, lobby, io, instant, onExpire);
    return;
  }
  emitTeamTurnStart(store, lobby, io);
  store.startPickTimer(lobby, onExpire);
}

export function emitTurnResultAndContinue(
  store: TeamLobbyStore,
  lobby: TeamLobby,
  io: { to: (id: string) => { emit: (ev: string, msg: unknown) => void } },
  msg: ServerToClientMessage,
  onExpire: () => void,
): void {
  emitTeamAll(lobby, io, msg);
  if (msg.type === 'team_match_end') return;
  startTeamTurn(store, lobby, io, onExpire);
}

export function resolveTeamPickClock(
  store: TeamLobbyStore,
  lobby: TeamLobby,
  io: { to: (id: string) => { emit: (ev: string, msg: unknown) => void } },
  onExpire: () => void,
): void {
  if (!lobby.match) return;
  const defaultZone = centerZone(getZoneGrid(lobby.difficulty));
  if (lobby.match.pendingKickZone === null) lobby.match.pendingKickZone = defaultZone;
  if (lobby.match.pendingKeepZone === null) lobby.match.pendingKeepZone = defaultZone;
  const msg = tryResolveTeamTurn(store, lobby);
  if (msg) emitTurnResultAndContinue(store, lobby, io, msg, onExpire);
}
