import { DifficultySelect } from './ui/DifficultySelect';
import { GameCanvas } from './ui/GameCanvas';
import { HowToPlay } from './ui/HowToPlay';
import { LobbyScreen } from './ui/LobbyScreen';
import { MainMenu } from './ui/MainMenu';
import { MatchHUD } from './ui/MatchHUD';
import { OnlineGameCanvas } from './ui/OnlineGameCanvas';
import { OnlineTeamGameCanvas } from './ui/OnlineTeamGameCanvas';
import { ProfileScreen } from './ui/ProfileScreen';
import { ResultScreen } from './ui/ResultScreen';
import { SettingsScreen } from './ui/SettingsScreen';
import { TeamGameCanvas } from './ui/TeamGameCanvas';
import { TeamLobbyScreen } from './ui/TeamLobbyScreen';
import { TeamSetupScreen } from './ui/TeamSetupScreen';
import { useAppStore } from './store/appStore';
import { sendMessage } from './net/socketClient';
import { loadTeam } from './lib/storage';

export function App() {
  const screen = useAppStore((s) => s.screen);
  const gameMode = useAppStore((s) => s.gameMode);
  const difficulty = useAppStore((s) => s.difficulty);
  const humanCount = useAppStore((s) => s.humanCount);
  const teamInviteOnline = useAppStore((s) => s.teamInviteOnline);
  const teamOnline = useAppStore((s) => s.teamOnline);
  const hud = useAppStore((s) => s.hud);
  const winner = useAppStore((s) => s.winner);
  const matchKey = useAppStore((s) => s.matchKey);
  const setScreen = useAppStore((s) => s.setScreen);
  const setDifficulty = useAppStore((s) => s.setDifficulty);
  const setGameMode = useAppStore((s) => s.setGameMode);
  const setPendingTeamCreate = useAppStore((s) => s.setPendingTeamCreate);
  const setTeamOnline = useAppStore((s) => s.setTeamOnline);
  const resetMatchMeta = useAppStore((s) => s.resetMatchMeta);

  const startSoloMatch = () => {
    setGameMode('solo');
    resetMatchMeta();
    setScreen('match');
  };

  const startTeamMatch = () => {
    setGameMode('team');
    setTeamOnline(false);
    resetMatchMeta();
    setScreen('team_match');
  };

  const startOnlineTeamLobby = () => {
    const saved = loadTeam(humanCount);
    setPendingTeamCreate({
      type: 'create_team_lobby',
      teamNameA: saved.teamNameA,
      teamNameB: saved.teamNameB,
      slots: saved.slots.map((slot) => ({
        slot: slot.slot,
        name: slot.name,
        flagId: slot.flagId,
        isAi: Boolean(slot.isAi),
      })),
      difficulty,
    });
    setGameMode('team');
    setTeamOnline(true);
    resetMatchMeta();
    setScreen('team_lobby');
  };

  const startOnlineLobby = () => {
    setGameMode('online');
    resetMatchMeta();
    setScreen('lobby');
  };

  const rematch = () => {
    resetMatchMeta();
    if (gameMode === 'online') {
      sendMessage({ type: 'rematch' });
      setScreen('lobby');
    } else if (gameMode === 'team' && teamOnline) {
      sendMessage({ type: 'rematch_team' });
      setScreen('team_lobby');
    } else if (gameMode === 'team') {
      setScreen('team_match');
    } else {
      setScreen('match');
    }
  };

  const isMatchScreen =
    screen === 'match' ||
    screen === 'online_match' ||
    screen === 'team_match' ||
    screen === 'online_team_match';

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {isMatchScreen ? (
        <div className="relative flex min-h-screen flex-col">
          <MatchHUD {...hud} online={gameMode === 'online' || screen === 'online_team_match'} />
          {screen === 'match' ? (
            <GameCanvas active key={matchKey} />
          ) : screen === 'team_match' ? (
            <TeamGameCanvas active key={matchKey} />
          ) : screen === 'online_team_match' ? (
            <OnlineTeamGameCanvas active key={matchKey} />
          ) : (
            <OnlineGameCanvas active key={matchKey} />
          )}
        </div>
      ) : (
        <main className="flex flex-1 items-center justify-center py-12">
          {screen === 'menu' && (
            <MainMenu
              onPlaySolo={() => setScreen('difficulty')}
              onPlayTeam={() => setScreen('team_setup')}
              onJoinTeam={() => {
                setGameMode('team');
                setTeamOnline(true);
                setScreen('team_lobby');
              }}
              onPlayOnline={startOnlineLobby}
              onProfile={() => setScreen('profile')}
              onHowTo={() => setScreen('howto')}
              onSettings={() => setScreen('settings')}
            />
          )}
          {screen === 'difficulty' && (
            <DifficultySelect
              selected={difficulty}
              onSelect={setDifficulty}
              onBack={() => setScreen(gameMode === 'team' ? 'team_setup' : 'menu')}
              onStart={() => {
                if (gameMode === 'team') {
                  if (teamInviteOnline) startOnlineTeamLobby();
                  else startTeamMatch();
                } else {
                  startSoloMatch();
                }
              }}
            />
          )}
          {screen === 'team_setup' && (
            <TeamSetupScreen
              onBack={() => setScreen('menu')}
              onContinue={(online) => {
                setGameMode('team');
                useAppStore.getState().setTeamInviteOnline(online);
                setScreen('difficulty');
              }}
            />
          )}
          {screen === 'team_lobby' && <TeamLobbyScreen />}
          {screen === 'profile' && <ProfileScreen onBack={() => setScreen('menu')} />}
          {screen === 'lobby' && <LobbyScreen />}
          {screen === 'settings' && <SettingsScreen onBack={() => setScreen('menu')} />}
          {screen === 'howto' && <HowToPlay onBack={() => setScreen('menu')} />}
          {screen === 'result' && winner && (
            <ResultScreen
              score={hud.score}
              winner={winner}
              teamMode={hud.teamMode}
              teamNameA={hud.teamNameA}
              teamNameB={hud.teamNameB}
              onRematch={rematch}
              onMenu={() => setScreen('menu')}
            />
          )}
        </main>
      )}
    </div>
  );
}
