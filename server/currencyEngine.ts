/**
 * currencyEngine.ts
 *
 * Handles all server-side currency logic:
 *  - Conversion rates for in-game achievements → credits
 *  - Cosmetics catalog with per-category price configuration
 *  - Purchase / equip helpers (server-side only)
 *  - Milestone unlock system (Replit Auth milestone tracking)
 *  - Stripe placeholder
 *
 * ANTI-CHEAT RULES:
 *   1. All balance mutations happen in this module only (server-side).
 *   2. End-game conversion is idempotent: each gameId may only be converted once.
 *   3. Trophy/flag inputs are capped and validated by the Zod schema before reaching here.
 *   4. The client receives the updated profile back but cannot push arbitrary credit values.
 */

import type {
  PlayerProfile,
  CosmeticItem,
  EquippedCosmetics,
} from "@shared/schema";

// ─── Conversion Rates ────────────────────────────────────────────────────────

export const CREDITS_PER_TROPHY = 100;
export const CREDITS_PER_MOMENT_FLAG = 25;

// ─── Category Price Configuration ────────────────────────────────────────────
// This is the single source of truth for baseline pricing bands per category.
// Individual cosmetics can override `cost` freely within these bands.

export const COSMETIC_CATEGORY_CONFIG: Record<string, {
  baseCost: number;
  rarityMultipliers: Record<string, number>;
  description: string;
}> = {
  logo: {
    baseCost: 500,
    rarityMultipliers: { common: 1, rare: 2.4, legendary: 0 }, // 0 = earnable only
    description: 'Profile logos shown on the game-over winner card and MP lobby.',
  },
  border: {
    baseCost: 750,
    rarityMultipliers: { common: 1, rare: 2, legendary: 0 },
    description: 'Card borders applied to the player stats card in-game and post-game.',
  },
  background: {
    baseCost: 800,
    rarityMultipliers: { common: 1, rare: 2.5, legendary: 6.25 },
    description: 'Background style for the player card background.',
  },
  driverSkin: {
    baseCost: 2500,
    rarityMultipliers: { common: 0, rare: 1, legendary: 0 },
    description: 'Driver avatar skins applied to the character portrait in-game.',
  },
};

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
    asset: 'border_neon',
  },
  {
    id: 'border_chrome',
    name: 'Chrome Finish',
    type: 'border',
    cost: 1500,
    rarity: 'rare',
    asset: 'border_chrome',
  },
  {
    id: 'border_haunted',
    name: 'Haunted Glow',
    type: 'border',
    cost: 0,
    rarity: 'legendary',
    asset: 'border_haunted',
    earnableOnly: true,
  },

  // ── Backgrounds ─────────────────────────────────────────────────────────────
  {
    id: 'bg_default',
    name: 'Dark Grid',
    type: 'background',
    cost: 0,
    rarity: 'common',
    asset: '',
    earnableOnly: false,
  },
  {
    id: 'bg_sunset',
    name: 'Neon Sunset',
    type: 'background',
    cost: 800,
    rarity: 'common',
    asset: 'bg_sunset',
  },
  {
    id: 'bg_void',
    name: 'The Void',
    type: 'background',
    cost: 2000,
    rarity: 'rare',
    asset: 'bg_void',
  },
  {
    id: 'bg_galaxy',
    name: 'Meme Galaxy',
    type: 'background',
    cost: 5000,
    rarity: 'legendary',
    asset: 'bg_galaxy',
  },

  // ── Driver Skins ────────────────────────────────────────────────────────────
  // Skins are driver-specific: driverIds indicates which character must be active
  // for the skin overlay to render. Owning a skin is permanent; it just won't
  // visually apply when playing a different driver.
  {
    id: 'skin_default',
    name: 'Stock Chassis',
    type: 'driverSkin',
    cost: 0,
    rarity: 'common',
    asset: '',
    earnableOnly: false,
  },

  // ── Accuser Skins ───────────────────────────────────────────────────────────
  {
    id: 'skin_accuser_dreamer',
    name: 'The Dreamer',
    type: 'driverSkin',
    cost: 1500,
    rarity: 'common',
    asset: 'skin_accuser_dreamer',
    driverIds: ['accuser'],
  },
  {
    id: 'skin_accuser_duchess',
    name: 'Damning Duchess',
    type: 'driverSkin',
    cost: 2500,
    rarity: 'rare',
    asset: 'skin_accuser_duchess',
    driverIds: ['accuser'],
  },

  // ── Alpha Prime Skins ───────────────────────────────────────────────────────
  {
    id: 'skin_alpha_ragnar',
    name: 'Ragnar Ironjaw',
    type: 'driverSkin',
    cost: 2500,
    rarity: 'rare',
    asset: 'skin_alpha_ragnar',
    driverIds: ['alpha_prime'],
  },

  // ── The Anointed Skins ──────────────────────────────────────────────────────
  {
    id: 'skin_anointed_masquerade',
    name: 'Masquerade Sovereign',
    type: 'driverSkin',
    cost: 2000,
    rarity: 'rare',
    asset: 'skin_anointed_masquerade',
    driverIds: ['anointed'],
  },

  // ── Click-Click Skins ───────────────────────────────────────────────────────
  {
    id: 'skin_click_roarcat',
    name: 'Roarcat',
    type: 'driverSkin',
    cost: 1500,
    rarity: 'common',
    asset: 'skin_click_roarcat',
    driverIds: ['click_click'],
  },

  // ── Rainbow Dash Skins ──────────────────────────────────────────────────────
  {
    id: 'skin_dash_stormhare',
    name: 'Stormhare the Swift',
    type: 'driverSkin',
    cost: 2000,
    rarity: 'common',
    asset: 'skin_dash_stormhare',
    driverIds: ['rainbow_dash'],
  },

  // ── Frostbyte Skins ─────────────────────────────────────────────────────────
  {
    id: 'skin_frost_glaciodon',
    name: 'Glaciodon',
    type: 'driverSkin',
    cost: 1500,
    rarity: 'common',
    asset: 'skin_frost_glaciodon',
    driverIds: ['frostbyte'],
  },
  {
    id: 'skin_frost_skaldi',
    name: "Skaldi's Chosen",
    type: 'driverSkin',
    cost: 2500,
    rarity: 'rare',
    asset: 'skin_frost_skaldi',
    driverIds: ['frostbyte'],
  },

  // ── Guardian H Skins ────────────────────────────────────────────────────────
  {
    id: 'skin_guardian_ironknuckle',
    name: 'Ironknuckle',
    type: 'driverSkin',
    cost: 2000,
    rarity: 'rare',
    asset: 'skin_guardian_ironknuckle',
    driverIds: ['guardian_h'],
  },

  // ── Hotwired Skins ──────────────────────────────────────────────────────────
  {
    id: 'skin_hotwired_pyra',
    name: 'Pyra',
    type: 'driverSkin',
    cost: 2000,
    rarity: 'common',
    asset: 'skin_hotwired_pyra',
    driverIds: ['hotwired'],
  },

  // ── Low Flame Skins ─────────────────────────────────────────────────────────
  {
    id: 'skin_lowflame_wolfman',
    name: 'Wolfman',
    type: 'driverSkin',
    cost: 2000,
    rarity: 'rare',
    asset: 'skin_lowflame_wolfman',
    driverIds: ['low_flame'],
  },

  // ── Pain Hider Skins ────────────────────────────────────────────────────────
  {
    id: 'skin_pain_highborn',
    name: 'Highborn Elder',
    type: 'driverSkin',
    cost: 2000,
    rarity: 'rare',
    asset: 'skin_pain_highborn',
    driverIds: ['pain_hider'],
  },

  // ── Panic Bot Skins ─────────────────────────────────────────────────────────
  {
    id: 'skin_panic_glitchosaurus',
    name: 'Glitchosaurus',
    type: 'driverSkin',
    cost: 1500,
    rarity: 'common',
    asset: 'skin_panic_glitchosaurus',
    driverIds: ['panic_bot'],
  },

  // ── The Rind Skins ──────────────────────────────────────────────────────────
  {
    id: 'skin_rind_sewer',
    name: 'Sewer Sharpshooter',
    type: 'driverSkin',
    cost: 1500,
    rarity: 'common',
    asset: 'skin_rind_sewer',
    driverIds: ['the_rind'],
  },

  // ── Roll Safe Skins ─────────────────────────────────────────────────────────
  {
    id: 'skin_roll_calculated',
    name: 'Calculated Ace',
    type: 'driverSkin',
    cost: 2000,
    rarity: 'common',
    asset: 'skin_roll_calculated',
    driverIds: ['roll_safe'],
  },

  // ── Driver-Agnostic (Earnable) ──────────────────────────────────────────────
  {
    id: 'skin_galaxy',
    name: 'Galactic Drifter',
    type: 'driverSkin',
    cost: 0,
    rarity: 'legendary',
    asset: 'skin_galaxy',
    earnableOnly: true,
    // No driverIds — this earnable skin applies to any driver
  },

  // ── Limited-Time Items ──────────────────────────────────────────────────────
  {
    id: 'logo_speed_demon',
    name: 'Speed Demon',
    type: 'logo',
    cost: 800,
    rarity: 'rare',
    asset: '/cosmetics/logos/speed_demon.png',
    limitedTime: true,
    endsAt: '2026-05-31T23:59:59Z',
  },
  {
    id: 'border_turbo',
    name: 'Turbo Flame',
    type: 'border',
    cost: 1000,
    rarity: 'rare',
    asset: 'border_turbo',
    limitedTime: true,
    endsAt: '2026-05-31T23:59:59Z',
  },
];

