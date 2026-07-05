import AsyncStorage from '@react-native-async-storage/async-storage';
import { Assets } from '../assets';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badgeImage: any;    // Badge PNG from designer
  category: 'hitting' | 'pitching' | 'team' | 'season' | 'special';
  check: (context: AchievementContext) => number;
  max: number;
  hidden?: boolean;
}

export interface AchievementProgress {
  id: string;
  current: number;
  unlocked: boolean;
  unlockedAt?: number;
  notified: boolean;
}

export interface AchievementContext {
  playerStats: Record<string, { homeRuns: number; strikeouts: number; hits: number; rbi: number; wins: number }>;
  totalWins: number;
  totalGames: number;
  winStreak: number;
  seasonChampionships: number;
  gameHomeRuns: number;
  gameRuns: number;
  gameStrikeouts: number;
  gameHits: number;
}

const ACHIEVEMENTS_KEY = '@myteambaseball/achievements';

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  { id: 'first-hr', title: 'First Homer', description: 'Hit your first home run', badgeImage: Assets.badges.firstHr, category: 'hitting', check: (ctx) => Math.min(100, (ctx.playerStats['self']?.homeRuns || 0) / 1 * 100), max: 1 },
  { id: 'hr-10', title: 'Home Run King', description: 'Hit 10 home runs', badgeImage: Assets.badges.hr10, category: 'hitting', check: (ctx) => Math.min(100, (ctx.playerStats['self']?.homeRuns || 0) / 10 * 100), max: 10, hidden: true },
  { id: 'cycle', title: 'Hit for the Cycle', description: 'Single, double, triple, HR in one game', badgeImage: Assets.badges.cycle, category: 'hitting', check: (ctx) => Math.min(100, ctx.gameHits * 20), max: 5 },
  { id: 'win-streak-5', title: '5-Game Streak', description: 'Win 5 games in a row', badgeImage: Assets.badges.winStreak5, category: 'team', check: (ctx) => Math.min(100, ctx.winStreak / 5 * 100), max: 5 },
  { id: 'win-streak-10', title: '10-Game Streak', description: 'Win 10 games in a row', badgeImage: Assets.badges.winStreak10, category: 'team', check: (ctx) => Math.min(100, ctx.winStreak / 10 * 100), max: 10, hidden: true },
  { id: 'no-hitter', title: 'No-Hitter', description: 'Pitch a complete game without allowing a hit', badgeImage: Assets.badges.noHitter, category: 'pitching', check: (ctx) => Math.min(100, ctx.gameStrikeouts / 9 * 100), max: 9 },
  { id: 'champion', title: 'Season Champion', description: 'Win a season championship', badgeImage: Assets.badges.champion, category: 'season', check: (ctx) => Math.min(100, ctx.seasonChampionships / 1 * 100), max: 1 },
  { id: 'perfect-inning', title: 'Perfect Inning', description: 'Strike out the side (3 Ks in one inning)', badgeImage: Assets.badges.perfectInning, category: 'pitching', check: (ctx) => Math.min(100, ctx.gameStrikeouts / 3 * 100), max: 3 },
  { id: 'walkoff', title: 'Walk-off Hero', description: 'Win in extra innings', badgeImage: Assets.badges.walkoff, category: 'special', check: (ctx) => Math.min(100, ctx.totalGames > 0 ? 50 : 0), max: 2 },
  { id: 'customizer', title: 'Fashion Star', description: 'Customize your team jerseys', badgeImage: Assets.badges.customizer, category: 'special', check: (ctx) => Math.min(100, ctx.totalWins > 0 ? 100 : 0), max: 1 },
];

export async function loadAchievements(): Promise<Record<string, AchievementProgress>> {
  try {
    const json = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (json) return JSON.parse(json);
  } catch {}
  const init: Record<string, AchievementProgress> = {};
  ACHIEVEMENT_DEFINITIONS.forEach((a) => { init[a.id] = { id: a.id, current: 0, unlocked: false, notified: false }; });
  return init;
}

export async function saveAchievements(data: Record<string, AchievementProgress>): Promise<void> {
  await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(data));
}

export async function checkAchievements(ctx: AchievementContext): Promise<AchievementProgress[]> {
  const data = await loadAchievements();
  const newlyUnlocked: AchievementProgress[] = [];
  ACHIEVEMENT_DEFINITIONS.forEach((def) => {
    const progress = data[def.id];
    if (!progress || progress.unlocked) return;
    const newCurrent = Math.round(def.check(ctx));
    progress.current = Math.max(progress.current, Math.min(100, newCurrent));
    if (progress.current >= 100 && !progress.unlocked) {
      progress.unlocked = true;
      progress.unlockedAt = Date.now();
      progress.notified = false;
      newlyUnlocked.push({ ...progress });
    }
  });
  await saveAchievements(data);
  return newlyUnlocked;
}

export async function getUnlockedCount(): Promise<number> {
  const data = await loadAchievements();
  return Object.values(data).filter((a) => a.unlocked).length;
}

export async function getUnnotified(): Promise<AchievementProgress[]> {
  const data = await loadAchievements();
  return Object.values(data).filter((a) => a.unlocked && !a.notified);
}

export function getBadgeImage(achievementId: string): any {
  const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
  return def?.badgeImage || Assets.badges.firstHr;
}