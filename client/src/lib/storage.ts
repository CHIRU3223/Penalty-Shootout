import type { PlayerProfile, PlayerStats, TeamId } from '@pk/shared';
import {
  defaultFlagId,
  MAX_TEAM_PLAYERS,
  MIN_TEAM_PLAYERS,
  pickFamousFootballerNames,
  TEAM_KEEPS_PER_PLAYER,
  TEAM_KICKS_PER_PLAYER,
} from '@pk/shared';

const PROFILE_KEY = 'pk-profile';
const STATS_KEY = 'pk-stats';
const TEAM_KEY = 'pk-team';
const COOKIE_NAME = 'pk_player_id';

export interface SavedTeamSlot {
  slot: number;
  name: string;
  flagId: string;
  isAi?: boolean;
}

export interface SavedTeam {
  humanCount: number;
  teamSize: number;
  includeAiTeammate: boolean;
  teamNameA: string;
  teamNameB: string;
  slots: SavedTeamSlot[];
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days = 365): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getOrCreatePlayerId(): string {
  let id = readCookie(COOKIE_NAME) ?? localStorage.getItem(COOKIE_NAME);
  if (!id) {
    id = `pk-${Math.random().toString(36).slice(2, 10)}`;
    writeCookie(COOKIE_NAME, id);
    localStorage.setItem(COOKIE_NAME, id);
  }
  return id;
}

export function loadProfile(): PlayerProfile {
  const id = getOrCreatePlayerId();
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlayerProfile;
      return { ...parsed, id };
    }
  } catch {
    /* ignore */
  }
  return { id, name: 'Player', flagId: defaultFlagId() };
}

export function saveProfile(profile: PlayerProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  writeCookie(COOKIE_NAME, profile.id);
}

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw) as PlayerStats;
  } catch {
    /* ignore */
  }
  return {
    matchesPlayed: 0,
    matchesWon: 0,
    kickerPoints: 0,
    keeperPoints: 0,
    teamWins: 0,
  };
}

export function saveStats(stats: PlayerStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function recordMatchResult(
  won: boolean,
  kickerPts: number,
  keeperPts: number,
  isTeam = false,
): PlayerStats {
  const stats = loadStats();
  stats.matchesPlayed += 1;
  if (won) {
    stats.matchesWon += 1;
    if (isTeam) stats.teamWins += 1;
  }
  stats.kickerPoints += kickerPts;
  stats.keeperPoints += keeperPts;
  saveStats(stats);
  return stats;
}

export function clampHumanCount(count: number): number {
  return Math.max(MIN_TEAM_PLAYERS, Math.min(MAX_TEAM_PLAYERS, Math.floor(count)));
}

export function canOfferAiTeammate(humanCount: number): boolean {
  return clampHumanCount(humanCount) % 2 === 1;
}

/** Team size for match — odd squads can optionally add one AI teammate */
export function resolveTeamSize(humanCount: number, includeAiTeammate = true): number {
  const humans = clampHumanCount(humanCount);
  if (humans % 2 === 0) return humans;
  return includeAiTeammate ? humans + 1 : humans;
}

export function aiSlotsNeeded(humanCount: number, includeAiTeammate = true): number {
  return resolveTeamSize(humanCount, includeAiTeammate) - clampHumanCount(humanCount);
}

export function buildTeamSlots(
  humanCount: number,
  includeAiTeammate: boolean,
  existing?: SavedTeam,
): SavedTeamSlot[] {
  const humans = clampHumanCount(humanCount);
  const aiCount = aiSlotsNeeded(humans, includeAiTeammate);
  const profile = loadProfile();
  const aiNames = pickFamousFootballerNames(aiCount);
  const flags = ['de', 'fr', 'es', 'it', 'pt', 'nl', 'ar', 'us'];

  const slots: SavedTeamSlot[] = [];
  for (let i = 0; i < humans; i++) {
    const prev = existing?.slots.find((s) => s.slot === i && !s.isAi);
    slots.push({
      slot: i,
      name: prev?.name ?? (i === 0 ? profile.name : `Player ${i + 1}`),
      flagId: prev?.flagId ?? (i === 0 ? profile.flagId : defaultFlagId()),
      isAi: false,
    });
  }
  for (let i = 0; i < aiCount; i++) {
    const slotIndex = humans + i;
    const prev = existing?.slots.find((s) => s.slot === slotIndex && s.isAi);
    slots.push({
      slot: slotIndex,
      name: prev?.name ?? aiNames[i]!,
      flagId: prev?.flagId ?? flags[slotIndex % flags.length]!,
      isAi: true,
    });
  }
  return slots;
}

export function loadTeam(humanCount = 3, includeAiTeammate?: boolean): SavedTeam {
  const humans = clampHumanCount(humanCount);
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedTeam;
      const aiPref =
        includeAiTeammate ??
        (parsed.includeAiTeammate ?? canOfferAiTeammate(humans));
      if (parsed.humanCount === humans) {
        return normalizeSavedTeam(parsed, humans, aiPref);
      }
    }
  } catch {
    /* ignore */
  }
  const aiPref = includeAiTeammate ?? canOfferAiTeammate(humans);
  return createDefaultTeam(humans, aiPref);
}

function createDefaultTeam(humanCount: number, includeAiTeammate: boolean): SavedTeam {
  const humans = clampHumanCount(humanCount);
  const teamSize = resolveTeamSize(humans, includeAiTeammate);

  return {
    humanCount: humans,
    teamSize,
    includeAiTeammate: canOfferAiTeammate(humans) ? includeAiTeammate : false,
    teamNameA: 'Your Team',
    teamNameB: 'AI United',
    slots: buildTeamSlots(humans, includeAiTeammate),
  };
}

function normalizeSavedTeam(
  saved: SavedTeam,
  humanCount: number,
  includeAiTeammate: boolean,
): SavedTeam {
  const humans = clampHumanCount(humanCount);
  const useAi = canOfferAiTeammate(humans) ? includeAiTeammate : false;
  const teamSize = resolveTeamSize(humans, useAi);

  return {
    humanCount: humans,
    teamSize,
    includeAiTeammate: useAi,
    teamNameA: saved.teamNameA || 'Your Team',
    teamNameB: saved.teamNameB || 'AI United',
    slots: buildTeamSlots(humans, useAi, saved),
  };
}

export function saveTeam(team: SavedTeam): void {
  localStorage.setItem(TEAM_KEY, JSON.stringify(team));
}

export function savedTeamToProfiles(team: SavedTeam): PlayerProfile[] {
  return team.slots.map((slot) => ({
    id: slot.isAi ? `ai-a-${slot.slot}` : `human-a-${slot.slot}`,
    name: slot.name,
    flagId: slot.flagId,
  }));
}

export function createAiOpponentTeam(teamSize: number, teamId: TeamId = 'B'): PlayerProfile[] {
  const names = pickFamousFootballerNames(teamSize);
  const flags = ['de', 'fr', 'es', 'it', 'pt', 'nl', 'ar', 'us'];
  return Array.from({ length: teamSize }, (_, i) => ({
    id: `ai-${teamId}-${i}`,
    name: names[i]!,
    flagId: flags[i % flags.length]!,
  }));
}

/** @deprecated use createAiOpponentTeam */
export const createAiTeam = createAiOpponentTeam;

export function teamDuelsPerSide(teamSize: number): number {
  return teamSize * (TEAM_KICKS_PER_PLAYER + TEAM_KEEPS_PER_PLAYER);
}

export function totalTeamDuels(teamSize: number): number {
  return teamDuelsPerSide(teamSize) * 2;
}
