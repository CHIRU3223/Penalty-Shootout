interface HowToPlayProps {
  onBack: () => void;
}

export function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-6 px-6">
      <h2 className="font-display text-3xl font-bold">How to Play</h2>
      <div className="space-y-4 text-slate-300">
        <section>
          <h3 className="font-semibold text-white">Zone Duel</h3>
          <p>
            The goal is split into 9 zones (3×3 grid). Each round, kicker and keeper both pick a
            zone within 10 seconds.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-white">Scoring</h3>
          <p>
            <strong className="text-green-300">Same zone</strong> → Keeper gets the point.
            <br />
            <strong className="text-blue-300">Different zones</strong> → Kicker gets the point.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-white">1v1 Mode</h3>
          <p>5 rounds alternating kicker/keeper roles. Tied? Sudden death duels until someone leads.</p>
        </section>
        <section>
          <h3 className="font-semibold text-white">Team Mode (3v3)</h3>
          <p>
            Set up 3 players with names and flags. Each player kicks once against an AI keeper, then
            each AI player kicks against your keepers. Most team points wins.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-white">Profile &amp; Stats</h3>
          <p>
            Edit your name and flag from the main menu. Wins, points, and team stats are saved in
            your browser (localStorage + cookies).
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-white">Online</h3>
          <p>Create a room, share the code, both ready up. Both players pick zones at the same time each turn.</p>
        </section>
      </div>
      <button type="button" onClick={onBack} className="text-sm text-slate-400 hover:text-white">
        ← Back to menu
      </button>
    </div>
  );
}
