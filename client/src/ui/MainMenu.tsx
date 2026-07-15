import { profileLabel } from '../store/appStore';
import { loadProfile } from '../lib/storage';

interface MainMenuProps {
  onPlaySolo: () => void;
  onPlayTeam: () => void;
  onPlayOnline: () => void;
  onProfile: () => void;
  onHowTo: () => void;
  onSettings: () => void;
}

export function MainMenu({
  onPlaySolo,
  onPlayTeam,
  onPlayOnline,
  onProfile,
  onHowTo,
  onSettings,
}: MainMenuProps) {
  const profile = loadProfile();

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <p className="mb-2 text-sm uppercase tracking-[0.35em] text-gold">Penalty Shootout</p>
        <h1 className="font-display text-5xl font-bold sm:text-6xl">Penalty Kings</h1>
        <p className="mt-4 max-w-md text-slate-300">
          Mind-game zone duels — kicker and keeper pick a goal square. Same zone = keeper point.
          Different = kicker point.
        </p>
        <button
          type="button"
          onClick={onProfile}
          className="mt-3 text-sm text-gold hover:underline"
        >
          {profileLabel(profile)} · Edit profile
        </button>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onPlaySolo}
          className="rounded-full bg-gold px-10 py-4 text-lg font-semibold text-slate-950 transition hover:bg-yellow-300"
        >
          1v1 vs Computer
        </button>
        <button
          type="button"
          onClick={onPlayTeam}
          className="rounded-full border border-gold/60 px-10 py-4 text-lg font-semibold text-gold transition hover:bg-gold/10"
        >
          Team Mode (3v3)
        </button>
        <button
          type="button"
          onClick={onPlayOnline}
          className="rounded-full border border-slate-600 px-10 py-4 text-lg font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          Play Online
        </button>
      </div>
      <div className="flex gap-6 text-sm text-slate-400">
        <button type="button" onClick={onHowTo} className="hover:text-white">
          How to Play
        </button>
        <button type="button" onClick={onSettings} className="hover:text-white">
          Settings
        </button>
      </div>
    </div>
  );
}
