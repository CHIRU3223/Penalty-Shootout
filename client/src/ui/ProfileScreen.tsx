import { useState } from 'react';
import { FLAG_OPTIONS, getFlagById } from '@pk/shared';
import { loadProfile, loadStats, saveProfile } from '../lib/storage';

interface ProfileScreenProps {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const initial = loadProfile();
  const stats = loadStats();
  const [name, setName] = useState(initial.name);
  const [flagId, setFlagId] = useState(initial.flagId);

  const selectedFlag = getFlagById(flagId);

  const save = () => {
    saveProfile({ ...initial, name: name.trim() || 'Player', flagId });
    onBack();
  };

  return (
    <div className="flex w-full max-w-lg flex-col gap-6 px-6">
      <h2 className="font-display text-3xl font-bold">Your Profile</h2>

      <div className="rounded-2xl bg-slate-900/80 p-5">
        <label className="mb-2 block text-sm text-slate-400">Display name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-gold"
          placeholder="Player name"
        />
      </div>

      <div className="rounded-2xl bg-slate-900/80 p-5">
        <label className="mb-3 block text-sm text-slate-400">Flag (country or club)</label>
        <div className="mb-3 text-2xl">
          {selectedFlag ? `${selectedFlag.emoji} ${selectedFlag.label}` : flagId}
        </div>
        <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {FLAG_OPTIONS.map((flag) => (
            <button
              key={flag.id}
              type="button"
              onClick={() => setFlagId(flag.id)}
              className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                flagId === flag.id
                  ? 'bg-gold/20 text-gold ring-1 ring-gold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="mr-2">{flag.emoji}</span>
              {flag.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900/80 p-5 text-sm text-slate-300">
        <h3 className="mb-3 font-semibold text-white">Stats (saved locally)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>Matches: {stats.matchesPlayed}</div>
          <div>Wins: {stats.matchesWon}</div>
          <div>Kicker pts: {stats.kickerPoints}</div>
          <div>Keeper pts: {stats.keeperPoints}</div>
          <div>Team wins: {stats.teamWins}</div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={save}
          className="flex-1 rounded-full bg-gold px-6 py-3 font-semibold text-slate-950 hover:bg-yellow-300"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-600 px-6 py-3 hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
