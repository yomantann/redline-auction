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
  WinsPerMode,
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

/** Helper to sum all wins across a winsPerMode object. */
function totalWins(winsPerMode: WinsPerMode): number {
  return Object.values(winsPerMode).reduce((s, v) => s + (v ?? 0), 0);
}

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    id: 'milestone_10_wins',
    cosmeticId: 'logo_apex',
    description: 'Win 10 total games across any mode.',
    check: (p) => totalWins(p.winsPerMode) >= 10,
  },
  {
    id: 'milestone_5_haunted_wins',
    cosmeticId: 'border_haunted',
    description: 'Win 5 Haunted mode games (SP or MP).',
    check: (p) => ((p.winsPerMode.sp_haunted ?? 0) + (p.winsPerMode.mp_haunted ?? 0)) >= 5,
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
 * Creates a fresh default player profile for a new user.
 * Always includes the four default "no cosmetic" items in ownedCosmetics.
 *
 * REPLIT_AUTH_HOOK: When Replit Auth is live, call this with:
 *   id        = req.user.id          (Replit Auth userId)
 *   username  = req.user.name || req.user.username
 * and store replitUserId = req.user.id on the profile.
 */
export function createDefaultProfile(id: string, username: string): PlayerProfile {
  const now = new Date().toISOString();
  return {
    id,
    username,
    currencyBalance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
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
    if (
      !updated.ownedCosmetics.includes(milestone.cosmeticId) &&
      !updated.milestoneUnlocks.includes(milestone.cosmeticId) &&
      milestone.check(updated)
    ) {
      updated = {
        ...updated,
        ownedCosmetics: [...updated.ownedCosmetics, milestone.cosmeticId],
        milestoneUnlocks: [...updated.milestoneUnlocks, milestone.cosmeticId],
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
  if (profile.convertedGameIds.includes(gameId)) {
    return { creditsEarned: 0, milestoneUnlocked: [], updatedProfile: profile };
  }

  const creditsEarned = trophies * CREDITS_PER_TROPHY + momentFlags * CREDITS_PER_MOMENT_FLAG;
  const now = new Date().toISOString();

  // Build updated winsPerMode
  let winsPerMode: WinsPerMode = { ...profile.winsPerMode };
  if (isWinner) {
    const modePrefix = isMultiplayer ? 'mp' : 'sp';
    const variantKey = variant === 'SOCIAL_OVERDRIVE'
      ? 'social' : variant === 'BIO_FUEL'
        ? 'bio' : variant === 'HAUNTED'
          ? 'haunted' : 'standard';
    const key = `${modePrefix}_${variantKey}` as keyof WinsPerMode;
    winsPerMode = { ...winsPerMode, [key]: (winsPerMode[key] ?? 0) + 1 };
  }

  let updated: PlayerProfile = {
    ...profile,
    currencyBalance: profile.currencyBalance + creditsEarned,
    lifetimeEarned: profile.lifetimeEarned + creditsEarned,
    convertedTrophies: profile.convertedTrophies + trophies,
    convertedMomentFlags: profile.convertedMomentFlags + momentFlags,
    convertedGameIds: [...profile.convertedGameIds, gameId],
    winsPerMode,
    updatedAt: now,
  };

  // Check milestones after updating wins
  const prevMilestones = new Set(updated.milestoneUnlocks);
  updated = applyMilestones(updated);
  const milestoneUnlocked = updated.milestoneUnlocks.filter((m) => !prevMilestones.has(m));

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

  const slot = getSlotFromType(item.type);
  const newEquipped: EquippedCosmetics = {
    ...profile.equippedCosmetics,
    [slot]: cosmeticId,
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

  const slot = getSlotFromType(item.type);
  const newEquipped: EquippedCosmetics = { ...profile.equippedCosmetics };
  delete newEquipped[slot];

  return {
    ...profile,
    equippedCosmetics: newEquipped,
    updatedAt: new Date().toISOString(),
  };
}

// ─── Stripe Placeholder ──────────────────────────────────────────────────────
//
// STRIPE_HOOK: Steps to wire Stripe:
//   1. npm install stripe
//   2. Set STRIPE_SECRET_KEY in environment variables
//   3. In purchaseCurrency(), call:
//        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//        const intent = await stripe.paymentIntents.create({
//          amount: amountInCents,  // e.g. amount * 0.01 USD per credit
//          currency: 'usd',
//          metadata: { userId, itemType, itemId, itemLabel },
//        });
//        return { clientSecret: intent.client_secret };
//   4. Add a POST /api/stripe/webhook route (see routes.ts STRIPE_WEBHOOK_ENDPOINT).
//   5. In the webhook, call addCurrencyFromStripe() and mark the DB row 'completed'.
//
// REPLIT_AUTH_HOOK: Replace userId with the Replit Auth userId from req.user.id.
//   All currency functions already accept userId as a plain string, so no
//   internal changes are needed – just pass the Replit Auth ID instead of
//   "local_player".

/**
 * Placeholder: initiate a currency purchase via Stripe.
 *
 * Returns a placeholder response until Stripe is integrated.
 * When live, returns { clientSecret } from Stripe PaymentIntent.
 *
 * @param _userId        Player's userId (= Replit Auth userId when live)
 * @param _amount        Credits to purchase
 * @param _itemType      What is being purchased ('credits_pack' | 'cosmetic')
 * @param _itemId        Cosmetic id (when itemType = 'cosmetic'), or pack SKU
 * @param _itemLabel     Human-readable label for the transaction record
 */
export async function purchaseCurrency(
  _userId: string,
  _amount: number,
  _itemType: 'credits_pack' | 'cosmetic' = 'credits_pack',
  _itemId?: string,
  _itemLabel?: string,
): Promise<{ clientSecret: string | null; message: string }> {
  // STRIPE_HOOK: Create Stripe PaymentIntent here.
  // On webhook confirmation call addCurrencyFromStripe(userId, amount).
  return {
    clientSecret: null,
    message: 'Stripe integration coming soon.',
  };
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
    updatedAt: new Date().toISOString(),
  };
}
