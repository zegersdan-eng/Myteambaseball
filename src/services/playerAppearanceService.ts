import AsyncStorage from '@react-native-async-storage/async-storage';

export type SkinTone = 'light' | 'medium' | 'tan' | 'dark' | 'deep';
export type HairStyle = 'short' | 'buzz' | 'curly' | 'long' | 'bald';
export type Handedness = 'left' | 'right';

export interface PlayerAppearance {
  skinTone: SkinTone;
  hairStyle: HairStyle;
  glasses: boolean;
  throwsHand: Handedness;
  batsHand: Handedness;
}

const STORAGE_KEY = (playerId: string) => `@myteambaseball/appearance/${playerId}`;

const DEFAULT_APPEARANCE: PlayerAppearance = {
  skinTone: 'medium',
  hairStyle: 'short',
  glasses: false,
  throwsHand: 'right',
  batsHand: 'right',
};

export const SKIN_TONE_OPTIONS: { label: string; value: SkinTone; color: string }[] = [
  { label: 'Light', value: 'light', color: '#FDBCB4' },
  { label: 'Medium', value: 'medium', color: '#C68642' },
  { label: 'Tan', value: 'tan', color: '#A0522D' },
  { label: 'Dark', value: 'dark', color: '#6B3A2A' },
  { label: 'Deep', value: 'deep', color: '#3E1F0D' },
];

export const HAIR_STYLE_OPTIONS: { label: string; value: HairStyle; icon: string }[] = [
  { label: 'Short', value: 'short', icon: '💇' },
  { label: 'Buzz Cut', value: 'buzz', icon: '✂️' },
  { label: 'Curly', value: 'curly', icon: '🦱' },
  { label: 'Long', value: 'long', icon: '💁' },
  { label: 'Bald', value: 'bald', icon: '🫅' },
];

export async function loadAppearance(playerId: string): Promise<PlayerAppearance> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY(playerId));
    if (json) return JSON.parse(json);
  } catch (e) {
    console.warn('Failed to load appearance:', e);
  }
  return { ...DEFAULT_APPEARANCE };
}

export async function saveAppearance(playerId: string, appearance: PlayerAppearance): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY(playerId), JSON.stringify(appearance));
  } catch (e) {
    console.warn('Failed to save appearance:', e);
  }
}