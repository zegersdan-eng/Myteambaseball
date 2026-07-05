import type { Team, RecapData } from './types';
import { PRELOADED_TEAMS } from './data';
import { STADIUM_DATA } from './types';
import type { Stadium } from './types';

const STORAGE_KEYS = {
  TEAMS: 'mtb_teams',
  RECORDS: 'mtb_records',
  STATE: 'mtb_state',
  ACHIEVEMENTS: 'mtb_achievements',
  STADIUMS: 'mtb_stadiums',
  PREMIUM: 'mtb_premium',
  GAMES_PLAYED: 'mtb_games',
  TUTORIAL: 'mtb_tutorial',
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage might be full
  }
}

export function loadTeams(): Team[] {
  const saved = getItem<Team[]>(STORAGE_KEYS.TEAMS, []);
  // Merge saved teams with preloaded ones (saved ones override)
  const merged = [...PRELOADED_TEAMS];
  for (const savedTeam of saved) {
    const idx = merged.findIndex(t => t.id === savedTeam.id);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], ...savedTeam, record: savedTeam.record };
    } else {
      merged.push(savedTeam);
    }
  }
  return merged;
}

export function saveTeams(teams: Team[]): void {
  const customTeams = teams.filter(t => t.isCustom);
  const records = teams.map(t => ({ id: t.id, record: t.record, colors: t.colors, jerseyNumber: t.jerseyNumber, teamPhoto: t.teamPhoto }));
  setItem(STORAGE_KEYS.TEAMS, customTeams);
  setItem(STORAGE_KEYS.RECORDS, records);
}

export function loadRecords(): Record<string, { wins: number; losses: number; colors?: any; jerseyNumber?: string; teamPhoto?: string }> {
  const records = getItem<Array<{ id: string; record: { wins: number; losses: number }; colors?: any; jerseyNumber?: string; teamPhoto?: string }>>(STORAGE_KEYS.RECORDS, []);
  const map: Record<string, { wins: number; losses: number; colors?: any; jerseyNumber?: string; teamPhoto?: string }> = {};
  for (const r of records) {
    map[r.id] = { wins: r.record.wins, losses: r.record.losses, colors: r.colors, jerseyNumber: r.jerseyNumber, teamPhoto: r.teamPhoto };
  }
  return map;
}

export function saveGameRecord(teamId: string, won: boolean): void {
  const records = getItem<Array<{ id: string; record: { wins: number; losses: number } }>>(STORAGE_KEYS.RECORDS, []);
  let entry = records.find(r => r.id === teamId);
  if (!entry) {
    entry = { id: teamId, record: { wins: 0, losses: 0 } };
    records.push(entry);
  }
  if (won) entry.record.wins++;
  else entry.record.losses++;
  setItem(STORAGE_KEYS.RECORDS, records);
}

export function loadStadiums(): Stadium[] {
  const saved = getItem<Stadium[]>(STORAGE_KEYS.STADIUMS, []);
  if (saved.length === 0) {
    // Only first stadium unlocked by default
    const defaultStadiums = STADIUM_DATA.map((s, i) => ({ ...s, unlocked: i === 0 }));
    setItem(STORAGE_KEYS.STADIUMS, defaultStadiums);
    return defaultStadiums;
  }
  return saved;
}

export function saveStadiums(stadiums: Stadium[]): void {
  setItem(STORAGE_KEYS.STADIUMS, stadiums);
}

export function unlockStadium(stadiumId: string): void {
  const stadiums = loadStadiums();
  const updated = stadiums.map(s => s.id === stadiumId ? { ...s, unlocked: true } : s);
  saveStadiums(updated);
}

export function loadAchievements(): string[] {
  return getItem<string[]>(STORAGE_KEYS.ACHIEVEMENTS, []);
}

