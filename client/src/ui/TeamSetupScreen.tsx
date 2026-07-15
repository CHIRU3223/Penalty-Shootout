import { useState } from 'react';
import { DEFAULT_TEAM_SIZE, FLAG_OPTIONS, getFlagById } from '@pk/shared';
import { loadTeam, saveTeam } from '../lib/storage';

interface TeamSetupScreenProps {
  teamSize?: number;
  onBack: () => void;
  onStart: () => void;
}

export function TeamSetupScreen({
  teamSize = DEFAULT_TEAM_SIZE,
  onBack,
  onStart,
}: TeamSetupScreenProps) {
  const saved = loadTeam(teamSize);
  const [slots, setSlots] = useState(saved.slots);
  const [editingFlag, setEditingFlag] = useState<number | null>(null);

  const updateSlot = (index: number, patch: Partial<{ name: string; flagId: string }>) => {
    setSlots((prev) =>
      prev.map((s) => (s.slot === index ? { ...s, ...patch } : s)),
    );
  };

  const start = () => {
    saveTeam({ teamSize, slots });
    onStart();
  };

  return (
    <div className="flex w-full max-w-lg flex-col gap-6 px-6">
      <div>
        <h2 className="font-display text-3xl font-bold">Team Setup</h2>
        <p className="mt-2 text-slate-400">
          {teamSize}v{teamSize} — each player kicks once, each opponent keeps once.
        </p>
      </div>

      <div className="space-y-3">
        {slots.map((slot, i) => {
          const flag = getFlagById(slot.flagId);
          return (
            <div key={slot.slot} className="rounded-2xl bg-slate-900/80 p-4">
              <div className="mb-2 text-xs uppercase tracking-widest text-slate-500">
                Player {i + 1}{i === 0 ? ' (you)' : ''}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingFlag(editingFlag === i ? null : i)}
                  className="rounded-xl bg-slate-800 px-3 py-2 text-xl hover:bg-slate-700"
                  title="Change flag"
                >
                  {flag?.emoji ?? '🏳️'}
                </button>
                <input
                  type="text"
                  value={slot.name}
                  onChange={(e) => updateSlot(i, { name: e.target.value })}
                  maxLength={24}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-gold"
                />
              </div>
              {editingFlag === i && (
                <div className="mt-3 grid max-h-32 grid-cols-3 gap-1 overflow-y-auto">
                  {FLAG_OPTIONS.slice(0, 15).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        updateSlot(i, { flagId: f.id });
                        setEditingFlag(null);
                      }}
                      className="rounded-lg bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                    >
                      {f.emoji} {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-sm text-slate-500">
        Opponents are AI. Your team plays {teamSize * 2} duels total ({teamSize} kicks each way).
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={start}
          className="flex-1 rounded-full bg-gold px-6 py-3 font-semibold text-slate-950 hover:bg-yellow-300"
        >
          Start Team Match
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-600 px-6 py-3 hover:bg-slate-800"
        >
          Back
        </button>
      </div>
    </div>
  );
}
