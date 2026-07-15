import type { Difficulty } from '@pk/shared';

const OPTIONS: { id: Difficulty; label: string; description: string }[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'AI picks obvious zones — easier to out-read.',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: 'Balanced AI — mixes corners and centre.',
  },
  {
    id: 'pro',
    label: 'Pro',
    description: 'Smart AI — favours corners, harder to predict.',
  },
];

interface DifficultySelectProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
  onBack: () => void;
  onStart: () => void;
}

export function DifficultySelect({ selected, onSelect, onBack, onStart }: DifficultySelectProps) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-6 px-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold">AI Difficulty</h2>
        <p className="mt-2 text-slate-300">
          Only affects computer opponents in 1v1 and team mode. Online matches are always human
          vs human.
        </p>
      </div>
      <div className="grid gap-3">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`rounded-2xl border px-5 py-4 text-left transition ${
              selected === option.id
                ? 'border-gold bg-gold/10'
                : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
            }`}
          >
            <div className="font-semibold">{option.label}</div>
            <div className="text-sm text-slate-400">{option.description}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-full border border-slate-600 px-6 py-3 font-medium hover:bg-slate-800"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onStart}
          className="flex-1 rounded-full bg-gold px-6 py-3 font-semibold text-slate-950 hover:bg-yellow-300"
        >
          Kick Off
        </button>
      </div>
    </div>
  );
}
