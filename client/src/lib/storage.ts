import type { PlayerProfile, PlayerStats, TeamId } from '@pk/shared';
import { defaultFlagId } from '@pk/shared';

const PROFILE_KEY = 'pk-profile';
const STATS_KEY = 'pk-stats';
const TEAM_KEY = 'pk-team';
const COOKIE_NAME = 'pk_player_id';

export interface SavedTeamSlot {
  slot: number;
  name: string;
  flagId: string;
}

export interface SavedTeam {
  teamSize: number;
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

export function loadTeam(teamSize = 3): SavedTeam {
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedTeam;
      if (parsed.teamSize === teamSize) return parsed;
    }
  } catch {
    /* ignore */
  }
  const profile = loadProfile();
  const slots: SavedTeamSlot[] = Array.from({ length: teamSize }, (_, i) => ({
    slot: i,
    name: i === 0 ? profile.name : `Player ${i + 1}`,
    flagId: i === 0 ? profile.flagId : defaultFlagId(),
  }));
  return { teamSize, slots };
}

export function saveTeam(team: SavedTeam): void {
  localStorage.setItem(TEAM_KEY, JSON.stringify(team));
}

export function createAiTeam(teamSize: number, teamId: TeamId): PlayerProfile[] {
  const names =
    teamId === 'A'
      ? ['AI Ace', 'AI Bolt', 'AI Stark', 'AI Flash', 'AI Hawk']
      : ['Bot Max', 'Bot Rex', 'Bot Zed', 'Bot Kai', 'Bot Nova'];
  const flags = ['de', 'fr', 'es', 'it', 'pt', 'nl', 'ar', 'us'];
  return Array.from({ length: teamSize }, (_, i) => ({
    id: `ai-${teamId}-${i}`,
    name: names[i] ?? `AI ${i + 1}`,
    flagId: flags[i % flags.length]!,
  }));
}