export function unlockAchievement(id: string): void {
  const unlocked = loadAchievements();
  if (!unlocked.includes(id)) {
    unlocked.push(id);
    setItem(STORAGE_KEYS.ACHIEVEMENTS, unlocked);
  }
}

export function isPremium(): boolean {
  return getItem(STORAGE_KEYS.PREMIUM, false);
}

export function setPremium(val: boolean): void {
  setItem(STORAGE_KEYS.PREMIUM, val);
}

export function getGamesPlayed(): number {
  return getItem(STORAGE_KEYS.GAMES_PLAYED, 0);
}

export function incrementGamesPlayed(): void {
  const count = getGamesPlayed() + 1;
  setItem(STORAGE_KEYS.GAMES_PLAYED, count);
}

export function hasSeenTutorial(): boolean {
  return getItem(STORAGE_KEYS.TUTORIAL, false);
}

export function setTutorialSeen(): void {
  setItem(STORAGE_KEYS.TUTORIAL, true);
}

export function saveLastRecap(recap: RecapData): void {
  setItem('mtb_last_recap', recap);
}

export function loadLastRecap(): RecapData | null {
  return getItem<RecapData | null>('mtb_last_recap', null);
}

export function importFromGameChanger(json: string): Team | null {
  try {
    const data = JSON.parse(json);
    const players = (data.players || []).map((p: any, i: number) => ({
      id: `gc_${i}`,
      name: p.name || `Player ${i + 1}`,
      number: p.number || i + 1,
      position: p.position || 'DH',
      battingAvg: typeof p.battingAverage === 'number' ? p.battingAverage : 0.250,
      pitchingERA: typeof p.era === 'number' ? p.era : 9.99,
      throws: 'R',
      bats: 'R',
      appearance: {
        skinColor: '#f0c8a0',
        hairColor: '#4a2c0a',
        eyeColor: '#664422',
        height: 'average' as const,
        build: 'average' as const,
      },
    }));

    const teamName = data.teamName || 'Imported Team';
    const teamId = `gc_${Date.now()}`;

    return {
      id: teamId,
      name: teamName,
      shortName: teamName.substring(0, 6),
      players,
      colors: { primary: '#2196F3', secondary: '#FF5722', accent: '#ffffff' },
      stadium: 'sunset',
      record: { wins: 0, losses: 0 },
      isCustom: true,
    };
  } catch {
    return null;
  }
}

export function importFromCSV(csv: string): Team | null {
  try {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return null;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const players = lines.slice(1).map((line, i) => {
      const vals = line.split(',').map(v => v.trim());
      const getVal = (header: string): string => {
        const idx = headers.indexOf(header);
        return idx >= 0 ? vals[idx] || '' : '';
      };

      return {
        id: `csv_${Date.now()}_${i}`,
        name: getVal('name') || getVal('player') || `Player ${i + 1}`,
        number: parseInt(getVal('number') || getVal('num') || getVal('#') || `${i + 1}`),
        position: getVal('position') || getVal('pos') || 'DH',
        battingAvg: parseFloat(getVal('batting average') || getVal('avg') || getVal('battingavg') || '0.250'),
        pitchingERA: parseFloat(getVal('era') || getVal('pitching era') || '9.99'),
        throws: (getVal('throws') || 'R') as 'R' | 'L',
        bats: (getVal('bats') || 'R') as 'R' | 'L',
        appearance: {
          skinColor: '#f0c8a0',
          hairColor: '#4a2c0a',
          eyeColor: '#664422',
          height: 'average' as const,
          build: 'average' as const,
        },
      };
    });

    const teamName = 'Imported Team';
    return {
      id: `csv_${Date.now()}`,
      name: teamName,
      shortName: teamName.substring(0, 6),
      players,
      colors: { primary: '#4CAF50', secondary: '#FF9800', accent: '#ffffff' },
      stadium: 'sunset',
      record: { wins: 0, losses: 0 },
      isCustom: true,
    };
  } catch {
    return null;
  }
}