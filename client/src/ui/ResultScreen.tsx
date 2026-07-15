interface ResultScreenProps {
  score: { player: number; opponent: number };
  winner: 'player' | 'opponent' | 'draw';
  teamMode?: boolean;
  onRematch: () => void;
  onMenu: () => void;
}

export function ResultScreen({ score, winner, teamMode, onRematch, onMenu }: ResultScreenProps) {
  const headline =
    winner === 'player'
      ? teamMode
        ? 'Team Wins!'
        : 'You Win!'
      : winner === 'opponent'
        ? teamMode
          ? 'Team Loses'
          : 'You Lose'
        : 'Draw';

  return (
    <div className="flex flex-col items-center gap-8 px-6 text-center">
      <div>
        <p className="mb-2 text-sm uppercase tracking-[0.35em] text-gold">Full Time</p>
        <h2 className="font-display text-4xl font-bold sm:text-5xl">{headline}</h2>
        <p className="mt-4 font-display text-3xl tabular-nums">
          {score.player} – {score.opponent}
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRematch}
          className="flex-1 rounded-full bg-gold px-6 py-3 font-semibold text-slate-950 hover:bg-yellow-300"
        >
          Rematch
        </button>
        <button
          type="button"
          onClick={onMenu}
          className="flex-1 rounded-full border border-slate-600 px-6 py-3 font-medium hover:bg-slate-800"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
