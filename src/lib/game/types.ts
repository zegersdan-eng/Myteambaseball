export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  battingAvg: number; // 0.000 to 1.000
  pitchingERA: number; // 0.00 to 99.99
  throws: 'R' | 'L';
  bats: 'R' | 'L';
  appearance: {
    skinColor: string;
    hairColor: string;
    eyeColor: string;
    height: 'short' | 'average' | 'tall';
    build: 'slim' | 'average' | 'stocky';
  };
}

export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  players: Player[];
  colors: TeamColors;
  stadium: string;
  record: { wins: number; losses: number };
  jerseyNumber?: string;
  teamPhoto?: string; // base64 or URL
  isCustom?: boolean;
}

export type PitchType = 'fastball' | 'curveball' | 'changeup';

export type BallPosition = { x: number; y: number; z: number };

export interface PitchState {
  type: PitchType;
  speed: number; // mph
  targetX: number; // -1 to 1 (left to right)
  targetY: number; // -1 to 1 (low to high)
  currentPos: BallPosition;
  progress: number; // 0 to 1
  isInZone: boolean;
}

export type SwingResult = 'miss' | 'foul' | 'hit' | 'homeRun';

export interface AtBatResult {
  swingResult: SwingResult;
  contactQuality?: number; // 0-100
  hitDirection?: 'left' | 'center' | 'right';
  hitDistance?: number;
  playType?: 'single' | 'double' | 'triple' | 'homeRun' | 'out' | 'sacrifice';
}

export type GameHalf = 'top' | 'bottom';

export interface GameState {
  homeTeam: Team;
  awayTeam: Team;
  currentInning: number;
  gameHalf: GameHalf;
  outs: number;
  balls: number;
  strikes: number;
  homeScore: number;
  awayScore: number;
  bases: [boolean, boolean, boolean]; // 1st, 2nd, 3rd
  currentBatter: number; // index in lineup
  currentPitcher: number; // player index
  battingOrder: number[]; // player indices
  totalInnings: number;
  isOver: boolean;
  winner?: 'home' | 'away';
  atBatHistory: AtBatResult[];
}

export type GameScreen =
  | 'welcome'
  | 'team-select'
  | 'team-manage'
  | 'roster-view'
  | 'customize'
  | 'opponent-select'
  | 'game'
  | 'pitch-select'
  | 'result'
  | 'records'
  | 'achievements'
  | 'stadium-select';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or badge name
  unlocked: boolean;
  condition: (state: AppState) => boolean;
}

export interface Stadium {
  id: string;
  name: string;
  description: string;
  colors: { grass: string; dirt: string; wall: string; sky: string };
  unlocked: boolean;
}

export interface AppState {
  screen: GameScreen;
  teams: Team[];
  selectedTeamId: string | null;
  opponentTeamId: string | null;
  gameState: GameState | null;
  achievements: Achievement[];
  stadiums: Stadium[];
  seasonMode: boolean;
  gameCount: number;
  showTutorial: boolean;
  tutorialStep: number;
  premiumUnlocked: boolean;
  lastRecap: RecapData | null;
}

export interface RecapData {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  inning: number;
  date: string;
  hero?: string;
}

export interface GameChangerRoster {
  players: Array<{
    name: string;
    number?: number;
    position?: string;
    battingAverage?: number;
    era?: number;
  }>;
  teamName?: string;
}

export const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'] as const;
export type Position = typeof POSITIONS[number];

export const PITCH_TYPES: PitchType[] = ['fastball', 'curveball', 'changeup'];

export const STADIUM_DATA: Stadium[] = [
  { id: 'sunset', name: 'Sunset Field', description: 'A classic neighborhood ballpark with a beautiful sunset view.', colors: { grass: '#4a9e4a', dirt: '#c4a46c', wall: '#2a5a2a', sky: '#ff7f50' }, unlocked: true },
  { id: 'desert', name: 'Desert Diamond', description: 'Built in the arid highlands, the ball carries far here.', colors: { grass: '#6b8e23', dirt: '#deb887', wall: '#8b4513', sky: '#f4a460' }, unlocked: false },
  { id: 'lake', name: 'Lakefront Park', description: 'Breezes off the lake make every fly ball an adventure.', colors: { grass: '#3cb371', dirt: '#d2b48c', wall: '#4682b4', sky: '#87ceeb' }, unlocked: false },
  { id: 'mountain', name: 'Mountain Ridge Stadium', description: 'High altitude — the ball flies farther than you think.', colors: { grass: '#228b22', dirt: '#a0522d', wall: '#696969', sky: '#b0c4de' }, unlocked: false },
];

export const BADGE_ICONS: Record<string, string> = {
  'first-win': '🏆',
  'slugger': '⚾',
  'ace': '🔥',
  'iron-glove': '🧤',
  'comeback': '💪',
  'streak': '📈',
  'century': '💯',
  'import': '📥',
  'customizer': '🎨',
  'veteran': '⭐',
};