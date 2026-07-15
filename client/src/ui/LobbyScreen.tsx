import { useEffect, useRef, useState } from 'react';
import type { ServerToClientMessage } from '@pk/shared';
import {
  connectSocket,
  disconnectSocket,
  onServerMessage,
  onSocketConnect,
  sendMessage,
} from '../net/socketClient';
import { useAppStore } from '../store/appStore';

export function LobbyScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const setLobby = useAppStore((s) => s.setLobby);
  const lobby = useAppStore((s) => s.lobby);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const createdRef = useRef(false);

  useEffect(() => {
    const sock = connectSocket();
    setConnected(sock.connected);

    const offConnect = onSocketConnect(() => setConnected(true));
    const offMsg = onServerMessage((msg: ServerToClientMessage) => {
      if (msg.type === 'lobby_state') {
        setLobby({
          code: msg.code,
          hostReady: msg.hostReady,
          guestReady: msg.guestReady,
          guestConnected: msg.guestConnected,
          youAreHost: msg.youAreHost,
        });
        setError('');
      } else if (msg.type === 'match_start') {
        setScreen('online_match');
      } else if (msg.type === 'error') {
        setError(msg.message);
      } else if (msg.type === 'opponent_disconnected') {
        setError('Opponent disconnected');
      }
    });

    return () => {
      offConnect();
      offMsg();
    };
  }, [setLobby, setScreen]);

  const createLobby = () => {
    createdRef.current = true;
    sendMessage({ type: 'create_lobby' });
  };

  const joinLobby = () => {
    if (joinCode.trim().length < 4) {
      setError('Enter a valid room code');
      return;
    }
    sendMessage({ type: 'join_lobby', code: joinCode.trim().toUpperCase() });
  };

  const toggleReady = () => {
    const ready = lobby.youAreHost ? !lobby.hostReady : !lobby.guestReady;
    sendMessage({ type: 'player_ready', ready });
  };

  const startMatch = () => {
    sendMessage({ type: 'start_match' });
  };

  const leaveLobby = () => {
    disconnectSocket();
    setLobby({
      code: '',
      hostReady: false,
      guestReady: false,
      guestConnected: false,
      youAreHost: false,
    });
    setScreen('menu');
  };

  const myReady = lobby.youAreHost ? lobby.hostReady : lobby.guestReady;
  const canStart =
    lobby.youAreHost && lobby.hostReady && lobby.guestReady && lobby.guestConnected;

  return (
    <div className="flex w-full max-w-lg flex-col gap-6 px-6">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-gold">Online</p>
        <h2 className="font-display text-3xl font-bold">Play vs Friend</h2>
        <p className={`mt-2 text-sm ${connected ? 'text-green-400' : 'text-amber-400'}`}>
          {connected ? 'Connected to server' : 'Connecting…'}
        </p>
      </div>

      {!lobby.code ? (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={createLobby}
            className="rounded-full bg-gold px-6 py-3 font-semibold text-slate-950 hover:bg-yellow-300"
          >
            Create Room
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Room code"
              maxLength={6}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 uppercase tracking-widest"
            />
            <button
              type="button"
              onClick={joinLobby}
              className="rounded-full border border-slate-600 px-6 py-3 hover:bg-slate-800"
            >
              Join
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 text-center">
          <p className="text-sm text-slate-400">Room code</p>
          <p className="font-display text-4xl font-bold tracking-[0.3em] text-gold">{lobby.code}</p>
          <p className="mt-4 text-sm text-slate-300">
            {lobby.guestConnected ? 'Opponent connected' : 'Waiting for opponent…'}
          </p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <span className={lobby.hostReady ? 'text-green-400' : 'text-slate-500'}>
              Host {lobby.hostReady ? '✓' : '…'}
            </span>
            <span className={lobby.guestReady ? 'text-green-400' : 'text-slate-500'}>
              Guest {lobby.guestReady ? '✓' : '…'}
            </span>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={toggleReady}
              className="rounded-full bg-slate-700 px-6 py-3 font-medium hover:bg-slate-600"
            >
              {myReady ? 'Not Ready' : 'Ready'}
            </button>
            {canStart && (
              <button
                type="button"
                onClick={startMatch}
                className="rounded-full bg-gold px-6 py-3 font-semibold text-slate-950 hover:bg-yellow-300"
              >
                Start Match
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={leaveLobby}
        className="text-sm text-slate-400 hover:text-white"
      >
        ← Back to menu
      </button>
    </div>
  );
}
