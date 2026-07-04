import AsyncStorage from '@react-native-async-storage/async-storage';

const LINEUP_KEY_PREFIX = '@myteambaseball/lineup/';

/** Save batting order for a team (ordered array of player IDs) */
export async function saveLineup(teamId: string, playerIds: string[]): Promise<void> {
  const key = LINEUP_KEY_PREFIX + teamId;
  await AsyncStorage.setItem(key, JSON.stringify(playerIds));
}

/** Load batting order for a team */
export async function loadLineup(teamId: string): Promise<string[] | null> {
  const key = LINEUP_KEY_PREFIX + teamId;
  const json = await AsyncStorage.getItem(key);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Get the correct batter order from a team's lineup or default roster order */
export function getBattingOrder(
  lineupIds: string[] | null,
  rosterPlayerIds: string[]
): string[] {
  if (lineupIds && lineupIds.length > 0) {
    // Use saved lineup, filtering out any players no longer on the roster
    return lineupIds.filter((id) => rosterPlayerIds.includes(id));
  }
  // Default: use roster order
  return rosterPlayerIds;
}