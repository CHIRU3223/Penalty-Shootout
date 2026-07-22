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
            The goal is split into zones. Difficulty sets the grid: Beginner uses 3 zones (left,
            middle, right), Intermediate uses 6, and Pro uses the full 9-zone (3×3) grid. Each
            round, kicker and keeper both pick a zone within 10 seconds.
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
          <p>
            10 duels total — you kick 5 times and keep 5 times (roles alternate each duel). Tied
            after all 10? Sudden death until someone leads.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-white">Team Mode Online</h3>
          <p>
            From Team Setup choose &quot;Invite Online&quot; to create a room code. Teammates use
            Join Team Room on the main menu, claim a slot, and ready up. Everyone on your team
            picks zones when it is their kick or keep turn.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-white">Team Mode (Local)</h3>
          <p>
            Pick any squad size (1–8 players). For odd counts you can optionally add a famous
            AI teammate, or turn that off and fill every slot with friends online. Name your team
            and each player. Every squad member kicks twice and keeps twice. First leg: your team
            attacks; return leg: opponents attack. Most team points wins.
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
