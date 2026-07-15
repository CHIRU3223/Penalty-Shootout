import type { DuelPoint, PlayerRole } from '@pk/shared';
import { profileLabel } from '../store/appStore';
import type { PlayerProfile } from '@pk/shared';

interface MatchHUDProps {
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
  teamMode?: boolean;
  teamLeg?: 'first' | 'second' | null;
  playerControls?: 'kicker' | 'keeper' | null;
  online?: boolean;
}

export function MatchHUD({
  round,
  maxRounds,
  playerRole,
  score,
  pickClock,
  lastPoint,
  phase,
  isSuddenDeath,
  fps,
  activeKicker,
  activeKeeper,
  playerProfile,
  teamMode = false,
  teamLeg,
  playerControls,
  online = false,
}: MatchHUDProps) {
  const roleLabel =
    playerRole === 'shooter' ? 'You pick as KICKER' : 'You pick as KEEPER';

  const phaseHint =
    phase === 'PICK'
      ? 'Tap a goal zone · 10s to lock in'
      : phase === 'REVEAL'
        ? 'Revealing picks…'
        : phase === 'RESOLVE' && lastPoint
          ? lastPoint === 'KICKER_POINT'
            ? 'KICKER POINT'
            : 'KEEPER POINT'
          : '';

  const roundLabel = teamMode
    ? `Duel ${round} / ${maxRounds}${teamLeg === 'second' ? ' · Return leg' : ''}`
    : isSuddenDeath
      ? 'Sudden Death'
      : `Round ${Math.min(round, maxRounds)} / ${maxRounds}`;

  const scoreLabel = teamMode
    ? `Team ${score.player} – ${score.opponent} AI`
    : `You ${score.player} – ${score.opponent} ${online ? 'Opp' : 'AI'}`;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-2xl bg-slate-950/70 px-4 py-3 backdrop-blur">
          <div className="text-xs uppercase tracking-widest text-slate-400">{roundLabel}</div>
          <div className="mt-1 font-display text-2xl font-bold">{scoreLabel}</div>
          {activeKicker && activeKeeper && (
            <div className="mt-2 text-xs text-slate-400">
              {profileLabel(activeKicker)} kicks · {profileLabel(activeKeeper)} keeps
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-slate-950/70 px-4 py-3 text-right backdrop-blur">
          <div className="text-xs uppercase tracking-widest text-slate-400">Clock</div>
          <div
            className={`font-display text-2xl font-bold tabular-nums ${pickClock <= 2 ? 'text-red-400' : 'text-white'}`}
          >
            {phase === 'PICK' ? `${Math.ceil(pickClock)}s` : '—'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {playerProfile && (
            <span className="rounded-full bg-slate-950/70 px-3 py-1 text-sm backdrop-blur">
              {profileLabel(playerProfile)}
            </span>
          )}
          <span className="rounded-full bg-slate-950/70 px-4 py-2 text-sm backdrop-blur">
            {teamMode && playerControls
              ? `You: ${playerControls.toUpperCase()}`
              : roleLabel}
          </span>
        </div>
        <div className="rounded-full bg-slate-950/50 px-3 py-1 text-xs text-slate-400 backdrop-blur">
          {fps} FPS
        </div>
      </div>

      {phaseHint && (
        <div
          className={`mx-auto rounded-2xl px-6 py-3 text-center font-display text-lg font-bold backdrop-blur sm:text-xl ${
            lastPoint === 'KICKER_POINT'
              ? 'bg-green-500/20 text-green-300'
              : lastPoint === 'KEEPER_POINT'
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-slate-950/70 text-white'
          }`}
        >
          {phaseHint}
        </div>
      )}
    </div>
  );
}
