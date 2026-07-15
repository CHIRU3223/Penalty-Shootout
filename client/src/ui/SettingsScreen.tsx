import { useAppStore } from '../store/appStore';
import { setSoundEnabled } from '../game/sounds';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const setStoreSound = useAppStore((s) => s.setSoundEnabled);

  const toggleSound = () => {
    const next = !soundEnabled;
    setStoreSound(next);
    setSoundEnabled(next);
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-6 px-6">
      <h2 className="font-display text-3xl font-bold">Settings</h2>
      <label className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-4">
        <span>Sound effects</span>
        <button
          type="button"
          onClick={toggleSound}
          className={`rounded-full px-4 py-1 text-sm font-medium ${soundEnabled ? 'bg-green-600' : 'bg-slate-600'}`}
        >
          {soundEnabled ? 'On' : 'Off'}
        </button>
      </label>
      <button type="button" onClick={onBack} className="text-sm text-slate-400 hover:text-white">
        ← Back to menu
      </button>
    </div>
  );
}
