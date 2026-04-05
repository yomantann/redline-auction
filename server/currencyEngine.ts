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
    id: 'logo_neon_red',
    name: 'Neon Red',
    type: 'logo',
    cost: 5000,
    rarity: 'common',
    asset: 'logo_neon_red',
    earnableOnly: false,
  },
  {
    id: 'logo_abstract',
    name: 'Abstract Symbol',
    type: 'logo',
    cost: 15000,
    rarity: 'rare',
    asset: 'logo_abstract',
    earnableOnly: false,
  },
  {
    id: 'logo_typography',
    name: 'Typography',
    type: 'logo',
    cost: 0,
    rarity: 'common',
    asset: 'logo_typography',
    earnableOnly: false,
  },
  {
    id: 'logo_cracked_crown',
    name: 'Cracked Crown',
    type: 'logo',
    cost: 15000,
    rarity: 'rare',
    asset: 'logo_cracked_crown',
    earnableOnly: false,
  },
  {
    id: 'logo_executioner',
    name: 'Executioner',
    type: 'logo',
    cost: 15000,
    rarity: 'rare',
    asset: 'logo_executioner',
    earnableOnly: false,
  },
  {
    id: 'logo_executioner2',
    name: 'Executioner II',
    type: 'logo',
    cost: 15000,
    rarity: 'rare',
    asset: 'logo_executioner2',
    earnableOnly: false,
  },
  {
    id: 'logo_golden_skull',
    name: 'Golden Skull',
    type: 'logo',
    cost: 20000,
    rarity: 'legendary',
    asset: 'logo_golden_skull',
    earnableOnly: false,
  },
  {
    id: 'logo_velocity',
    name: 'Velocity',
    type: 'logo',
    cost: 15000,
    rarity: 'rare',
    asset: 'logo_velocity',
    earnableOnly: false,
  },
  {
    id: 'logo_warlord',
    name: 'Warlord',
    type: 'logo',
    cost: 20000,
    rarity: 'legendary',
    asset: 'logo_warlord',
    earnableOnly: false,
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
  // ── Generated Card Borders ──────────────────────────────────────────────────
  {
    id: 'border_steel',
    name: 'Steel',
    type: 'border',
    cost: 0,
    rarity: 'common',
    asset: 'border_steel',
    earnableOnly: false,
  },
  {
    id: 'border_dual',
    name: 'Dual',
    type: 'border',
    cost: 0,
    rarity: 'common',
    asset: 'border_dual',
    earnableOnly: false,
  },
  {
    id: 'border_molten',
    name: 'Molten',
    type: 'border',
    cost: 10000,
    rarity: 'rare',
    asset: 'border_molten',
    earnableOnly: false,
  },
  {
    id: 'border_organic',
    name: 'Organic',
    type: 'border',
    cost: 10000,
    rarity: 'rare',
    asset: 'border_organic',
    earnableOnly: false,
  },
  {
    id: 'border_cryo_glass',
    name: 'Cryo Glass',
    type: 'border',
    cost: 10000,
    rarity: 'rare',
    asset: 'border_cryo_glass',
    earnableOnly: false,
  },
  {
    id: 'border_abyssal_depth',
    name: 'Abyssal Depth',
    type: 'border',
    cost: 30000,
    rarity: 'legendary',
    asset: 'border_abyssal_depth',
    earnableOnly: false,
  },
  {
    id: 'border_quantum',
    name: 'Quantum',
    type: 'border',
    cost: 30000,
    rarity: 'legendary',
    asset: 'border_quantum',
    earnableOnly: false,
  },
  {
    id: 'border_static_overload',
    name: 'Static Overload',
    type: 'border',
    cost: 30000,
    rarity: 'legendary',
    asset: 'border_static_overload',
    earnableOnly: false,
  },
  {
    id: 'border_galactic',
    name: 'Galactic',
    type: 'border',
    cost: 30000,
    rarity: 'legendary',
    asset: 'border_galactic',
    earnableOnly: false,
  },

  // ── Backgrounds ─────────────────────────────────────────────────────────────
  // ── Generated Card Backgrounds ──────────────────────────────────────────────
  {
    id: 'molten_b',
    name: 'Molten',
    type: 'background',
    cost: 10000,
    rarity: 'rare',
    asset: 'molten_b',
    earnableOnly: false,
  },
  {
    id: 'dual_b',
    name: 'Dual',
    type: 'background',
    cost: 0,
    rarity: 'common',
    asset: 'dual_b',
    earnableOnly: false,
  },
  {
    id: 'organic_b',
    name: 'Organic',
    type: 'background',
    cost: 0,
    rarity: 'common',
    asset: 'organic_b',
    earnableOnly: false,
  },
  {
    id: 'abyssal_depth_b',
    name: 'Abyssal Depth',
    type: 'background',
    cost: 10000,
    rarity: 'rare',
    asset: 'abyssal_depth_b',
    earnableOnly: false,
  },
  {
    id: 'cryo_glass_b',
    name: 'Cryo Glass',
    type: 'background',
    cost: 10000,
    rarity: 'rare',
    asset: 'cryo_glass_b',
    earnableOnly: false,
  },
  {
    id: 'orbital_b',
    name: 'Orbital',
    type: 'background',
    cost: 10000,
    rarity: 'rare',
    asset: 'orbital_b',
    earnableOnly: false,
  },
  {
    id: 'orbital2_b',
    name: 'Orbital II',
    type: 'background',
    cost: 10000,
    rarity: 'rare',
    asset: 'orbital2_b',
    earnableOnly: false,
  },
  {
    id: 'static2_b',
    name: 'Static II',
    type: 'background',
    cost: 10000,
    rarity: 'rare',
    asset: 'static2_b',
    earnableOnly: false,
  },
  {
    id: 'static_overload_b',
    name: 'Static Overload',
    type: 'background',
    cost: 30000,
    rarity: 'legendary',
    asset: 'static_overload_b',
    earnableOnly: false,
  },
  {
    id: 'galactic_b',
    name: 'Galactic',
    type: 'background',
    cost: 30000,
    rarity: 'legendary',
    asset: 'galactic_b',
    earnableOnly: false,
  },

  // ── Driver Skins ────────────────────────────────────────────────────────────
  // Skins are driver-specific: driverIds indicates which character must be active
  // for the skin overlay to render. Owning a skin is permanent; it just won't
  // visually apply when playing a different driver.

  // ── Accuser Skins ───────────────────────────────────────────────────────────
  {
    id: 'skin_accuser_dreamer',
    name: 'The Dreamer',
    type: 'driverSkin',
    cost: 0,
    rarity: 'common',
    asset: 'skin_accuser_dreamer',
    driverIds: ['accuser'],
  },
  {
    id: 'skin_accuser_duchess',
    name: 'Damning Duchess',
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_accuser_duchess',
    driverIds: ['accuser'],
  },

  // ── Alpha Prime Skins ───────────────────────────────────────────────────────
  {
    id: 'skin_alpha_ragnar',
    name: 'Ragnar Ironjaw',
    type: 'driverSkin',
    cost: 25000,
    rarity: 'common',
    asset: 'skin_alpha_ragnar',
    driverIds: ['alpha_prime'],
  },
  {
    id: 'skin_alpha_hewn_knight',
    name: 'The Hewn Knight',
    type: 'driverSkin',
    cost: 125000,
    rarity: 'legendary',
    asset: 'skin_alpha_hewn_knight',
    driverIds: ['alpha_prime'],
  },

  // ── The Anointed Skins ──────────────────────────────────────────────────────
  {
    id: 'skin_anointed_masquerade',
    name: 'Masquerade Sovereign',
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_anointed_masquerade',
    driverIds: ['anointed'],
  },
  {
    id: 'skin_anointed_divine_sentinel',
    name: 'Divine Sentinel',
    type: 'driverSkin',
    cost: 25000,
    rarity: 'common',
    asset: 'skin_anointed_divine_sentinel',
    driverIds: ['anointed'],
  },

  // ── Click-Click Skins ───────────────────────────────────────────────────────
  {
    id: 'skin_click_roarcat',
    name: 'Roarcat',
    type: 'driverSkin',
    cost: 25000,
    rarity: 'common',
    asset: 'skin_click_roarcat',
    driverIds: ['click_click'],
  },

  // ── Rainbow Dash Skins ──────────────────────────────────────────────────────
  {
    id: 'skin_dash_stormhare',
    name: 'Stormhare the Swift',
    type: 'driverSkin',
    cost: 25000,
    rarity: 'common',
    asset: 'skin_dash_stormhare',
    driverIds: ['rainbow_dash'],
  },
  {
    id: 'skin_dash_colosseum_sprint',
    name: 'Colosseum Sprint',
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_dash_colosseum_sprint',
    driverIds: ['rainbow_dash'],
  },

  // ── Frostbyte Skins ─────────────────────────────────────────────────────────
  {
    id: 'skin_frost_glaciodon',
    name: 'Glaciodon',
    type: 'driverSkin',
    cost: 25000,
    rarity: 'common',
    asset: 'skin_frost_glaciodon',
    driverIds: ['frostbyte'],
  },
  {
    id: 'skin_frost_skaldi',
    name: "Skaldi's Chosen",
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_frost_skaldi',
    driverIds: ['frostbyte'],
  },

  // ── Executive P Skins ───────────────────────────────────────────────────────
  {
    id: 'skin_executive_rail_baron',
    name: 'The Rail Baron',
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_executive_rail_baron',
    driverIds: ['executive_p'],
  },

  // ── Guardian H Skins ────────────────────────────────────────────────────────
  {
    id: 'skin_guardian_ironknuckle',
    name: 'Ironknuckle',
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_guardian_ironknuckle',
    driverIds: ['guardian_h'],
  },

  // ── Hotwired Skins ──────────────────────────────────────────────────────────
  {
    id: 'skin_hotwired_pyra',
    name: 'Pyra',
    type: 'driverSkin',
    cost: 125000,
    rarity: 'legendary',
    asset: 'skin_hotwired_pyra',
    driverIds: ['hotwired'],
  },

  // ── Low Flame Skins ─────────────────────────────────────────────────────────
  {
    id: 'skin_lowflame_wolfman',
    name: 'Wolfman',
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_lowflame_wolfman',
    driverIds: ['low_flame'],
  },
  {
    id: 'skin_lowflame_high_noon',
    name: 'High Noon Nothing',
    type: 'driverSkin',
    cost: 25000,
    rarity: 'common',
    asset: 'skin_lowflame_high_noon',
    driverIds: ['low_flame'],
  },

  // ── Pain Hider Skins ────────────────────────────────────────────────────────
  {
    id: 'skin_pain_highborn',
    name: 'Highborn Elder',
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_pain_highborn',
    driverIds: ['pain_hider'],
  },

  // ── Panic Bot Skins ─────────────────────────────────────────────────────────
  {
    id: 'skin_panic_glitchosaurus',
    name: 'Glitchosaurus',
    type: 'driverSkin',
    cost: 25000,
    rarity: 'common',
    asset: 'skin_panic_glitchosaurus',
    driverIds: ['panic_bot'],
  },

  // ── The Rind Skins ──────────────────────────────────────────────────────────
  {
    id: 'skin_rind_sewer',
    name: 'Sewer Sharpshooter',
    type: 'driverSkin',
    cost: 125000,
    rarity: 'legendary',
    asset: 'skin_rind_sewer',
    driverIds: ['the_rind'],
  },

  // ── Roll Safe Skins ─────────────────────────────────────────────────────────
  {
    id: 'skin_roll_calculated',
    name: 'Calculated Ace',
    type: 'driverSkin',
    cost: 25000,
    rarity: 'common',
    asset: 'skin_roll_calculated',
    driverIds: ['roll_safe'],
  },
  {
    id: 'skin_roll_intel_officer',
    name: 'Intel Officer',
    type: 'driverSkin',
    cost: 25000,
    rarity: 'common',
    asset: 'skin_roll_intel_officer',
    driverIds: ['roll_safe'],
  },

  // ── Additional Named Skins ──────────────────────────────────────────────────
  {
    id: 'skin_rind_gutter_gladiator',
    name: 'Gutter Gladiator',
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_rind_gutter_gladiator',
    driverIds: ['the_rind'],
  },
  {
    id: 'skin_click_sir_whiskers_wrong',
    name: 'Sir Whiskers Wrong',
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_click_sir_whiskers_wrong',
    driverIds: ['click_click'],
  },
  {
    id: 'skin_guardian_unmoved_marshal',
    name: 'Unmoved Marshal',
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_guardian_unmoved_marshal',
    driverIds: ['guardian_h'],
  },
  {
    id: 'skin_hotwired_high_score_hazard',
    name: 'High Score Hazard',
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_hotwired_high_score_hazard',
    driverIds: ['hotwired'],
  },
  {
    id: 'skin_pain_walking_wound',
    name: 'The Walking Wound',
    type: 'driverSkin',
    cost: 40000,
    rarity: 'rare',
    asset: 'skin_pain_walking_wound',
    driverIds: ['pain_hider'],
  },

  // ── Limited-Time Items ──────────────────────────────────────────────────────
  // (Placeholder items removed — real limited-time items will be added here)
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
  cosmeticId?: string;   // The cosmetic this milestone unlocks (optional)
  creditReward?: number; // Credits awarded when this milestone is first completed (optional)
  description: string;
  /** Returns true if the given profile meets this milestone. */
  check: (profile: PlayerProfile) => boolean;
}

