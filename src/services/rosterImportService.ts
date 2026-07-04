import Papa from 'papaparse';
import {
  GCRosterCSVRow,
  GCPlayerJSON,
  ImportResult,
  ImportedPlayer,
  ImportError,
} from '../types/gameChanger';

/** Parse a CSV string into our Player model */
export function parseCSVRoster(csvText: string): ImportResult {
  const errors: ImportError[] = [];
  const players: ImportedPlayer[] = [];

  const result = Papa.parse<GCRosterCSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (result.errors && result.errors.length > 0) {
    for (const err of result.errors) {
      errors.push({
        row: (err.row ?? 0) + 1,
        message: err.message,
      });
    }
  }

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    try {
      const player = mapCSVRowToPlayer(row);
      if (player) {
        players.push(player);
      } else {
        errors.push({ row: i + 1, message: 'Empty or invalid row skipped' });
      }
    } catch (e: any) {
      errors.push({ row: i + 1, message: e.message || 'Parse error' });
    }
  }

  return {
    success: errors.length === 0 || players.length > 0,
    players,
    errors,
  };
}

/** Parse a JSON string (array of players) into our Player model */
export function parseJSONRoster(jsonText: string): ImportResult {
  const errors: ImportError[] = [];
  const players: ImportedPlayer[] = [];

  let parsed: any;
  let data: any[] = [];
  try {
    parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      data = parsed;
    } else if (parsed.players && Array.isArray(parsed.players)) {
      data = parsed.players;
    } else if (parsed.roster && Array.isArray(parsed.roster)) {
      data = parsed.roster;
    } else {
      return {
        success: false,
        players: [],
        errors: [{ row: 0, message: 'JSON must be an array of players or have a "players" or "roster" key' }],
      };
    }
  } catch (e: any) {
    return {
      success: false,
      players: [],
      errors: [{ row: 0, message: `Invalid JSON: ${e.message}` }],
    };
  }

  for (let i = 0; i < data.length; i++) {
    try {
      const player = mapJSONToPlayer(data[i]);
      if (player) {
        players.push(player);
      } else {
        errors.push({ row: i + 1, message: 'Empty or invalid entry skipped' });
      }
    } catch (e: any) {
      errors.push({ row: i + 1, message: e.message || 'Parse error' });
    }
  }

  return {
    success: errors.length === 0 || players.length > 0,
    players,
    errors,
  };
}

/** Map a CSV row (with various column name formats) to a Player */
function mapCSVRowToPlayer(row: GCRosterCSVRow): ImportedPlayer | null {
  // Try to find name columns — GameChanger exports vary
  const firstName = row['First Name'] || row['FirstName'] || row['first_name'] || row['first'] || '';
  const lastName = row['Last Name'] || row['LastName'] || row['last_name'] || row['last'] || '';
  const fullName = row['Name'] || row['name'] || row['Player'] || row['player'] || '';

  const name = fullName || `${firstName} ${lastName}`.trim();
  if (!name) return null;

  // Number
  const numRaw = row['Jersey Number'] || row['JerseyNumber'] || row['jersey_number'] || row['Number'] || row['number'] || row['#'] || '0';
  const number = parseInt(String(numRaw).replace(/[^0-9]/g, ''), 10) || 0;

  // Position
  const primaryPos = row['Primary Position'] || row['PrimaryPosition'] || row['primary_position'] || row['Position'] || row['position'] || '';
  const secondaryPos = row['Secondary Position'] || row['SecondaryPosition'] || row['secondary_position'] || '';
  const position = primaryPos || secondaryPos || 'UTIL';

  // Stats
  const battingAvg = parseStat(row['Batting Average'] || row['BattingAverage'] || row['batting_avg'] || row['AVG'] || row['avg'] || '');
  const era = parseStat(row['ERA'] || row['era'] || '');
  const obp = parseStat(row['On Base Percentage'] || row['OBP'] || row['obp'] || row['OnBasePercentage'] || '');

  return {
    name,
    number,
    position: normalizePosition(position),
    battingAvg: battingAvg > 0 ? battingAvg : 0,
    era,
    obp: obp > 0 ? obp : 0,
    photoURL: null,
  };
}

