import type {
  CreateTeamLobbyMessage,
  Difficulty,
  DuelPoint,
  PlayerProfile,
  PlayerRole,
  TeamLobbySlotState,
} from '@pk/shared';
import { MAX_DUELS } from '@pk/shared';
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
  | 'team_setup'
  | 'team_lobby'
  | 'online_team_match';

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
  teamNameA: string | null;
  teamNameB: string | null;
  playerControls: 'kicker' | 'keeper' | null;
}

export interface TeamLobbyState {
  code: string;
  teamNameA: string;
  teamNameB: string;
  slots: TeamLobbySlotState[];
  youAreHost: boolean;
  yourSlot: number | null;
  canStart: boolean;
  difficulty: Difficulty;
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
  humanCount: number;
  hud: HudState;
  lobby: LobbyState;
  teamLobby: TeamLobbyState;
  pendingTeamCreate: CreateTeamLobbyMessage | null;
  teamInviteOnline: boolean;
  teamOnline: boolean;
  winner: 'player' | 'opponent' | 'draw' | null;
  matchKey: number;
  soundEnabled: boolean;
  setScreen: (screen: Screen) => void;
  setGameMode: (mode: GameMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setHumanCount: (count: number) => void;
  setHud: (hud: Partial<HudState>) => void;
  setLobby: (lobby: Partial<LobbyState>) => void;
  setTeamLobby: (lobby: Partial<TeamLobbyState>) => void;
  setPendingTeamCreate: (payload: CreateTeamLobbyMessage | null) => void;
  setTeamInviteOnline: (online: boolean) => void;
  setTeamOnline: (online: boolean) => void;
  setWinner: (winner: 'player' | 'opponent' | 'draw' | null) => void;
  setSoundEnabled: (enabled: boolean) => void;
  resetMatchMeta: () => void;
}

const defaultHud: HudState = {
  round: 1,
  maxRounds: MAX_DUELS,
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
  teamNameA: null,
  teamNameB: null,
  playerControls: null,
};

const defaultTeamLobby: TeamLobbyState = {
  code: '',
  teamNameA: 'Your Team',
  teamNameB: 'Opponents',
  slots: [],
  youAreHost: false,
  yourSlot: null,
  canStart: false,
  difficulty: 'intermediate',
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
  humanCount: 3,
  hud: defaultHud,
  lobby: defaultLobby,
  teamLobby: defaultTeamLobby,
  pendingTeamCreate: null,
  teamInviteOnline: false,
  teamOnline: false,
  winner: null,
  matchKey: 0,
  soundEnabled: localStorage.getItem('pk-sound') !== 'off',
  setScreen: (screen) => set({ screen }),
  setGameMode: (gameMode) => set({ gameMode }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setHumanCount: (humanCount) => set({ humanCount }),
  setHud: (hud) => set((state) => ({ hud: { ...state.hud, ...hud } })),
  setLobby: (lobby) => set((state) => ({ lobby: { ...state.lobby, ...lobby } })),
  setTeamLobby: (teamLobby) =>
    set((state) => ({ teamLobby: { ...state.teamLobby, ...teamLobby } })),
  setPendingTeamCreate: (pendingTeamCreate) => set({ pendingTeamCreate }),
  setTeamInviteOnline: (teamInviteOnline) => set({ teamInviteOnline }),
  setTeamOnline: (teamOnline) => set({ teamOnline }),
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
