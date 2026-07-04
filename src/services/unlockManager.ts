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