import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GameResult {
  id: string;
  timestamp: number;
  teamId: string;          // The team that played (home team)
  opponentId: string;      // The opponent team
  teamScore: number;       // Home team score
  opponentScore: number;   // Away team score
  won: boolean;            // Did the team win?
  innings: number;         // How many innings played
}

const HISTORY_KEY_PREFIX = '@myteambaseball/history/';

/** Save a game result to history */
export async function saveGameResult(result: GameResult): Promise<void> {
  const key = HISTORY_KEY_PREFIX + result.teamId;
  const existing = await loadGameHistory(result.teamId);
  existing.push(result);
  // Keep only last 100 games per team
  const limited = existing.slice(-100);
  await AsyncStorage.setItem(key, JSON.stringify(limited));
}

/** Load game history for a specific team */
export async function loadGameHistory(teamId: string): Promise<GameResult[]> {
  const key = HISTORY_KEY_PREFIX + teamId;
  const json = await AsyncStorage.getItem(key);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/** Calculate W-L record for a team */
export async function getTeamRecord(teamId: string): Promise<{ wins: number; losses: number; ties: number }> {
  const history = await loadGameHistory(teamId);
  const wins = history.filter((g) => g.won).length;
  const losses = history.filter((g) => !g.won && g.teamScore !== g.opponentScore).length;
  const ties = history.filter((g) => g.teamScore === g.opponentScore).length;
  return { wins, losses, ties };
}

/** Get head-to-head record between two teams */
export async function getHeadToHead(teamId: string, opponentId: string): Promise<{ wins: number; losses: number }> {
  const history = await loadGameHistory(teamId);
  const matches = history.filter((g) => g.opponentId === opponentId);
  const wins = matches.filter((g) => g.won).length;
  const losses = matches.filter((g) => !g.won && g.teamScore !== g.opponentScore).length;
  return { wins, losses };
}

/** Get last N games for a team */
export async function getLastGames(teamId: string, count: number = 10): Promise<GameResult[]> {
  const history = await loadGameHistory(teamId);
  return history.slice(-count).reverse();
}