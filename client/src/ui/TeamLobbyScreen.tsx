import { useEffect, useRef, useState } from 'react';
import type { ServerToClientMessage } from '@pk/shared';
import { getFlagById } from '@pk/shared';
import {
  connectSocket,
  disconnectSocket,
  onServerMessage,
  onSocketConnect,
  sendMessage,
} from '../net/socketClient';
import { loadProfile } from '../lib/storage';
import { profileLabel, useAppStore } from '../store/appStore';

export function TeamLobbyScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const setTeamLobby = useAppStore((s) => s.setTeamLobby);
  const teamLobby = useAppStore((s) => s.teamLobby);
  const pendingTeamCreate = useAppStore((s) => s.pendingTeamCreate);
  const setPendingTeamCreate = useAppStore((s) => s.setPendingTeamCreate);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const createdRef = useRef(false);
  const profile = loadProfile();

  useEffect(() => {
    const sock = connectSocket();
    setConnected(sock.connected);

    const offConnect = onSocketConnect(() => setConnected(true));
    const offMsg = onServerMessage((msg: ServerToClientMessage) => {
      if (msg.type === 'team_lobby_state') {
        setTeamLobby({
          code: msg.code,
          teamNameA: msg.teamNameA,
          teamNameB: msg.teamNameB,
          slots: msg.slots,
          youAreHost: msg.youAreHost,
          yourSlot: msg.yourSlot,
          canStart: msg.canStart,
          difficulty: msg.difficulty,
        });
        setError('');
      } else if (msg.type === 'team_turn_start') {
        setScreen('online_team_match');
      } else if (msg.type === 'error') {
        setError(msg.message);
      } else if (msg.type === 'opponent_disconnected') {
        setError('A teammate disconnected');
      }
    });

    if (pendingTeamCreate && !createdRef.current) {
      createdRef.current = true;
      sendMessage(pendingTeamCreate);
      setPendingTeamCreate(null);
    }

    return () => {
      offConnect();
      offMsg();
    };
  }, [pendingTeamCreate, setPendingTeamCreate, setScreen, setTeamLobby]);

  const joinLobby = () => {
    if (joinCode.trim().length < 4) {
      setError('Enter a valid room code');
      return;
    }
    sendMessage({
      type: 'join_team_lobby',
      code: joinCode.trim().toUpperCase(),
      name: profile.name,
      flagId: profile.flagId,
    });
  };

  const claimSlot = (slot: number) => {
    sendMessage({ type: 'claim_team_slot', slot });
  };

  const toggleReady = () => {
    const slot = teamLobby.slots.find((s) => s.slot === teamLobby.yourSlot);
    sendMessage({ type: 'team_player_ready', ready: !(slot?.ready ?? false) });
  };

  const startMatch = () => {
    sendMessage({ type: 'start_team_match' });
  };

  const leaveLobby = () => {
    disconnectSocket();
    setTeamLobby({
      code: '',
      teamNameA: 'Your Team',
      teamNameB: 'Opponents',
      slots: [],
      youAreHost: false,
      yourSlot: null,
      canStart: false,
      difficulty: 'intermediate',
    });
    setScreen('menu');
  };

  const mySlot = teamLobby.slots.find((s) => s.slot === teamLobby.yourSlot);
  const myReady = mySlot?.ready ?? false;

  return (
    <div className="flex w-full max-w-lg flex-col gap-6 px-6">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-gold">Team Mode Online</p>
        <h2 className="font-display text-3xl font-bold">Invite Teammates</h2>
        <p className={`mt-2 text-sm ${connected ? 'text-green-400' : 'text-amber-400'}`}>
          {connected ? 'Connected to server' : 'Connecting…'}
        </p>
      </div>

      {!teamLobby.code ? (
        <div className="flex flex-col gap-4">
          <p className="text-center text-sm text-slate-400">
            Join a team room with a code from your host, or set up a team and choose
            &quot;Invite Online&quot; from Team Setup.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Team room code"
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
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
          <div className="text-center">
            <p className="text-sm text-slate-400">Share this code with teammates</p>
            <p className="font-display text-4xl font-bold tracking-[0.3em] text-gold">
              {teamLobby.code}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              {teamLobby.teamNameA} vs {teamLobby.teamNameB}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {teamLobby.slots.map((slot, i) => {
              const flag = getFlagById(slot.flagId);
              const isMine = teamLobby.yourSlot === slot.slot;
              const canClaim =
                !slot.isAi && !slot.playerConnected && teamLobby.yourSlot === null;
              return (
                <div
                  key={slot.slot}
                  className={`rounded-xl border px-4 py-3 ${
                    isMine ? 'border-gold/60 bg-gold/5' : 'border-slate-700 bg-slate-950/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-slate-500">
                        {slot.isAi ? 'AI teammate' : `Player ${i + 1}`}
                        {isMine ? ' · you' : ''}
                      </div>
                      <div className="mt-1 font-medium">
                        {flag?.emoji ?? '🏳️'} {slot.name}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      {slot.isAi ? (
                        <span className="text-gold">AI</span>
                      ) : slot.playerConnected ? (
                        <span className={slot.ready ? 'text-green-400' : 'text-slate-500'}>
                          {slot.ready ? 'Ready ✓' : 'Not ready'}
                        </span>
                      ) : (
                        <span className="text-slate-500">Open</span>
                      )}
                    </div>
                  </div>
                  {canClaim && (
                    <button
                      type="button"
                      onClick={() => claimSlot(slot.slot)}
                      className="mt-3 w-full rounded-full border border-gold/50 px-4 py-2 text-sm text-gold hover:bg-gold/10"
                    >
                      Join this slot
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {teamLobby.yourSlot !== null && (
              <button
                type="button"
                onClick={toggleReady}
                className="rounded-full bg-slate-700 px-6 py-3 font-medium hover:bg-slate-600"
              >
                {myReady ? 'Not Ready' : 'Ready'}
              </button>
            )}
            {teamLobby.youAreHost && teamLobby.canStart && (
              <button
                type="button"
                onClick={startMatch}
                className="rounded-full bg-gold px-6 py-3 font-semibold text-slate-950 hover:bg-yellow-300"
              >
                Start Team Match
              </button>
            )}
            {teamLobby.youAreHost && !teamLobby.canStart && (
              <p className="text-center text-xs text-slate-500">
                All human slots must be filled and every player must ready up.
              </p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <p className="text-center text-xs text-slate-500">
        You: {profileLabel(profile)}
      </p>

      <button
        type="button"
        onClick={leaveLobby}
        className="text-sm text-slate-400 hover:text-white"
      >
        ← Leave lobby
      </button>
    </div>
  );
}
