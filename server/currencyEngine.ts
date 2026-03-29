/**
 * currencyEngine.ts
 *
 * Handles all server-side currency logic:
 *  - Conversion rates for in-game achievements → credits
 *  - Cosmetics catalog
 *  - Purchase / equip helpers
 *
 * Stripe integration placeholder is intentionally left unimplemented.
 * Replit Auth integration is future-proofed: all player data is keyed by userId.
 */

import type { PlayerProfile, CosmeticItem, EquippedCosmetics } from "@shared/schema";

// ─── Conversion Rates ────────────────────────────────────────────────────────

export const CREDITS_PER_TROPHY = 100;
export const CREDITS_PER_MOMENT_FLAG = 25;

// ─── Cosmetics Catalog ───────────────────────────────────────────────────────

export const COSMETICS_CATALOG: CosmeticItem[] = [
  // ── Logos ──────────────────────────────────────────────────────────────────
  {
    id: 'logo_default',
    name: 'No Logo',
    type: 'logo',
    cost: 0,
    rarity: 'common',
    asset: '',
    earnableOnly: false,
  },
  {
    id: 'logo_redline',
    name: 'Redline Crest',
    type: 'logo',
    cost: 500,
    rarity: 'common',
    asset: '/cosmetics/logos/redline_crest.png',
  },
  {
    id: 'logo_circuit',
    name: 'Circuit Breaker',
    type: 'logo',
    cost: 1200,
    rarity: 'rare',
    asset: '/cosmetics/logos/circuit_breaker.png',
  },
  {
    id: 'logo_apex',
    name: 'Apex Legend',
    type: 'logo',
    cost: 0,
    rarity: 'legendary',
    asset: '/cosmetics/logos/apex_legend.png',
    earnableOnly: true,
  },

  // ── Borders ────────────────────────────────────────────────────────────────
  {
    id: 'border_default',
    name: 'No Border',
    type: 'border',
    cost: 0,
    rarity: 'common',
    asset: '',
    earnableOnly: false,
  },
  {
    id: 'border_neon',
    name: 'Neon Pulse',
    type: 'border',
    cost: 750,
    rarity: 'common',
    asset: 'border-neon-pulse',
  },
  {
    id: 'border_chrome',
    name: 'Chrome Finish',
    type: 'border',
    cost: 1500,
    rarity: 'rare',
    asset: 'border-chrome-finish',
  },
  {
    id: 'border_haunted',
    name: 'Haunted Glow',
    type: 'border',
    cost: 0,
    rarity: 'legendary',
    asset: 'border-haunted-glow',
    earnableOnly: true,
  },

  // ── Backgrounds ─────────────────────────────────────────────────────────────
  {
    id: 'bg_default',
    name: 'Dark Grid',
    type: 'background',
    cost: 0,
    rarity: 'common',
    asset: 'bg-default-grid',
    earnableOnly: false,
  },
  {
    id: 'bg_sunset',
    name: 'Neon Sunset',
    type: 'background',
    cost: 800,
    rarity: 'common',
    asset: 'bg-neon-sunset',
  },
  {
    id: 'bg_void',
    name: 'The Void',
    type: 'background',
    cost: 2000,
    rarity: 'rare',
    asset: 'bg-the-void',
  },
  {
    id: 'bg_galaxy',
    name: 'Meme Galaxy',
    type: 'background',
    cost: 5000,
    rarity: 'legendary',
    asset: 'bg-meme-galaxy',
  },

  // ── Driver Skins ────────────────────────────────────────────────────────────
  {
    id: 'skin_default',
    name: 'Stock Chassis',
    type: 'driverSkin',
    cost: 0,
    rarity: 'common',
    asset: '',
    earnableOnly: false,
  },
  {
    id: 'skin_chrome',
    name: 'Chrome Driver',
    type: 'driverSkin',
    cost: 2500,
    rarity: 'rare',
    asset: '/cosmetics/skins/chrome_driver.png',
  },
  {
    id: 'skin_phantom',
    name: 'Phantom Racer',
    type: 'driverSkin',
    cost: 4000,
    rarity: 'rare',
    asset: '/cosmetics/skins/phantom_racer.png',
  },
  {
    id: 'skin_galaxy',
    name: 'Galactic Drifter',
    type: 'driverSkin',
    cost: 0,
    rarity: 'legendary',
    asset: '/cosmetics/skins/galactic_drifter.png',
    earnableOnly: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns new credit balance after converting achievements.
 * Only converts achievements beyond what has already been converted.
 * This prevents double-conversion.
 */
export function convertAchievementsToCurrency(
  profile: PlayerProfile,
  totalTrophies: number,
  totalMomentFlags: number,
): { creditsEarned: number; updatedProfile: PlayerProfile } {
  const newTrophies = Math.max(0, totalTrophies - profile.convertedTrophies);
  const newFlags = Math.max(0, totalMomentFlags - profile.convertedMomentFlags);

  const creditsEarned =
    newTrophies * CREDITS_PER_TROPHY + newFlags * CREDITS_PER_MOMENT_FLAG;

  if (creditsEarned === 0) {
    return { creditsEarned: 0, updatedProfile: profile };
  }

  const updatedProfile: PlayerProfile = {
    ...profile,
    currencyBalance: profile.currencyBalance + creditsEarned,
    lifetimeEarned: profile.lifetimeEarned + creditsEarned,
    convertedTrophies: profile.convertedTrophies + newTrophies,
    convertedMomentFlags: profile.convertedMomentFlags + newFlags,
    updatedAt: new Date().toISOString(),
  };

  return { creditsEarned, updatedProfile };
}

/**
 * Validates and processes a cosmetic purchase.
 * Returns the updated profile, or throws on invalid state.
 */
export function purchaseCosmetic(
  profile: PlayerProfile,
  cosmeticId: string,
): PlayerProfile {
  const item = COSMETICS_CATALOG.find((c) => c.id === cosmeticId);
  if (!item) throw new Error(`Cosmetic '${cosmeticId}' not found.`);
  if (item.earnableOnly) throw new Error(`Cosmetic '${cosmeticId}' cannot be purchased.`);
  if (profile.ownedCosmetics.includes(cosmeticId))
    throw new Error(`Cosmetic '${cosmeticId}' already owned.`);
  if (profile.currencyBalance < item.cost)
    throw new Error(`Insufficient credits. Need ${item.cost}, have ${profile.currencyBalance}.`);

  return {
    ...profile,
    currencyBalance: profile.currencyBalance - item.cost,
    lifetimeSpent: profile.lifetimeSpent + item.cost,
    ownedCosmetics: [...profile.ownedCosmetics, cosmeticId],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Equips a cosmetic the player already owns.
 * Only one cosmetic per category can be active at a time.
 */
export function equipCosmetic(
  profile: PlayerProfile,
  cosmeticId: string,
): PlayerProfile {
  const item = COSMETICS_CATALOG.find((c) => c.id === cosmeticId);
  if (!item) throw new Error(`Cosmetic '${cosmeticId}' not found.`);
  if (!profile.ownedCosmetics.includes(cosmeticId))
    throw new Error(`Cosmetic '${cosmeticId}' not owned.`);

  const newEquipped: EquippedCosmetics = {
    ...profile.equippedCosmetics,
    [item.type === 'logo'
      ? 'logo'
      : item.type === 'border'
        ? 'border'
        : item.type === 'background'
          ? 'background'
          : 'driverSkin']: cosmeticId,
  };

  return {
    ...profile,
    equippedCosmetics: newEquipped,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Unequips a cosmetic (sets its slot to undefined).
 */
export function unequipCosmetic(
  profile: PlayerProfile,
  cosmeticId: string,
): PlayerProfile {
  const item = COSMETICS_CATALOG.find((c) => c.id === cosmeticId);
  if (!item) throw new Error(`Cosmetic '${cosmeticId}' not found.`);

  const slot =
    item.type === 'logo'
      ? 'logo'
      : item.type === 'border'
        ? 'border'
        : item.type === 'background'
          ? 'background'
          : 'driverSkin';

  const newEquipped: EquippedCosmetics = { ...profile.equippedCosmetics };
  delete newEquipped[slot as keyof EquippedCosmetics];

  return {
    ...profile,
    equippedCosmetics: newEquipped,
    updatedAt: new Date().toISOString(),
  };
}

// ─── Stripe Placeholder ──────────────────────────────────────────────────────
// This stub is intentionally minimal.  Wire in Stripe webhook validation and
// call addCurrencyToProfile() once the payment is confirmed server-side.

/**
 * Placeholder: initiate a currency purchase via Stripe.
 * Returns a client-side payment intent (not yet implemented).
 *
 * @param _userId  - The player's userId (Replit Auth ID later)
 * @param _amount  - Number of credits to purchase
 */
export async function purchaseCurrency(
  _userId: string,
  _amount: number,
): Promise<{ clientSecret: string | null; message: string }> {
  // TODO: Create Stripe PaymentIntent, return clientSecret to front-end.
  // On webhook confirmation call addCurrencyToProfile(userId, amount).
  return {
    clientSecret: null,
    message: 'Stripe integration coming soon.',
  };
}

/**
 * Add credits to a player's balance (call from Stripe webhook after payment).
 */
export function addCurrencyToProfile(
  profile: PlayerProfile,
  amount: number,
): PlayerProfile {
  if (amount <= 0) throw new Error('Amount must be positive.');
  return {
    ...profile,
    currencyBalance: profile.currencyBalance + amount,
    lifetimeEarned: profile.lifetimeEarned + amount,
    updatedAt: new Date().toISOString(),
  };
}
