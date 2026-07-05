import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;     // emoji to start, designer will replace with PNG
  category: 'hitting' | 'pitching' | 'team' | 'season' | 'special';
  check: (context: AchievementContext) => number; // returns progress 0-100
  max: number;       // target value (e.g. 10 home runs)
  hidden?: boolean;  // secret achievements
}

export interface AchievementProgress {
  id: string;
  current: number;
  unlocked: boolean;
  unlockedAt?: number;
  notified: boolean;
}

export interface AchievementContext {
  // Per-player stats
  playerStats: Record<string, { homeRuns: number; strikeouts: number; hits: number; rbi: number; wins: number }>;
  // Team stats
  totalWins: number;
  totalGames: number;
  winStreak: number;
  // Season stats
  seasonChampionships: number;
  // Game-level
  gameHomeRuns: number;
  gameRuns: number;
  gameStrikeouts: number;
  gameHits: number;
}

const ACHIEVEMENTS_KEY = '@myteambaseball/achievements';

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // HITTING
  { id: 'first-homer', title: 'First Homer', description: 'Hit your first home run', icon: '⚾', category: 'hitting', check: (ctx) => Math.min(100, (ctx.playerStats['self']?.homeRuns || 0) / 1 * 100), max: 1 },
  { id: 'slugger-5', title: 'Slugger', description: 'Hit 5 home runs total', icon: '💪', category: 'hitting', check: (ctx) => Math.min(100, (ctx.playerStats['self']?.homeRuns || 0) / 5 * 100), max: 5 },
  { id: 'slugger-10', title: 'Home Run King', description: 'Hit 10 home runs total', icon: '👑', category: 'hitting', check: (ctx) => Math.min(100, (ctx.playerStats['self']?.homeRuns || 0) / 10 * 100), max: 10, hidden: true },
  { id: 'rbi-machine', title: 'RBI Machine', description: 'Drive in 25 runs', icon: '🏃', category: 'hitting', check: (ctx) => Math.min(100, (ctx.playerStats['self']?.rbi || 0) / 25 * 100), max: 25 },
  { id: 'hitting-streak', title: 'Hot Streak', description: 'Get 5 hits in a single game', icon: '🔥', category: 'hitting', check: (ctx) => Math.min(100, ctx.gameHits / 5 * 100), max: 5 },
  // PITCHING
  { id: 'first-k', title: 'First Strikeout', description: 'Strike out your first batter', icon: '⚡', category: 'pitching', check: (ctx) => Math.min(100, (ctx.playerStats['self']?.strikeouts || 0) / 1 * 100), max: 1 },
  { id: 'k-10', title: 'Strikeout Artist', description: 'Strike out 10 batters', icon: '🎯', category: 'pitching', check: (ctx) => Math.min(100, (ctx.playerStats['self']?.strikeouts || 0) / 10 * 100), max: 10 },
  { id: 'k-25', title: 'Flame Thrower', description: 'Strike out 25 batters', icon: '🔥', category: 'pitching', check: (ctx) => Math.min(100, (ctx.playerStats['self']?.strikeouts || 0) / 25 * 100), max: 25, hidden: true },
  { id: 'perfect-game', title: 'Perfect Game', description: 'Strike out the side (3 in one inning)', icon: '🌟', category: 'pitching', check: (ctx) => Math.min(100, ctx.gameStrikeouts / 3 * 100), max: 3 },
  // TEAM
  { id: 'first-win', title: 'First Victory', description: 'Win your first game', icon: '🏆', category: 'team', check: (ctx) => Math.min(100, ctx.totalWins / 1 * 100), max: 1 },
  { id: 'win-10', title: 'Double Digits', description: 'Win 10 games total', icon: '🏅', category: 'team', check: (ctx) => Math.min(100, ctx.totalWins / 10 * 100), max: 10 },
  { id: 'win-25', title: 'Winning Tradition', description: 'Win 25 games total', icon: '🏆', category: 'team', check: (ctx) => Math.min(100, ctx.totalWins / 25 * 100), max: 25 },
  // SEASON
  { id: 'season-champ', title: 'Season Champion', description: 'Win a season championship', icon: '🏆', category: 'season', check: (ctx) => Math.min(100, ctx.seasonChampionships / 1 * 100), max: 1 },
  { id: 'dynasty', title: 'Dynasty', description: 'Win 3 season championships', icon: '👑', category: 'season', check: (ctx) => Math.min(100, ctx.seasonChampionships / 3 * 100), max: 3, hidden: true },
  // SPECIAL
  { id: 'grand-slam', title: 'Grand Slam', description: 'Hit a home run with the bases loaded (score 4 in one swing)', icon: '💥', category: 'special', check: (ctx) => Math.min(100, ctx.gameHomeRuns * 25), max: 4 },
];

export async function loadAchievements(): Promise<Record<string, AchievementProgress>> {
  try {
    const json = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (json) return JSON.parse(json);
  } catch {}
  // Initialize all
  const init: Record<string, AchievementProgress> = {};
  ACHIEVEMENT_DEFINITIONS.forEach((a) => {
    init[a.id] = { id: a.id, current: 0, unlocked: false, notified: false };
  });
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

export async function markNotified(achievementId: string): Promise<void> {
  const data = await loadAchievements();
  if (data[achievementId]) {
    data[achievementId].notified = true;
    await saveAchievements(data);
  }
}

export async function getUnnotified(): Promise<AchievementProgress[]> {
  const data = await loadAchievements();
  return Object.values(data).filter((a) => a.unlocked && !a.notified);
}