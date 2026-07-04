import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// Unlock / Premium System
// ------------------------------------------------------------
// FREE AT LAUNCH: All features are unlocked by default.
// This system is code-ready for when you flip the switch to
// enable premium gating. The UnlockManager always returns true
// in free mode. When ready, set FREE_AT_LAUNCH to false and
// the gating logic activates.
// ============================================================

const FREE_AT_LAUNCH = true;

type Feature = 'premium' | 'rosterImport' | 'customJerseys' | 'statsTracking' | 'opponentMode';

const PREMIUM_FEATURES: Feature[] = ['premium', 'rosterImport', 'customJerseys', 'statsTracking', 'opponentMode'];

const ACTIVATION_CODES_KEY = '@myteambaseball/activation/codes';
const ACTIVATED_FEATURES_KEY = '@myteambaseball/activation/features';

// ---- Shareable code system ----

export interface ActivationCode {
  code: string;
  features: Feature[];
  maxUses: number;
  usedCount: number;
  expiresAt: number | null; // timestamp or null for no expiry
}

const GENERATED_CODES: ActivationCode[] = [
  {
    code: 'MTB-FREE-2026',
    features: ['premium', 'rosterImport', 'customJerseys', 'statsTracking', 'opponentMode'],
    maxUses: 9999,
    usedCount: 0,
    expiresAt: null,
  },
  {
    code: 'MTB-TEAMPASS-2026',
    features: ['rosterImport', 'customJerseys', 'statsTracking', 'opponentMode'],
    maxUses: 50,
    usedCount: 0,
    expiresAt: null,
  },
];

// ---- Public API ----

/** Check if a given feature is unlocked */
export async function isFeatureUnlocked(feature: Feature): Promise<boolean> {
  if (FREE_AT_LAUNCH) return true;

  try {
    const activatedJson = await AsyncStorage.getItem(ACTIVATED_FEATURES_KEY);
    if (activatedJson) {
      const activated: Feature[] = JSON.parse(activatedJson);
      if (activated.includes(feature) || activated.includes('premium')) return true;
    }
  } catch (e) {
    console.warn('Failed to check feature unlock:', e);
  }

  return feature === 'premium' ? false : await isFeatureUnlocked('premium');
}

/** Redeem an activation code */
export async function redeemCode(code: string): Promise<{ success: boolean; message: string }> {
  if (FREE_AT_LAUNCH) {
    return { success: true, message: 'All features are free! Enjoy the game.' };
  }

  const upperCode = code.toUpperCase().trim();
  const found = GENERATED_CODES.find((c) => c.code === upperCode);

  if (!found) {
    return { success: false, message: 'Invalid code. Please check and try again.' };
  }

  if (found.expiresAt && Date.now() > found.expiresAt) {
    return { success: false, message: 'This code has expired.' };
  }

  if (found.usedCount >= found.maxUses) {
    return { success: false, message: 'This code has reached its maximum number of uses.' };
  }

  // Activate features
  try {
    const existingJson = await AsyncStorage.getItem(ACTIVATED_FEATURES_KEY);
    const existing: Feature[] = existingJson ? JSON.parse(existingJson) : [];
    const merged = [...new Set([...existing, ...found.features])];
    await AsyncStorage.setItem(ACTIVATED_FEATURES_KEY, JSON.stringify(merged));

    // Increment use count
    found.usedCount++;
    const codesJson = await AsyncStorage.getItem(ACTIVATION_CODES_KEY);
    const savedCodes: ActivationCode[] = codesJson ? JSON.parse(codesJson) : GENERATED_CODES;
    const updated = savedCodes.map((c) =>
      c.code === upperCode ? { ...c, usedCount: c.usedCount + 1 } : c
    );
    await AsyncStorage.setItem(ACTIVATION_CODES_KEY, JSON.stringify(updated));

    return { success: true, message: `Code redeemed! Features unlocked: ${found.features.join(', ')}` };
  } catch (e) {
    return { success: false, message: 'Failed to save activation. Please try again.' };
  }
}

/** Get list of available codes (for admin/debug) */
export function getAvailableCodes(): ActivationCode[] {
  return GENERATED_CODES;
}

/** Get all premium features list */
export function getAllPremiumFeatures(): Feature[] {
  return PREMIUM_FEATURES;
}

/** Check if FREE_AT_LAUNCH mode is on */
export function isFreeAtLaunch(): boolean {
  return FREE_AT_LAUNCH;
}

// ============================================================
// Hash code generator utility
// Ready for when you flip the switch. Generates a simple
// one-way validation code from team name and season.
// ============================================================

/** Generate a simple hash-based code from a team name and season */
export function generateTeamCode(teamName: string, season: string): string {
  const sanitized = teamName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const prefix = sanitized.slice(0, 4);
  const seasonShort = season.slice(-2);
  // Simple hash: sum of char codes mod 10000
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = ((hash << 5) - hash + teamName.charCodeAt(i)) | 0;
  }
  const code = Math.abs(hash % 10000).toString().padStart(4, '0');
  return `MTB-${prefix}-${seasonShort}-${code}`;
}

/** Validate a user-entered code against the expected format and hash */
export function validateCode(code: string): { valid: boolean; message: string } {
  const upper = code.toUpperCase().trim();

  // Check basic format: MTB-XXXX-XX-XXXX
  if (!/^MTB-[A-Z0-9]+-\d{2,4}-\d{4}$/.test(upper)) {
    return { valid: false, message: 'Code format is invalid. Use format: MTB-TEAM-YY-XXXX' };
  }

  // Check against built-in codes
  const builtIn = GENERATED_CODES.find((c) => c.code === upper);
  if (builtIn) {
    if (builtIn.expiresAt && Date.now() > builtIn.expiresAt) {
      return { valid: false, message: 'This code has expired.' };
    }
    if (builtIn.usedCount >= builtIn.maxUses) {
      return { valid: false, message: 'This code has reached its maximum number of uses.' };
    }
    return { valid: true, message: `Code is valid! Unlocks: ${builtIn.features.join(', ')}` };
  }

  // If no match, the code is unknown
  return { valid: false, message: 'Unknown code. Please check and try again.' };
}