/** Helper to sum all wins across a winsPerMode record. */
function totalWins(winsPerMode: Record<string, number>): number {
  return Object.values(winsPerMode).reduce((s, v) => s + (v ?? 0), 0);
}

/** Helper: get count for a specific moment flag type from profile. */
function flagCount(profile: PlayerProfile, flag: string): number {
  const perType = profile.momentFlagsPerType as Record<string, number> | null | undefined;
  if (!perType) return 0;
  return perType[flag.toUpperCase()] ?? 0;
}

/** Helper: count how many distinct flag types from a given set have been earned at least once. */
function distinctFlagsEarned(profile: PlayerProfile, flags: string[]): number {
  const perType = profile.momentFlagsPerType as Record<string, number> | null | undefined;
  if (!perType) return 0;
  return flags.filter(f => (perType[f.toUpperCase()] ?? 0) >= 1).length;
}

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  // ── Cosmetic milestones ──────────────────────────────────────────────────────
  {
    id: 'milestone_10_wins',
    cosmeticId: 'border_molten',
    description: 'Win 10 total games across any mode.',
    check: (p) => totalWins(p.winsPerMode as Record<string, number>) >= 10,
  },
  {
    id: 'milestone_5_haunted_wins',
    cosmeticId: 'abyssal_depth_b',
    description: 'Win 5 Haunted mode games (SP or MP).',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return ((m['sp_haunted'] ?? 0) + (m['mp_haunted'] ?? 0)) >= 5;
    },
  },
  {
    id: 'milestone_collector_5',
    cosmeticId: 'logo_neon_red',
    description: 'Own 5 or more cosmetics.',
    check: (p) => ((p.ownedCosmetics as string[]).length) >= 5,
  },

  // ── Credit reward milestones ─────────────────────────────────────────────────
  {
    id: 'milestone_first_game',
    creditReward: 200,
    description: 'Play your first game.',
    check: (p) => p.totalGames >= 1,
  },
  {
    id: 'milestone_10_games',
    creditReward: 1000,
    description: 'Play 10 total games.',
    check: (p) => p.totalGames >= 10,
  },
  {
    id: 'milestone_50_games',
    creditReward: 10000,
    description: 'Play 50 total games.',
    check: (p) => p.totalGames >= 50,
  },
  {
    id: 'milestone_100_games',
    creditReward: 20000,
    description: 'Play 100 total games.',
    check: (p) => p.totalGames >= 100,
  },
  {
    id: 'milestone_first_win',
    creditReward: 500,
    description: 'Win your first game.',
    check: (p) => totalWins(p.winsPerMode as Record<string, number>) >= 1,
  },
  {
    id: 'milestone_25_wins',
    creditReward: 5000,
    description: 'Win 25 total games across any mode.',
    check: (p) => totalWins(p.winsPerMode as Record<string, number>) >= 25,
  },
  {
    id: 'milestone_50_wins',
    creditReward: 30000,
    description: 'Win 50 total games across any mode.',
    check: (p) => totalWins(p.winsPerMode as Record<string, number>) >= 50,
  },
  {
    id: 'milestone_100_wins',
    creditReward: 50000,
    description: 'Win 100 total games across any mode.',
    check: (p) => totalWins(p.winsPerMode as Record<string, number>) >= 100,
  },
  {
    id: 'milestone_500_wins',
    creditReward: 200000,
    description: 'Win 500 total games across any mode.',
    check: (p) => totalWins(p.winsPerMode as Record<string, number>) >= 500,
  },
  {
    id: 'milestone_haunted_10_wins',
    cosmeticId: 'static_overload_b',
    description: 'Win 10 Haunted mode games (SP or MP).',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return ((m['sp_haunted'] ?? 0) + (m['mp_haunted'] ?? 0)) >= 10;
    },
  },
  {
    id: 'milestone_sp_10_wins',
    creditReward: 2000,
    description: 'Win 10 Single Player games.',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return ((m['sp_standard'] ?? 0) + (m['sp_social'] ?? 0) + (m['sp_bio'] ?? 0) + (m['sp_haunted'] ?? 0)) >= 10;
    },
  },
  {
    id: 'milestone_mp_5_wins',
    creditReward: 2000,
    description: 'Win 5 Multiplayer games.',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return ((m['mp_standard'] ?? 0) + (m['mp_social'] ?? 0) + (m['mp_bio'] ?? 0) + (m['mp_haunted'] ?? 0)) >= 5;
    },
  },
  {
    id: 'milestone_mp_25_wins',
    creditReward: 10000,
    description: 'Win 25 Multiplayer games.',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return ((m['mp_standard'] ?? 0) + (m['mp_social'] ?? 0) + (m['mp_bio'] ?? 0) + (m['mp_haunted'] ?? 0)) >= 25;
    },
  },
  {
    id: 'milestone_sprint_5_wins',
    creditReward: 1000,
    description: 'Win 5 Standard mode games (SP or MP).',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return ((m['sp_standard'] ?? 0) + (m['mp_standard'] ?? 0)) >= 5;
    },
  },
  {
    id: 'milestone_social_5_wins',
    creditReward: 1000,
    description: 'Win 5 Social Overdrive games.',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return ((m['sp_social'] ?? 0) + (m['mp_social'] ?? 0)) >= 5;
    },
  },
  {
    id: 'milestone_bio_5_wins',
    creditReward: 1000,
    description: 'Win 5 Bio Fuel games.',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return ((m['sp_bio'] ?? 0) + (m['mp_bio'] ?? 0)) >= 5;
    },
  },

  // ── Competitive Win Milestones ─────────────────────────────────────────────
  {
    id: 'milestone_competitive_first_win',
    creditReward: 1000,
    description: 'Win your first Competitive game.',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['comp'] ?? 0) >= 1;
    },
  },
  {
    id: 'milestone_competitive_5_wins',
    creditReward: 3000,
    description: 'Win 5 Competitive games.',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['comp'] ?? 0) >= 5;
    },
  },
  {
    id: 'milestone_competitive_25_wins',
    creditReward: 15000,
    description: 'Win 25 Competitive games.',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['comp'] ?? 0) >= 25;
    },
  },
  {
    id: 'milestone_competitive_50_wins',
    creditReward: 40000,
    description: 'Win 50 Competitive games.',
    check: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['comp'] ?? 0) >= 50;
    },
  },
  {
    id: 'milestone_credits_5000',
    creditReward: 250000,
    description: 'Earn 5,000 total lifetime credits.',
    check: (p) => p.lifetimeEarned >= 5000,
  },
  {
    id: 'milestone_credits_1000000',
    creditReward: 250000,
    description: 'Earn 1,000,000 total lifetime credits.',
    check: (p) => p.lifetimeEarned >= 1000000,
  },
  {
    id: 'milestone_fashion_icon',
    creditReward: 1000,
    description: 'Own 10 or more cosmetics.',
    check: (p) => ((p.ownedCosmetics as string[]).length) >= 10,
  },

  // ── Moment Flag milestones ────────────────────────────────────────────────
  {
    id: 'milestone_flags_10',
    creditReward: 150,
    description: 'Earn 10 lifetime moment flags.',
    check: (p) => (p.convertedMomentFlags ?? 0) >= 10,
  },
  {
    id: 'milestone_flags_50',
    creditReward: 400,
    description: 'Earn 50 lifetime moment flags.',
    check: (p) => (p.convertedMomentFlags ?? 0) >= 50,
  },
  {
    id: 'milestone_flags_100',
    creditReward: 750,
    description: 'Earn 100 lifetime moment flags.',
    check: (p) => (p.convertedMomentFlags ?? 0) >= 100,
  },
  {
    id: 'milestone_flags_250',
    creditReward: 1500,
    description: 'Earn 250 lifetime moment flags.',
    check: (p) => (p.convertedMomentFlags ?? 0) >= 250,
  },

  // ── Specific Moment Flag Milestones ──────────────────────────────────────
  // Easter Egg (Hidden Flag) Milestones — descriptions intentionally vague
  {
    id: 'milestone_easter_egg_first',
    creditReward: 10000,
    description: 'Uncover your first hidden secret.',
    check: (p) => distinctFlagsEarned(p, [
      'HIDDEN_67', 'HIDDEN_REDLINE_REVERSAL', 'HIDDEN_DEJA_BID',
      'PATCH_NOTES_PENDING', 'HIDDEN_REDEMPTION', 'HIDDEN_NAIL_IN_THE_COFFIN',
    ]) >= 1,
  },
  {
    id: 'milestone_easter_egg_two',
    creditReward: 25000,
    description: 'Uncover 4 different hidden secrets.',
    check: (p) => distinctFlagsEarned(p, [
      'HIDDEN_67', 'HIDDEN_REDLINE_REVERSAL', 'HIDDEN_DEJA_BID',
      'PATCH_NOTES_PENDING', 'HIDDEN_REDEMPTION', 'HIDDEN_NAIL_IN_THE_COFFIN',
    ]) >= 4,
  },
  {
    id: 'milestone_easter_egg_all',
    creditReward: 200000,
    description: 'Uncover every hidden secret.',
    check: (p) => distinctFlagsEarned(p, [
      'HIDDEN_67', 'HIDDEN_REDLINE_REVERSAL', 'HIDDEN_DEJA_BID',
      'PATCH_NOTES_PENDING', 'HIDDEN_REDEMPTION', 'HIDDEN_NAIL_IN_THE_COFFIN',
    ]) >= 6,
  },
  {
    id: 'milestone_hidden_67_3x',
    creditReward: 10000,
    description: 'Uncover a hidden numerical moment 3 times.',
    check: (p) => flagCount(p, 'HIDDEN_67') >= 3,
  },
  {
    id: 'milestone_hidden_redemption_first',
    creditReward: 10000,
    description: 'Trigger a hidden comeback 3 times.',
    check: (p) => flagCount(p, 'HIDDEN_REDEMPTION') >= 3,
  },
  {
    id: 'milestone_hidden_nail_3x',
    creditReward: 10000,
    description: 'Uncover a hidden finishing move 3 times.',
    check: (p) => flagCount(p, 'HIDDEN_NAIL_IN_THE_COFFIN') >= 3,
  },
  {
    id: 'milestone_hidden_deja_bid',
    creditReward: 10000,
    description: 'Trigger a hidden repeating pattern 3 times.',
    check: (p) => flagCount(p, 'HIDDEN_DEJA_BID') >= 3,
  },
  // Clutch / Skill Milestones
  {
    id: 'milestone_clutch_3x',
    creditReward: 500,
    description: 'Earn Clutch Play 6 times.',
    check: (p) => flagCount(p, 'CLUTCH_PLAY') >= 6,
  },
  {
    id: 'milestone_clutch_10x',
    creditReward: 2000,
    description: 'Earn Clutch Play 20 times.',
    check: (p) => flagCount(p, 'CLUTCH_PLAY') >= 20,
  },
  {
    id: 'milestone_precision_5x',
    creditReward: 500,
    description: 'Earn Precision Strike 10 times.',
    check: (p) => flagCount(p, 'PRECISION_STRIKE') >= 10,
  },
  {
    id: 'milestone_overkill_3x',
    creditReward: 500,
    description: 'Earn Overkill 6 times.',
    check: (p) => flagCount(p, 'OVERKILL') >= 6,
  },
  {
    id: 'milestone_late_panic_5x',
    creditReward: 750,
    description: 'Earn Late Panic 10 times.',
    check: (p) => flagCount(p, 'LATE_PANIC') >= 10,
  },
  // Strategic Milestones
  {
    id: 'milestone_genius_5x',
    creditReward: 750,
    description: 'Earn Genius Move 10 times.',
    check: (p) => flagCount(p, 'GENIUS_MOVE') >= 10,
  },
  {
    id: 'milestone_fake_calm_5x',
    creditReward: 500,
    description: 'Earn Fake Calm 10 times.',
    check: (p) => flagCount(p, 'FAKE_CALM') >= 10,
  },
  {
    id: 'milestone_smug_3x',
    creditReward: 300,
    description: 'Earn Smug Confidence 6 times.',
    check: (p) => flagCount(p, 'SMUG_CONFIDENCE') >= 6,
  },
  // Domination Milestones
  {
    id: 'milestone_last_standing_3x',
    creditReward: 750,
    description: 'Be Last One Standing 6 times.',
    check: (p) => flagCount(p, 'LAST_ONE_STANDING') >= 6,
  },
  {
    id: 'milestone_last_standing_10x',
    creditReward: 3000,
    description: 'Be Last One Standing 20 times.',
    check: (p) => flagCount(p, 'LAST_ONE_STANDING') >= 20,
  },
  // Comeback Milestones
  {
    id: 'milestone_comeback_5x',
    creditReward: 1000,
    description: 'Earn Comeback Hope 10 times.',
    check: (p) => flagCount(p, 'COMEBACK_HOPE') >= 10,
  },
  {
    id: 'milestone_comeback_10x',
    creditReward: 3000,
    description: 'Earn Comeback Hope 20 times.',
    check: (p) => flagCount(p, 'COMEBACK_HOPE') >= 20,
  },
  // Sync / Pattern Milestones
  {
    id: 'milestone_deadlock_3x',
    creditReward: 500,
    description: 'Trigger Deadlock Sync 6 times.',
    check: (p) => flagCount(p, 'DEADLOCK_SYNC') >= 6,
  },
  {
    id: 'milestone_mirror_3x',
    creditReward: 500,
    description: 'Trigger Mirror Match 6 times.',
    check: (p) => flagCount(p, 'MIRROR_MATCH') >= 6,
  },
  {
    id: 'milestone_deadlock_and_mirror',
    creditReward: 1000,
    description: 'Achieve both Deadlock Sync and Mirror Match at least once each.',
    check: (p) => flagCount(p, 'DEADLOCK_SYNC') >= 1 && flagCount(p, 'MIRROR_MATCH') >= 1,
  },
  {
    id: 'milestone_easy_w_5x',
    creditReward: 500,
    description: 'Earn Easy W 10 times.',
    check: (p) => flagCount(p, 'EASY_W') >= 10,
  },
  // Mastery Milestone
  {
    id: 'milestone_unique_10_flag_types',
    creditReward: 2500,
    description: 'Trigger 20 different unique moment flag types.',
    check: (p) => {
      const perType = (p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {};
      return Object.values(perType).filter(v => v >= 1).length >= 20;
    },
  },
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
    momentFlagsPerType: {},
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
 * Exported so the profile endpoint can apply milestones on load.
 */
export function applyMilestones(profile: PlayerProfile): PlayerProfile {
  let updated = { ...profile };
  for (const milestone of MILESTONE_DEFINITIONS) {
    const owned = (updated.ownedCosmetics ?? []) as string[];
    const unlocked = (updated.milestoneUnlocks ?? []) as string[];
    const alreadyDone = unlocked.includes(milestone.id) ||
      (milestone.cosmeticId ? owned.includes(milestone.cosmeticId) : false);
    if (!alreadyDone && milestone.check(updated)) {
      const newOwned = milestone.cosmeticId ? [...owned, milestone.cosmeticId] : owned;
      const creditBonus = milestone.creditReward ?? 0;
      updated = {
        ...updated,
        ownedCosmetics: newOwned,
        milestoneUnlocks: [...unlocked, milestone.id],
        currencyBalance: updated.currencyBalance + creditBonus,
        lifetimeEarned: updated.lifetimeEarned + creditBonus,
      };
      console.log(`[Milestone] User ${updated.id} completed '${milestone.id}'${milestone.cosmeticId ? ` (cosmetic: ${milestone.cosmeticId})` : ''}${creditBonus ? ` (+${creditBonus} credits)` : ''}`);
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
  momentFlagTypes?: string[],
  isCompetitive?: boolean,
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
    if (isCompetitive) {
      winsPerMode['comp'] = (winsPerMode['comp'] ?? 0) + 1;
    }
  }

  let updated: PlayerProfile = {
    ...profile,
    currencyBalance: profile.currencyBalance + creditsEarned,
    lifetimeEarned: profile.lifetimeEarned + creditsEarned,
    totalGames: profile.totalGames + 1,
    totalWins: isWinner ? profile.totalWins + 1 : profile.totalWins,
    convertedTrophies: profile.convertedTrophies + trophies,
    convertedMomentFlags: profile.convertedMomentFlags + momentFlags,
    momentFlagsPerType: (() => {
      const current: Record<string, number> = { ...(profile.momentFlagsPerType as Record<string, number> ?? {}) };
      for (const flag of (momentFlagTypes ?? [])) {
        const key = flag.toUpperCase();
        current[key] = (current[key] ?? 0) + 1;
      }
      return current;
    })(),
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
  '25000':  { credits: 25000,  cents: 100,  label: '25,000 Credits'  },
  '125000': { credits: 125000, cents: 500,  label: '125,000 Credits' },
  '250000': { credits: 250000, cents: 1000, label: '250,000 Credits' },
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
