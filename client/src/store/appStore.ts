import type { Difficulty, DuelPoint, PlayerProfile, PlayerRole } from '@pk/shared';
import { getFlagById } from '@pk/shared';
import { create } from 'zustand';

export type Screen =
  | 'menu'
  | 'difficulty'
  | 'match'
  | 'team_match'
  | 'online_match'
  | 'lobby'
  | 'result'
  | 'settings'
  | 'howto'
  | 'profile'
  | 'team_setup';

export type GameMode = 'solo' | 'online' | 'team';

export interface HudState {
  round: number;
  maxRounds: number;
  playerRole: PlayerRole;
  score: { player: number; opponent: number };
  pickClock: number;
  lastPoint: DuelPoint | null;
  phase: string;
  isSuddenDeath: boolean;
  fps: number;
  activeKicker: PlayerProfile | null;
  activeKeeper: PlayerProfile | null;
  playerProfile: PlayerProfile | null;
  opponentProfile: PlayerProfile | null;
  teamMode: boolean;
  teamLeg: 'first' | 'second' | null;
  playerControls: 'kicker' | 'keeper' | null;
}

export interface LobbyState {
  code: string;
  hostReady: boolean;
  guestReady: boolean;
  guestConnected: boolean;
  youAreHost: boolean;
}

interface AppStore {
  screen: Screen;
  gameMode: GameMode;
  difficulty: Difficulty;
  teamSize: number;
  hud: HudState;
  lobby: LobbyState;
  winner: 'player' | 'opponent' | 'draw' | null;
  matchKey: number;
  soundEnabled: boolean;
  setScreen: (screen: Screen) => void;
  setGameMode: (mode: GameMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setTeamSize: (size: number) => void;
  setHud: (hud: Partial<HudState>) => void;
  setLobby: (lobby: Partial<LobbyState>) => void;
  setWinner: (winner: 'player' | 'opponent' | 'draw' | null) => void;
  setSoundEnabled: (enabled: boolean) => void;
  resetMatchMeta: () => void;
}

const defaultHud: HudState = {
  round: 1,
  maxRounds: 5,
  playerRole: 'shooter',
  score: { player: 0, opponent: 0 },
  pickClock: 10,
  lastPoint: null,
  phase: 'PICK',
  isSuddenDeath: false,
  fps: 60,
  activeKicker: null,
  activeKeeper: null,
  playerProfile: null,
  opponentProfile: null,
  teamMode: false,
  teamLeg: null,
  playerControls: null,
};

const defaultLobby: LobbyState = {
  code: '',
  hostReady: false,
  guestReady: false,
  guestConnected: false,
  youAreHost: false,
};

export const useAppStore = create<AppStore>((set) => ({
  screen: 'menu',
  gameMode: 'solo',
  difficulty: 'intermediate',
  teamSize: 3,
  hud: defaultHud,
  lobby: defaultLobby,
  winner: null,
  matchKey: 0,
  soundEnabled: localStorage.getItem('pk-sound') !== 'off',
  setScreen: (screen) => set({ screen }),
  setGameMode: (gameMode) => set({ gameMode }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setTeamSize: (teamSize) => set({ teamSize }),
  setHud: (hud) => set((state) => ({ hud: { ...state.hud, ...hud } })),
  setLobby: (lobby) => set((state) => ({ lobby: { ...state.lobby, ...lobby } })),
  setWinner: (winner) => set({ winner }),
  setSoundEnabled: (soundEnabled) => {
    localStorage.setItem('pk-sound', soundEnabled ? 'on' : 'off');
    set({ soundEnabled });
  },
  resetMatchMeta: () =>
    set((state) => ({ hud: defaultHud, winner: null, matchKey: state.matchKey + 1 })),
}));

export function profileLabel(profile: PlayerProfile | null): string {
  if (!profile) return '—';
  const flag = getFlagById(profile.flagId);
  return `${flag?.emoji ?? ''} ${profile.name}`.trim();
}
