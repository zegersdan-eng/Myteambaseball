import { Audio } from 'expo-av';

type SoundName = 'batCrack' | 'crowdCheer' | 'crowdGroan' | 'umpireStrike' | 'umpireBall' | 'homeRun' | 'strikeout' | 'playBall';

let enabled = true;
let cachedSounds: Partial<Record<SoundName, Audio.Sound>> = {};
let isLoaded = false;

export function setSoundEnabled(v: boolean) { enabled = v; }

export function isSoundEnabled(): boolean { return enabled; }

export async function loadSounds(): Promise<void> {
  if (isLoaded) return;
  try {
    const soundFiles: Record<SoundName, any> = {
      batCrack: null, crowdCheer: null, crowdGroan: null,
      umpireStrike: null, umpireBall: null,
      homeRun: null, strikeout: null, playBall: null,
    };
    for (const [name] of Object.entries(soundFiles)) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: `assets/sounds/${name}.mp3` },
          { shouldPlay: false }
        );
        cachedSounds[name as SoundName] = sound;
      } catch {
        // Sound file not available yet — that's OK
      }
    }
    isLoaded = true;
  } catch { /* noop */ }
}

export async function play(soundName: SoundName): Promise<void> {
  if (!enabled) return;
  if (!isLoaded) await loadSounds();
  const sound = cachedSounds[soundName];
  if (sound) {
    try {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch { /* noop */ }
  }
}

export function hasSoundsLoaded(): boolean {
  return isLoaded;
}