// ─── Default Owned Cosmetics ─────────────────────────────────────────────────
// Every new profile starts with these four "no cosmetic" defaults already owned.
// This ensures the equip system always has a valid fallback choice.

export const DEFAULT_OWNED_COSMETICS = [
  'logo_default',
  'border_default',
  'bg_default',
  'skin_default',
];

// ─── Milestone Definitions ───────────────────────────────────────────────────
// Defines what a player must achieve (via Replit Auth account) to unlock a
// milestone cosmetic for free.  The unlock check runs on every end-game conversion.

export interface MilestoneDefinition {
  id: string;
  cosmeticId: string;  // The cosmetic this milestone unlocks
  description: string;
  /** Returns true if the given profile meets this milestone. */
  check: (profile: PlayerProfile) => boolean;
}

/** Helper to sum all wins across a winsPerMode record. */
function totalWins(winsPerMode: Record<string, number>): number {
  return Object.values(winsPerMode).reduce((s, v) => s + (v ?? 0), 0);
}

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    id: 'milestone_10_wins',
    cosmeticId: 'logo_apex',
    description: 'Win 10 total games across any mode.',
    check: (p) => totalWins(p.winsPerMode as Record<string, number>) >= 10,
  },
  {
    id: 'milestone_5_haunted_wins',
    cosmeticId: 'border_haunted',
    description: 'Win 5 Haunted mode games (SP or MP).',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return ((m['sp_haunted'] ?? 0) + (m['mp_haunted'] ?? 0)) >= 5;
    },
  },
  // Add more milestones here as needed
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Maps a CosmeticType to the corresponding slot key in EquippedCosmetics. */
function getSlotFromType(type: import("@shared/schema").CosmeticType): keyof EquippedCosmetics {
  switch (type) {
    case 'logo':       return 'logo';
    case 'border':     return 'border';
    case 'background': return 'background';
    case 'driverSkin': return 'driverSkin';
  }
}

