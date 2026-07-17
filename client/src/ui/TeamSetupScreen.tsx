import { useEffect, useState } from 'react';

import {

  DEFAULT_TEAM_PLAYERS,

  FLAG_OPTIONS,

  MAX_TEAM_PLAYERS,

  MIN_TEAM_PLAYERS,

  getFlagById,

} from '@pk/shared';

import {

  aiSlotsNeeded,

  canOfferAiTeammate,

  clampHumanCount,

  loadTeam,

  resolveTeamSize,

  saveTeam,

  totalTeamDuels,

} from '../lib/storage';

import { useAppStore } from '../store/appStore';



interface TeamSetupScreenProps {

  onBack: () => void;

  onContinue: (inviteOnline: boolean) => void;

}



export function TeamSetupScreen({ onBack, onContinue }: TeamSetupScreenProps) {

  const setHumanCount = useAppStore((s) => s.setHumanCount);

  const [humanCount, setLocalHumanCount] = useState(DEFAULT_TEAM_PLAYERS);

  const [includeAiTeammate, setIncludeAiTeammate] = useState(
    () => loadTeam(DEFAULT_TEAM_PLAYERS).includeAiTeammate,
  );

  const [teamNameA, setTeamNameA] = useState('Your Team');

  const [teamNameB, setTeamNameB] = useState('AI United');

  const [slots, setSlots] = useState(() => loadTeam(DEFAULT_TEAM_PLAYERS).slots);

  const [editingFlag, setEditingFlag] = useState<number | null>(null);



  const showAiToggle = canOfferAiTeammate(humanCount);

  const teamSize = resolveTeamSize(humanCount, includeAiTeammate);

  const aiCount = aiSlotsNeeded(humanCount, includeAiTeammate);

  const totalDuels = totalTeamDuels(teamSize);



  useEffect(() => {

    const saved = loadTeam(humanCount, includeAiTeammate);

    setSlots(saved.slots);

    setTeamNameA(saved.teamNameA);

    setTeamNameB(saved.teamNameB);

    setIncludeAiTeammate(saved.includeAiTeammate);

  }, [humanCount, includeAiTeammate]);



  const updateSlot = (index: number, patch: Partial<{ name: string; flagId: string }>) => {

    setSlots((prev) =>

      prev.map((s) => (s.slot === index && !s.isAi ? { ...s, ...patch } : s)),

    );

  };



  const finishSetup = (inviteOnline: boolean) => {

    const team = {

      humanCount: clampHumanCount(humanCount),

      teamSize,

      includeAiTeammate: showAiToggle ? includeAiTeammate : false,

      teamNameA: teamNameA.trim() || 'Your Team',

      teamNameB: teamNameB.trim() || 'AI United',

      slots,

    };

    saveTeam(team);

    setHumanCount(team.humanCount);

    onContinue(inviteOnline);

  };



  return (

    <div className="flex w-full max-w-lg flex-col gap-6 px-6">

      <div>

        <h2 className="font-display text-3xl font-bold">Team Setup</h2>

        <p className="mt-2 text-slate-400">

          Any squad size. Each player kicks and keeps{' '}

          <strong className="text-white">2 times</strong>.

        </p>

      </div>



      <div className="grid gap-3 sm:grid-cols-2">

        <label className="rounded-2xl bg-slate-900/80 p-4">

          <span className="mb-2 block text-xs uppercase tracking-widest text-slate-500">

            Your team name

          </span>

          <input

            type="text"

            value={teamNameA}

            onChange={(e) => setTeamNameA(e.target.value)}

            maxLength={24}

            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-gold"

          />

        </label>

        <label className="rounded-2xl bg-slate-900/80 p-4">

          <span className="mb-2 block text-xs uppercase tracking-widest text-slate-500">

            Opponent team name

          </span>

          <input

            type="text"

            value={teamNameB}

            onChange={(e) => setTeamNameB(e.target.value)}

            maxLength={24}

            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-gold"

          />

        </label>

      </div>



      <label className="rounded-2xl bg-slate-900/80 p-4">

        <span className="mb-2 block text-xs uppercase tracking-widest text-slate-500">

          Players on your team ({MIN_TEAM_PLAYERS}–{MAX_TEAM_PLAYERS})

        </span>

        <input

          type="number"

          min={MIN_TEAM_PLAYERS}

          max={MAX_TEAM_PLAYERS}

          value={humanCount}

          onChange={(e) => setLocalHumanCount(clampHumanCount(Number(e.target.value)))}

          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-gold"

        />

        <p className="mt-2 text-xs text-slate-500">

          {teamSize}v{teamSize} match

          {aiCount > 0 ? ` · ${aiCount} AI teammate${aiCount > 1 ? 's' : ''}` : ''}

          {' · '}

          {totalDuels} duels total

        </p>

      </label>



      {showAiToggle && (

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-4">

          <input

            type="checkbox"

            checked={includeAiTeammate}

            onChange={(e) => setIncludeAiTeammate(e.target.checked)}

            className="mt-1 h-4 w-4 rounded border-slate-600 accent-gold"

          />

          <span>

            <span className="block font-medium text-white">Add AI teammate</span>

            <span className="mt-1 block text-sm text-slate-400">

              Optional famous footballer fills the extra slot so your squad matches the

              opponent team size. Turn off to play with an odd-sized squad — invite online

              friends to fill every slot instead.

            </span>

          </span>

        </label>

      )}



      <div className="space-y-3">

        {slots.map((slot, i) => {

          const flag = getFlagById(slot.flagId);

          return (

            <div key={slot.slot} className="rounded-2xl bg-slate-900/80 p-4">

              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-slate-500">

                <span>

                  {slot.isAi ? 'AI teammate' : `Player ${i + 1}`}

                  {i === 0 && !slot.isAi ? ' (you)' : ''}

                </span>

                {slot.isAi && <span className="text-gold">Auto</span>}

              </div>

              <div className="flex items-center gap-3">

                {!slot.isAi ? (

                  <button

                    type="button"

                    onClick={() => setEditingFlag(editingFlag === i ? null : i)}

                    className="rounded-xl bg-slate-800 px-3 py-2 text-xl hover:bg-slate-700"

                    title="Change flag"

                  >

                    {flag?.emoji ?? '🏳️'}

                  </button>

                ) : (

                  <span className="rounded-xl bg-slate-800 px-3 py-2 text-xl">{flag?.emoji ?? '⚽'}</span>

                )}

                <input

                  type="text"

                  value={slot.name}

                  onChange={(e) => updateSlot(i, { name: e.target.value })}

                  readOnly={slot.isAi}

                  maxLength={24}

                  className={`flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none ${

                    slot.isAi ? 'text-slate-400' : 'focus:border-gold'

                  }`}

                />

              </div>

              {editingFlag === i && !slot.isAi && (

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



      <div className="flex flex-col gap-3 sm:flex-row">

        <button

          type="button"

          onClick={() => finishSetup(false)}

          className="flex-1 rounded-full bg-gold px-6 py-3 font-semibold text-slate-950 hover:bg-yellow-300"

        >

          Play Local vs AI

        </button>

        <button

          type="button"

          onClick={() => finishSetup(true)}

          className="flex-1 rounded-full border border-gold/60 px-6 py-3 font-semibold text-gold hover:bg-gold/10"

        >

          Invite Online

        </button>

      </div>

      <button

        type="button"

        onClick={onBack}

        className="rounded-full border border-slate-600 px-6 py-3 hover:bg-slate-800"

      >

        Back

      </button>

    </div>

  );

}


