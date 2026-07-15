import { DifficultySelect } from './ui/DifficultySelect';
import { GameCanvas } from './ui/GameCanvas';
import { HowToPlay } from './ui/HowToPlay';
import { LobbyScreen } from './ui/LobbyScreen';
import { MainMenu } from './ui/MainMenu';
import { MatchHUD } from './ui/MatchHUD';
import { OnlineGameCanvas } from './ui/OnlineGameCanvas';
import { ProfileScreen } from './ui/ProfileScreen';
import { ResultScreen } from './ui/ResultScreen';
import { SettingsScreen } from './ui/SettingsScreen';
import { TeamGameCanvas } from './ui/TeamGameCanvas';
import { TeamSetupScreen } from './ui/TeamSetupScreen';
import { useAppStore } from './store/appStore';
import { sendMessage } from './net/socketClient';

export function App() {
  const screen = useAppStore((s) => s.screen);
  const gameMode = useAppStore((s) => s.gameMode);
  const difficulty = useAppStore((s) => s.difficulty);
  const teamSize = useAppStore((s) => s.teamSize);
  const hud = useAppStore((s) => s.hud);
  const winner = useAppStore((s) => s.winner);
  const matchKey = useAppStore((s) => s.matchKey);
  const setScreen = useAppStore((s) => s.setScreen);
  const setDifficulty = useAppStore((s) => s.setDifficulty);
  const setGameMode = useAppStore((s) => s.setGameMode);
  const resetMatchMeta = useAppStore((s) => s.resetMatchMeta);

  const startSoloMatch = () => {
    setGameMode('solo');
    resetMatchMeta();
    setScreen('match');
  };

  const startTeamMatch = () => {
    setGameMode('team');
    resetMatchMeta();
    setScreen('team_match');
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
    } else if (gameMode === 'team') {
      setScreen('team_match');
    } else {
      setScreen('match');
    }
  };

  const isMatchScreen =
    screen === 'match' || screen === 'online_match' || screen === 'team_match';

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {isMatchScreen ? (
        <div className="relative flex min-h-screen flex-col">
          <MatchHUD {...hud} online={gameMode === 'online'} />
          {screen === 'match' ? (
            <GameCanvas active key={matchKey} />
          ) : screen === 'team_match' ? (
            <TeamGameCanvas active key={matchKey} />
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
                if (gameMode === 'team') startTeamMatch();
                else startSoloMatch();
              }}
            />
          )}
          {screen === 'team_setup' && (
            <TeamSetupScreen
              teamSize={teamSize}
              onBack={() => setScreen('menu')}
              onStart={() => {
                setGameMode('team');
                setScreen('difficulty');
              }}
            />
          )}
          {screen === 'profile' && <ProfileScreen onBack={() => setScreen('menu')} />}
          {screen === 'lobby' && <LobbyScreen />}
          {screen === 'settings' && <SettingsScreen onBack={() => setScreen('menu')} />}
          {screen === 'howto' && <HowToPlay onBack={() => setScreen('menu')} />}
          {screen === 'result' && winner && (
            <ResultScreen
              score={hud.score}
              winner={winner}
              teamMode={hud.teamMode}
              onRematch={rematch}
              onMenu={() => setScreen('menu')}
            />
          )}
        </main>
      )}
    </div>
  );
}