/** Map a JSON player object to our Player model */
function mapJSONToPlayer(obj: any): ImportedPlayer | null {
  const name = obj.name || obj.fullName || obj.full_name ||
    `${obj.firstName || obj.first_name || ''} ${obj.lastName || obj.last_name || ''}`.trim();
  if (!name) return null;

  const numRaw = obj.number || obj.jerseyNumber || obj.jersey_number || obj.jersey || obj['#'];
  const number = parseInt(String(numRaw).replace(/[^0-9]/g, ''), 10) || 0;

  const position = obj.position || obj.primaryPosition || obj.primary_position || 'UTIL';
  const battingAvg = parseStat(obj.battingAvg ?? obj.batting_avg ?? obj.avg ?? obj.AVG ?? obj.battingAverage ?? null);
  const era = parseStat(obj.era ?? obj.ERA ?? null);
  const obp = parseStat(obj.obp ?? obj.OBP ?? obj.onBasePercentage ?? obj.on_base_percentage ?? null);

  return {
    name,
    number,
    position: normalizePosition(position),
    battingAvg: battingAvg > 0 ? battingAvg : 0,
    era,
    obp: obp > 0 ? obp : 0,
    photoURL: obj.photoURL || obj.photo_url || obj.photo || null,
  };
}

/** Parse a stat string (e.g. ".350", "0.350", "2.15") into a number */
function parseStat(val: string | null | undefined): number {
  if (val === null || val === undefined || val === '') return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/** Normalize position shorthand to standard format */
function normalizePosition(pos: string): string {
  const p = pos.trim().toUpperCase();
  const map: Record<string, string> = {
    'P': 'P', 'PITCHER': 'P', 'PITCH': 'P',
    'C': 'C', 'CATCHER': 'C', 'CATCH': 'C',
    '1B': '1B', 'FIRST': '1B', 'FIRST BASE': '1B',
    '2B': '2B', 'SECOND': '2B', 'SECOND BASE': '2B',
    '3B': '3B', 'THIRD': '3B', 'THIRD BASE': '3B',
    'SS': 'SS', 'SHORT': 'SS', 'SHORTSTOP': 'SS',
    'LF': 'LF', 'LEFT': 'LF', 'LEFT FIELD': 'LF',
    'CF': 'CF', 'CENTER': 'CF', 'CENTER FIELD': 'CF',
    'RF': 'RF', 'RIGHT': 'RF', 'RIGHT FIELD': 'RF',
    'DH': 'DH', 'DESIGNATED': 'DH', 'DESIGNATED HITTER': 'DH',
    'UTIL': 'UTIL', 'UTILITY': 'UTIL', 'BENCH': 'UTIL',
  };
  return map[p] || p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

/** Generate a sample CSV for demo purposes */
export function generateSampleCSV(): string {
  const headers = ['First Name', 'Last Name', 'Jersey Number', 'Primary Position', 'Batting Average', 'ERA', 'OBP'];
  const rows = [
    ['Alex', 'Martinez', '7', 'P', '.385', '2.15', '.475'],
    ['Jordan', 'Kim', '12', 'C', '.320', '', '.420'],
    ['Sam', 'Rivera', '3', '1B', '.450', '', '.520'],
    ['Casey', 'Thompson', '22', '2B', '.275', '', '.365'],
    ['Riley', 'Chen', '8', '3B', '.340', '', '.410'],
    ['Morgan', 'Patel', '14', 'SS', '.290', '', '.380'],
    ['Dakota', 'Williams', '5', 'LF', '.310', '', '.395'],
    ['Taylor', 'Johnson', '19', 'CF', '.365', '', '.445'],
    ['Reese', "O'Brien", '2', 'RF', '.255', '', '.340'],
    ['Avery', 'Brooks', '10', 'P', '.220', '3.50', '.310'],
    ['Quinn', 'Davis', '25', 'DH', '.410', '', '.480'],
    ['Blake', 'Wilson', '17', 'UTIL', '.300', '4.20', '.375'],
  ];

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// ============================================================
// Smart auto-fill helpers for incomplete imports
// ============================================================

const POSITION_DISTRIBUTION: string[] = [
  'P', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UTIL',
];

/** Auto-assign a sensible position based on player index and roster size */
export function autoAssignPosition(index: number, totalPlayers: number): string {
  // For small rosters (<12), spread out positions logically
  const basePositions = ['P', 'C', '1B', '2B', '3B', 'SS', 'OF', 'OF', 'OF', 'P', 'DH', 'UTIL'];
  const pos = basePositions[index % basePositions.length];
  if (pos === 'OF') {
    const ofPositions = ['LF', 'CF', 'RF'];
    return ofPositions[Math.floor(index / basePositions.length) % ofPositions.length];
  }
  return pos;
}

/** Generate realistic youth baseball stats */
export function generateRandomStats(): { battingAvg: number; era: number; obp: number } {
  // Batting average: .200-.450, with slight bias toward .250-.350
  const battingAvg = parseFloat((0.200 + Math.random() * 0.250).toFixed(3));

  // ERA: only for pitchers (determined elsewhere), 1.00-5.00
  const era = parseFloat((1.00 + Math.random() * 4.00).toFixed(2));

  // OBP: typically .050-.120 higher than AVG
  const obpGap = 0.050 + Math.random() * 0.120;
  const obp = parseFloat(Math.min(battingAvg + obpGap, 0.600).toFixed(3));

  return { battingAvg, era, obp };
}

const SKIN_TONES = ['light', 'medium', 'tan', 'dark', 'deep'] as const;
const HAIR_STYLES = ['short', 'buzz', 'curly', 'long', 'bald'] as const;

/** Auto-assign random appearance for a player */
export function autoAssignAppearance(): {
  skinTone: string; hairStyle: string; glasses: boolean;
  throwsHand: string; batsHand: string;
} {
  const roll = Math.random();
  // 70% righty, 25% lefty, 5% switch
  const throwsHand = roll < 0.70 ? 'right' : roll < 0.95 ? 'left' : 'right';
  const batsHand = roll < 0.70 ? 'right' : roll < 0.95 ? 'left' : 'switch';

  return {
    skinTone: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
    hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)],
    glasses: Math.random() < 0.15, // 15% wear glasses
    throwsHand,
    batsHand,
  };
}

/** Default team colors for auto-assignment */
export const TEAM_COLORS = [
  { primary: '#1a472a', secondary: '#c5a028', name: 'Forest Green' },
  { primary: '#1a365d', secondary: '#e2e8f0', name: 'Navy' },
  { primary: '#9b2c2c', secondary: '#fcd34d', name: 'Cardinal Red' },
  { primary: '#553c9a', secondary: '#e9d8fd', name: 'Purple' },
  { primary: '#c05621', secondary: '#fefcbf', name: 'Orange' },
  { primary: '#2c7a7b', secondary: '#e6fffa', name: 'Teal' },
  { primary: '#374151', secondary: '#f59e0b', name: 'Charcoal' },
  { primary: '#1A56DB', secondary: '#ffffff', name: 'Royal Blue' },
];

/** Auto-assign a team color based on team name hash */
export function autoAssignTeamColor(teamName: string): { primary: string; secondary: string } {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = ((hash << 5) - hash + teamName.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % TEAM_COLORS.length;
  return {
    primary: TEAM_COLORS[index].primary,
    secondary: TEAM_COLORS[index].secondary,
  };
}