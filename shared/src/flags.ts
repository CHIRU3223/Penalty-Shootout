/** Country and club flags for player profiles */

export interface FlagOption {
  id: string;
  label: string;
  emoji: string;
  type: 'country' | 'club';
}

export const FLAG_OPTIONS: FlagOption[] = [
  { id: 'br', label: 'Brazil', emoji: '🇧🇷', type: 'country' },
  { id: 'ar', label: 'Argentina', emoji: '🇦🇷', type: 'country' },
  { id: 'de', label: 'Germany', emoji: '🇩🇪', type: 'country' },
  { id: 'fr', label: 'France', emoji: '🇫🇷', type: 'country' },
  { id: 'es', label: 'Spain', emoji: '🇪🇸', type: 'country' },
  { id: 'it', label: 'Italy', emoji: '🇮🇹', type: 'country' },
  { id: 'gb', label: 'England', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', type: 'country' },
  { id: 'pt', label: 'Portugal', emoji: '🇵🇹', type: 'country' },
  { id: 'nl', label: 'Netherlands', emoji: '🇳🇱', type: 'country' },
  { id: 'us', label: 'USA', emoji: '🇺🇸', type: 'country' },
  { id: 'mx', label: 'Mexico', emoji: '🇲🇽', type: 'country' },
  { id: 'jp', label: 'Japan', emoji: '🇯🇵', type: 'country' },
  { id: 'kr', label: 'South Korea', emoji: '🇰🇷', type: 'country' },
  { id: 'se', label: 'Sweden', emoji: '🇸🇪', type: 'country' },
  { id: 'in', label: 'India', emoji: '🇮🇳', type: 'country' },
  { id: 'rm', label: 'Real Madrid', emoji: '⚪', type: 'club' },
  { id: 'fcb', label: 'Barcelona', emoji: '🔵🔴', type: 'club' },
  { id: 'mufc', label: 'Man United', emoji: '🔴', type: 'club' },
  { id: 'liv', label: 'Liverpool', emoji: '🔴', type: 'club' },
  { id: 'mci', label: 'Man City', emoji: '🔵', type: 'club' },
  { id: 'bay', label: 'Bayern Munich', emoji: '🔴', type: 'club' },
  { id: 'psg', label: 'PSG', emoji: '🔵🔴', type: 'club' },
  { id: 'juv', label: 'Juventus', emoji: '⚫⚪', type: 'club' },
  { id: 'mil', label: 'AC Milan', emoji: '🔴⚫', type: 'club' },
];

export function getFlagById(id: string): FlagOption | undefined {
  return FLAG_OPTIONS.find((f) => f.id === id);
}

export function defaultFlagId(): string {
  return 'br';
}
