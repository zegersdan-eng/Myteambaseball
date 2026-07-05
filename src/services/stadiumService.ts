import AsyncStorage from '@react-native-async-storage/async-storage';

export type StadiumId = 'default' | 'sunset' | 'night' | 'cloudy';

export interface Stadium {
  id: StadiumId;
  name: string;
  unlockWins: number;   // 0 = always unlocked
  description: string;
  fieldImage?: any;     // Designer's PNG
}

export const STADIUMS: Stadium[] = [
  { id: 'default', name: 'Sunny Field', unlockWins: 0, description: 'Your home field — always ready to play.' },
  { id: 'sunset', name: 'Sunset Park', unlockWins: 5, description: 'Golden hour baseball. Win 5 games to unlock.' },
  { id: 'night', name: 'Night Stadium', unlockWins: 15, description: 'Lights on! Win 15 games to unlock.' },
  { id: 'cloudy', name: 'Cloudy Diamond', unlockWins: 30, description: 'Overcast and cool. Win 30 games to unlock.' },
];

const STADIUM_KEY = '@myteambaseball/selectedStadium';

export async function getSelectedStadium(): Promise<StadiumId> {
  try {
    const val = await AsyncStorage.getItem(STADIUM_KEY);
    return (val as StadiumId) || 'default';
  } catch { return 'default'; }
}

export async function selectStadium(id: StadiumId): Promise<void> {
  await AsyncStorage.setItem(STADIUM_KEY, id);
}

export function isStadiumUnlocked(stadium: Stadium, totalWins: number): boolean {
  return totalWins >= stadium.unlockWins;
}

export function generateStatCard(playerName: string, teamName: string, stats: { avg?: string; hr?: number; rbi?: number; obp?: string; era?: string; ops?: string; hits?: number; games?: number }): string {
  const lines = [
    `⚾ My Team Baseball - Player Report`,
    `═══════════════════════════`,
    `${playerName} — #${teamName}`,
    `═══════════════════════════`,
    stats.games ? `Games Played: ${stats.games}` : '',
    stats.avg ? `Batting Avg: ${stats.avg}` : '',
    stats.obp ? `On-Base %: ${stats.obp}` : '',
    stats.hr !== undefined ? `Home Runs: ${stats.hr}` : '',
    stats.rbi !== undefined ? `RBIs: ${stats.rbi}` : '',
    stats.hits !== undefined ? `Hits: ${stats.hits}` : '',
    stats.era ? `ERA: ${stats.era}` : '',
    `═══════════════════════════`,
    `Tracked by My Team Baseball app`,
  ];
  return lines.filter(Boolean).join('\n');
}