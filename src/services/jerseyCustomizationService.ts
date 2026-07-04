import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlayerCustomization {
  id: string;
  name: string;
  number: number;
}

export interface TeamCustomization {
  primaryColor: string;
  secondaryColor: string;
  teamPhotoUri: string | null;
  players: PlayerCustomization[];
}

const STORAGE_KEY = (teamId: string) => `@myteambaseball/customization/${teamId}`;

const DEFAULT_CUSTOMIZATION: TeamCustomization = {
  primaryColor: '#1A56DB',
  secondaryColor: '#F59E0B',
  teamPhotoUri: null,
  players: [],
};

export async function loadCustomization(teamId: string): Promise<TeamCustomization> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY(teamId));
    if (json) {
      return JSON.parse(json);
    }
  } catch (e) {
    console.warn('Failed to load customization:', e);
  }
  return { ...DEFAULT_CUSTOMIZATION, players: [] };
}

export async function saveCustomization(teamId: string, customization: TeamCustomization): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY(teamId), JSON.stringify(customization));
  } catch (e) {
    console.warn('Failed to save customization:', e);
  }
}

export function autoAssignNumbers(playerCount: number): PlayerCustomization[] {
  const players: PlayerCustomization[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: `auto-${i}`,
      name: `Player ${i + 1}`,
      number: i + 1,
    });
  }
  return players;
}

export const COLOR_OPTIONS = [
  { name: 'Navy Blue', hex: '#1A56DB' },
  { name: 'Forest Green', hex: '#2D6A4F' },
  { name: 'Cardinal Red', hex: '#E02424' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Charcoal', hex: '#374151' },
  { name: 'Gold', hex: '#F59E0B' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#1a1a2e' },
];

export const SECONDARY_COLOR_OPTIONS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gold', hex: '#F59E0B' },
  { name: 'Silver', hex: '#9CA3AF' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Red', hex: '#E02424' },
  { name: 'Black', hex: '#1a1a2e' },
];