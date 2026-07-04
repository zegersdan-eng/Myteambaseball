/** Player data model matching GameChanger-style stats */

export type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'UTIL';

export interface Player {
  id: string;
  name: string;
  number: number;
  position: Position;
  battingAvg: number;   // 0.000 – 1.000
  ERA: number;          // 0.00 – 99.99
  OBP: number;          // 0.000 – 1.000
  photoURL: string | null;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  primaryColor: string;
  secondaryColor: string;
  jerseyURL: string | null;
  teamPhotoURL: string | null;
}

export interface GameState {
  inning: number;
  isTop: boolean;
  outs: number;
  balls: number;
  strikes: number;
  homeScore: number;
  awayScore: number;
  isGameOver: boolean;
  currentPitcher: Player | null;
  currentBatter: Player | null;
}