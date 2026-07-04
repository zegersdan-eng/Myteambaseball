import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SeasonGame {
  id: string;
  opponentId: string;
  opponentName: string;
  isHome: boolean;
  week: number;
  completed: boolean;
  won?: boolean;
  teamScore?: number;
  opponentScore?: number;
}

export interface SeasonStanding {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  pct: number;
  gb: number;
}

export interface SeasonData {
  id: string;
  name: string;
  games: SeasonGame[];
  currentWeek: number;
  completed: boolean;
  champion?: string;
  timestamp: number;
}

const SEASON_KEY = '@myteambaseball/season/current';
const SEASON_HISTORY_KEY = '@myteambaseball/season/history';

export function generateSchedule(homeTeamId: string, homeTeamName: string, opponents: { id: string; name: string }[]): SeasonGame[] {
  const games: SeasonGame[] = [];
  opponents.forEach((opp, i) => {
    games.push({
      id: `game-${i}-1`,
      opponentId: opp.id,
      opponentName: opp.name,
      isHome: i % 2 === 0,
      week: i + 1,
      completed: false,
    });
  });
  return games;
}

export function createSeason(homeTeamId: string, homeTeamName: string, opponents: { id: string; name: string }[]): SeasonData {
  return {
    id: `season-${Date.now()}`,
    name: `${homeTeamName} Season`,
    games: generateSchedule(homeTeamId, homeTeamName, opponents),
    currentWeek: 0,
    completed: false,
    timestamp: Date.now(),
  };
}

export function calculateStandings(games: SeasonGame[], allTeams: { id: string; name: string }[]): SeasonStanding[] {
  const map: Record<string, { wins: number; losses: number; ties: number }> = {};
  allTeams.forEach((t) => { map[t.id] = { wins: 0, losses: 0, ties: 0 }; });
  games.filter((g) => g.completed).forEach((g) => {
    if (g.won !== undefined) {
      if (g.won) { map[g.opponentId].losses++; } else { map[g.opponentId].wins++; }
    }
  });
  const standings = allTeams
    .filter((t) => map[t.id])
    .map((t) => ({
      teamId: t.id,
      teamName: t.name,
      ...map[t.id],
      pct: map[t.id].wins + map[t.id].losses > 0 ? map[t.id].wins / (map[t.id].wins + map[t.id].losses) : 0,
      gb: 0,
    }))
    .sort((a, b) => b.pct - a.pct || (b.wins - a.wins));
  // Calculate games back
  const leader = standings[0];
  if (leader) {
    standings.forEach((s) => {
      s.gb = parseFloat((((leader.wins - leader.losses) - (s.wins - s.losses)) / 2).toFixed(1));
    });
  }
  return standings;
}

export function getPlayoffBracket(standings: SeasonStanding[]): { semi1: [string, string]; semi2: [string, string]; final: [string, string] } | null {
  if (standings.length < 4) return null;
  return {
    semi1: [standings[0].teamId, standings[3].teamId],
    semi2: [standings[1].teamId, standings[2].teamId],
    final: ['Winner Semi 1', 'Winner Semi 2'],
  };
}

export async function saveSeason(season: SeasonData): Promise<void> {
  await AsyncStorage.setItem(SEASON_KEY, JSON.stringify(season));
}

export async function loadSeason(): Promise<SeasonData | null> {
  try {
    const json = await AsyncStorage.getItem(SEASON_KEY);
    return json ? JSON.parse(json) : null;
  } catch { return null; }
}

export async function markGameComplete(season: SeasonData, gameId: string, won: boolean, teamScore: number, opponentScore: number): Promise<SeasonData> {
  const games = season.games.map((g) =>
    g.id === gameId ? { ...g, completed: true, won, teamScore, opponentScore } : g
  );
  const currentWeek = Math.min(season.currentWeek + 1, games.length);
  const completed = currentWeek >= games.length;
  return { ...season, games, currentWeek, completed };
}

export async function saveSeasonHistory(season: SeasonData): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(SEASON_HISTORY_KEY);
    const history: SeasonData[] = json ? JSON.parse(json) : [];
    history.unshift(season);
    await AsyncStorage.setItem(SEASON_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
  } catch { /* noop */ }
}

export async function loadSeasonHistory(): Promise<SeasonData[]> {
  try {
    const json = await AsyncStorage.getItem(SEASON_HISTORY_KEY);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function clearSeason(): Promise<void> {
  await AsyncStorage.removeItem(SEASON_KEY);
}