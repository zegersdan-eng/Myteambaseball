/** GameChanger data formats and import types */

/** CSV row that GameChanger exports for rosters */
export interface GCRosterCSVRow {
  'First Name'?: string;
  'Last Name'?: string;
  'Jersey Number'?: string;
  'Primary Position'?: string;
  'Secondary Position'?: string;
  'Batting Average'?: string;
  'ERA'?: string;
  'On Base Percentage'?: string;
  'OBP'?: string;
  'SLG'?: string;
  'Games Played'?: string;
  'At Bats'?: string;
  'Hits'?: string;
  'Runs'?: string;
  'RBIs'?: string;
  'Strikeouts'?: string;
  'Walks'?: string;
  [key: string]: string | undefined;
}

/** JSON roster format (from GameChanger API or structured export) */
export interface GCPlayerJSON {
  firstName: string;
  lastName: string;
  jerseyNumber: number | string;
  position: string;
  battingAvg?: number;
  era?: number;
  obp?: number;
  slugging?: number;
  gamesPlayed?: number;
}

/** Result of an import operation */
export interface ImportResult {
  success: boolean;
  players: ImportedPlayer[];
  errors: ImportError[];
  teamName?: string;
}

export interface ImportedPlayer {
  name: string;
  number: number;
  position: string;
  battingAvg: number;
  era: number;
  obp: number;
  photoURL: string | null;
}

export interface ImportError {
  row: number;
  message: string;
}

/** GC team search result */
export interface GCTeamResult {
  id: string;
  name: string;
  url: string;
  found: boolean;
}