import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlayerBattingStats {
  games: number;
  ab: number;        // at bats
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  avg: number;       // computed
  obp: number;       // computed
  slg: number;       // computed
}

export interface PlayerPitchingStats {
  games: number;
  ip: number;        // innings pitched (in thirds)
  hits: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  wins: number;
  losses: number;
  era: number;       // computed
  whip: number;      // computed
}

export interface PlayerStats {
  batting: PlayerBattingStats;
  pitching: PlayerPitchingStats;
}

export interface AtBatEvent {
  playerId: string;
  result: 'strikeout' | 'walk' | 'single' | 'double' | 'triple' | 'homeRun' | 'out';
  rbi: number;
  isHomeTeam: boolean;
  gameId: string;
}

export interface PitchEvent {
  playerId: string;
  result: 'strikeout' | 'walk' | 'hit' | 'homeRun' | 'out';
  earnedRun: boolean;
  isHomeTeam: boolean;
  gameId: string;
}

function emptyBatting(): PlayerBattingStats {
  return { games: 0, ab: 0, hits: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0, walks: 0, strikeouts: 0, avg: 0, obp: 0, slg: 0 };
}

function emptyPitching(): PlayerPitchingStats {
  return { games: 0, ip: 0, hits: 0, earnedRuns: 0, walks: 0, strikeouts: 0, wins: 0, losses: 0, era: 0, whip: 0 };
}

function computeBatting(s: PlayerBattingStats): PlayerBattingStats {
  const denom = s.ab || 1;
  return {
    ...s,
    avg: s.hits / denom,
    obp: (s.hits + s.walks) / (s.ab + s.walks || 1),
    slg: (s.hits + s.doubles + s.triples * 2 + s.homeRuns * 3) / denom,
  };
}

function computePitching(s: PlayerPitchingStats): PlayerPitchingStats {
  const ipDenom = s.ip || 1;
  return {
    ...s,
    era: (s.earnedRuns * 9) / ipDenom,
    whip: (s.walks + s.hits) / (s.ip / 3 || 1),
  };
}

const STATS_KEY = '@myteambaseball/player-stats';

export async function loadAllPlayerStats(): Promise<Record<string, PlayerStats>> {
  try {
    const json = await AsyncStorage.getItem(STATS_KEY);
    return json ? JSON.parse(json) : {};
  } catch { return {}; }
}

export async function saveAllPlayerStats(stats: Record<string, PlayerStats>): Promise<void> {
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const all = await loadAllPlayerStats();
  return all[playerId] || { batting: emptyBatting(), pitching: emptyPitching() };
}

export async function recordAtBat(event: AtBatEvent): Promise<PlayerBattingStats> {
  const all = await loadAllPlayerStats();
  const current = all[event.playerId] || { batting: emptyBatting(), pitching: emptyPitching() };
  const b = { ...current.batting, games: current.batting.games + (current.batting.ab === 0 ? 1 : 0) };
  b.rbi += event.rbi;
  switch (event.result) {
    case 'strikeout':
      b.ab++; b.strikeouts++; break;
    case 'walk':
      b.walks++; break;
    case 'single':
      b.ab++; b.hits++; break;
    case 'double':
      b.ab++; b.hits++; b.doubles++; break;
    case 'triple':
      b.ab++; b.hits++; b.triples++; break;
    case 'homeRun':
      b.ab++; b.hits++; b.homeRuns++; break;
    case 'out':
      b.ab++; break;
  }
  current.batting = computeBatting(b);
  all[event.playerId] = current;
  await saveAllPlayerStats(all);
  return current.batting;
}

export async function recordPitch(event: PitchEvent): Promise<PlayerPitchingStats> {
  const all = await loadAllPlayerStats();
  const current = all[event.playerId] || { batting: emptyBatting(), pitching: emptyPitching() };
  const p = { ...current.pitching };
  p.games++;
  // Each at-bat = 1/3 inning
  p.ip += 1;
  if (event.earnedRun) p.earnedRuns++;
  switch (event.result) {
    case 'strikeout':
      p.strikeouts++; break;
    case 'walk':
      p.walks++; break;
    case 'hit':
    case 'homeRun':
      p.hits++; break;
  }
  current.pitching = computePitching(p);
  all[event.playerId] = current;
  await saveAllPlayerStats(all);
  return current.pitching;
}

export async function recordGameEnd(
  homePlayers: string[],
  awayPlayers: string[],
  homeWon: boolean
): Promise<void> {
  const all = await loadAllPlayerStats();
  const update = { ...all };
  // Record win/loss for pitchers
  homePlayers.forEach((id) => {
    if (update[id]) {
      update[id] = {
        ...update[id],
        pitching: { ...update[id].pitching, wins: update[id].pitching.wins + (homeWon ? 1 : 0), losses: update[id].pitching.losses + (homeWon ? 0 : 1) },
      };
    }
  });
  awayPlayers.forEach((id) => {
    if (update[id]) {
      update[id] = {
        ...update[id],
        pitching: { ...update[id].pitching, wins: update[id].pitching.wins + (homeWon ? 0 : 1), losses: update[id].pitching.losses + (homeWon ? 1 : 0) },
      };
    }
  });
  await saveAllPlayerStats(update);
}

export function formatAvg(avg: number): string {
  return avg > 0 ? avg.toFixed(3).slice(1) : '---';
}

export function formatSlg(slg: number): string {
  return slg > 0 ? slg.toFixed(3).slice(1) : '---';
}

export function formatEra(era: number): string {
  return era > 0 ? era.toFixed(2) : '---';
}

export function formatWhip(whip: number): string {
  return whip > 0 ? whip.toFixed(2) : '---';
}