/**
 * Creates a fresh default player profile object for a new authenticated user.
 * Always includes the four default "no cosmetic" items in ownedCosmetics.
 * Pass the Replit Auth userId as `id` and the user's display name as `username`.
 */
export function createDefaultProfile(
  id: string,
  username: string,
  profileImageUrl?: string | null,
): Omit<PlayerProfile, 'createdAt' | 'updatedAt'> & { createdAt: Date; updatedAt: Date } {
  const now = new Date();
  return {
    id,
    username,
    profileImageUrl: profileImageUrl ?? null,
    currencyBalance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    totalWins: 0,
    totalGames: 0,
    ownedCosmetics: [...DEFAULT_OWNED_COSMETICS],
    equippedCosmetics: {},
    convertedTrophies: 0,
    convertedMomentFlags: 0,
    convertedGameIds: [],
    winsPerMode: {},
    milestoneUnlocks: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Checks all milestone definitions and automatically grants any cosmetics the
 * player has now qualified for.  Safe to call multiple times (idempotent).
 */
function applyMilestones(profile: PlayerProfile): PlayerProfile {
  let updated = { ...profile };
  for (const milestone of MILESTONE_DEFINITIONS) {
    const owned = (updated.ownedCosmetics ?? []) as string[];
    const unlocked = (updated.milestoneUnlocks ?? []) as string[];
    if (
      !owned.includes(milestone.cosmeticId) &&
      !unlocked.includes(milestone.cosmeticId) &&
      milestone.check(updated)
    ) {
      updated = {
        ...updated,
        ownedCosmetics: [...owned, milestone.cosmeticId],
        milestoneUnlocks: [...unlocked, milestone.cosmeticId],
      };
      console.log(`[Milestone] User ${updated.id} unlocked cosmetic '${milestone.cosmeticId}' via milestone '${milestone.id}'`);
    }
  }
  return updated;
}

/**
 * Converts end-game achievements to credits.  Idempotent – if gameId has
 * already been converted the function returns 0 credits earned and the
 * unchanged profile.
 *
 * ANTI-CHEAT:
 *  - gameId is recorded; calling again for the same game is a no-op.
 *  - Trophy/flag values are sanity-checked by the Zod schema (max 200/500).
 *  - Balance is never set directly by the client.
 */
export function convertGameToCurrency(
  profile: PlayerProfile,
  gameId: string,
  trophies: number,
  momentFlags: number,
  isWinner: boolean,
  variant: 'STANDARD' | 'SOCIAL_OVERDRIVE' | 'BIO_FUEL' | 'HAUNTED',
  isMultiplayer: boolean,
): {
  creditsEarned: number;
  milestoneUnlocked: string[];
  updatedProfile: PlayerProfile;
} {
  // Idempotency check
  if ((profile.convertedGameIds as string[]).includes(gameId)) {
    return { creditsEarned: 0, milestoneUnlocked: [], updatedProfile: profile };
  }

  const creditsEarned = trophies * CREDITS_PER_TROPHY + momentFlags * CREDITS_PER_MOMENT_FLAG;
  const now = new Date();

  // Build updated winsPerMode
  const winsPerMode: Record<string, number> = { ...(profile.winsPerMode as Record<string, number>) };
  if (isWinner) {
    const modePrefix = isMultiplayer ? 'mp' : 'sp';
    const variantKey = variant === 'SOCIAL_OVERDRIVE'
      ? 'social' : variant === 'BIO_FUEL'
        ? 'bio' : variant === 'HAUNTED'
          ? 'haunted' : 'standard';
    const key = `${modePrefix}_${variantKey}`;
    winsPerMode[key] = (winsPerMode[key] ?? 0) + 1;
  }

  let updated: PlayerProfile = {
    ...profile,
    currencyBalance: profile.currencyBalance + creditsEarned,
    lifetimeEarned: profile.lifetimeEarned + creditsEarned,
    totalGames: profile.totalGames + 1,
    totalWins: isWinner ? profile.totalWins + 1 : profile.totalWins,
    convertedTrophies: profile.convertedTrophies + trophies,
    convertedMomentFlags: profile.convertedMomentFlags + momentFlags,
    convertedGameIds: [...(profile.convertedGameIds as string[]), gameId],
    winsPerMode,
    updatedAt: now,
  };

  // Check milestones after updating wins
  const prevMilestones = new Set((updated.milestoneUnlocks ?? []) as string[]);
  updated = applyMilestones(updated);
  const milestoneUnlocked = ((updated.milestoneUnlocks ?? []) as string[]).filter((m) => !prevMilestones.has(m));

  return { creditsEarned, milestoneUnlocked, updatedProfile: updated };
}

/**
 * Legacy: generic achievement conversion (used by the /api/player/:id/convert
 * endpoint for backwards compatibility).  Does NOT record a gameId.
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
    updatedAt: new Date(),
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
  if ((profile.ownedCosmetics as string[]).includes(cosmeticId))
    throw new Error(`Cosmetic '${cosmeticId}' already owned.`);
  if (profile.currencyBalance < item.cost)
    throw new Error(`Insufficient credits. Need ${item.cost}, have ${profile.currencyBalance}.`);

  return {
    ...profile,
    currencyBalance: profile.currencyBalance - item.cost,
    lifetimeSpent: profile.lifetimeSpent + item.cost,
    ownedCosmetics: [...(profile.ownedCosmetics as string[]), cosmeticId],
    updatedAt: new Date(),
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
  if (!(profile.ownedCosmetics as string[]).includes(cosmeticId))
    throw new Error(`Cosmetic '${cosmeticId}' not owned.`);

  const slot = getSlotFromType(item.type);
  const newEquipped: Record<string, string> = {
    ...(profile.equippedCosmetics as Record<string, string>),
    [slot]: cosmeticId,
  };

  return {
    ...profile,
    equippedCosmetics: newEquipped,
    updatedAt: new Date(),
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

  const slot = getSlotFromType(item.type);
  const newEquipped: Record<string, string> = { ...(profile.equippedCosmetics as Record<string, string>) };
  delete newEquipped[slot];

  return {
    ...profile,
    equippedCosmetics: newEquipped,
    updatedAt: new Date(),
  };
}

// ─── Credit Pack Definitions ─────────────────────────────────────────────────
// Server is the single source of truth for credits→cents mapping.
// Client only sends the pack key; server looks up the real amounts.

export const CREDIT_PACK_MAP: Record<string, { credits: number; cents: number; label: string }> = {
  '500':  { credits: 500,  cents:  99, label: '500 Credits'   },
  '1200': { credits: 1200, cents: 199, label: '1,200 Credits' },
  '3000': { credits: 3000, cents: 399, label: '3,000 Credits' },
  '7500': { credits: 7500, cents: 899, label: '7,500 Credits' },
};

// ─── Stripe ───────────────────────────────────────────────────────────────────

import Stripe from 'stripe';

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set.');
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' });
}

/**
 * Creates a Stripe PaymentIntent for a credit pack purchase.
 * The pack key (e.g. '500', '1200') is resolved server-side to credits + cents.
 * Returns { clientSecret } for the front-end to confirm the payment.
 */
export async function purchaseCurrency(
  userId: string,
  packKey: string,
): Promise<{ clientSecret: string; credits: number; label: string }> {
  const pack = CREDIT_PACK_MAP[packKey];
  if (!pack) throw new Error(`Unknown credit pack '${packKey}'.`);

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: pack.cents,
    currency: 'usd',
    metadata: {
      userId,
      packKey,
      credits: String(pack.credits),
      label: pack.label,
    },
  });

  if (!intent.client_secret) throw new Error('Stripe did not return a client secret.');

  return { clientSecret: intent.client_secret, credits: pack.credits, label: pack.label };
}

/**
 * Add credits from a confirmed Stripe payment.
 *
 * STRIPE_HOOK: Call this from the Stripe webhook handler AFTER:
 *   1. Verifying the webhook signature with stripe.webhooks.constructEvent()
 *   2. Confirming event.type === 'payment_intent.succeeded'
 *   3. Looking up the pending stripe_transactions row by stripePaymentIntentId
 *
 * Should ONLY be called from server-side webhook processing – never from client.
 */
export function addCurrencyFromStripe(
  profile: PlayerProfile,
  amount: number,
): PlayerProfile {
  if (amount <= 0) throw new Error('Amount must be positive.');
  return {
    ...profile,
    currencyBalance: profile.currencyBalance + amount,
    lifetimeEarned: profile.lifetimeEarned + amount,
    updatedAt: new Date(),
  };
}
