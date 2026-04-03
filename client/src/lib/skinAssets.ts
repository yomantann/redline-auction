/**
 * skinAssets.ts
 *
 * Vite asset imports for all purchaseable driver skin PNGs.
 * Importing via this module lets Vite hash, optimize, and tree-shake the images.
 *
 * SKIN_ASSET_URLS  — skin cosmetic ID → resolved image URL
 * SKIN_DRIVER_REQUIREMENT — skin cosmetic ID → required driver ID (undefined = any driver)
 *
 * When adding new skins:
 *  1. Add an import below.
 *  2. Add entries to SKIN_ASSET_URLS and SKIN_DRIVER_REQUIREMENT.
 *  3. Add a matching CosmeticItem to COSMETICS_CATALOG in server/currencyEngine.ts.
 */

// ── Accuser ──────────────────────────────────────────────────────────────────
import skinAccuserDreamer from "../assets/generated_images/Skins/accuser_dreamer.png";
import skinAccuserDuchess from "../assets/generated_images/Skins/accuser_the damning duchess.png";

// ── Alpha Prime ──────────────────────────────────────────────────────────────
import skinAlphaRagnar from "../assets/generated_images/Skins/alpha_ragnar ironjaw.png";

// ── The Anointed ─────────────────────────────────────────────────────────────
import skinAnointedMasquerade from "../assets/generated_images/Skins/anointed_masquerade sovereign.png";

// ── Click-Click ──────────────────────────────────────────────────────────────
import skinClickRoarcat from "../assets/generated_images/Skins/click_roarcat.png";

// ── Rainbow Dash ─────────────────────────────────────────────────────────────
import skinDashStormhare from "../assets/generated_images/Skins/dash_stormhare the swift.png";

// ── Frostbyte ────────────────────────────────────────────────────────────────
import skinFrostGlaciodon from "../assets/generated_images/Skins/frost_glaciodon.png";
import skinFrostSkaldi from "../assets/generated_images/Skins/frost_skaldi's chosen.png";

// ── Guardian H ───────────────────────────────────────────────────────────────
import skinGuardianIronknuckle from "../assets/generated_images/Skins/guardian_ironknuckle.png";

// ── Hotwired ─────────────────────────────────────────────────────────────────
import skinHotwiredPyra from "../assets/generated_images/Skins/hotwired_pyra.png";

// ── Low Flame ────────────────────────────────────────────────────────────────
import skinLowflameWolfman from "../assets/generated_images/Skins/lowflame_wolfman.png";

// ── Pain Hider ───────────────────────────────────────────────────────────────
import skinPainHighborn from "../assets/generated_images/Skins/pain_highborn elder.png";

// ── Panic Bot ────────────────────────────────────────────────────────────────
import skinPanicGlitchosaurus from "../assets/generated_images/Skins/panic_glitchosaurus.png";

// ── The Rind ─────────────────────────────────────────────────────────────────
import skinRindSewer from "../assets/generated_images/Skins/rind_sewer sharpshooter.png";

// ── Roll Safe ────────────────────────────────────────────────────────────────
import skinRollCalculated from "../assets/generated_images/Skins/roll_calculated ace.png";

// ─── Maps ────────────────────────────────────────────────────────────────────

/** Resolved image URL for each purchaseable skin cosmetic ID. */
export const SKIN_ASSET_URLS: Record<string, string> = {
  skin_accuser_dreamer:       skinAccuserDreamer,
  skin_accuser_duchess:       skinAccuserDuchess,
  skin_alpha_ragnar:          skinAlphaRagnar,
  skin_anointed_masquerade:   skinAnointedMasquerade,
  skin_click_roarcat:         skinClickRoarcat,
  skin_dash_stormhare:        skinDashStormhare,
  skin_frost_glaciodon:       skinFrostGlaciodon,
  skin_frost_skaldi:          skinFrostSkaldi,
  skin_guardian_ironknuckle:  skinGuardianIronknuckle,
  skin_hotwired_pyra:         skinHotwiredPyra,
  skin_lowflame_wolfman:      skinLowflameWolfman,
  skin_pain_highborn:         skinPainHighborn,
  skin_panic_glitchosaurus:   skinPanicGlitchosaurus,
  skin_rind_sewer:            skinRindSewer,
  skin_roll_calculated:       skinRollCalculated,
};

/**
 * Maps each driver-specific skin ID to the character/driver ID it requires.
 * If a skin ID is absent from this map it is driver-agnostic (e.g. skin_galaxy).
 */
export const SKIN_DRIVER_REQUIREMENT: Record<string, string> = {
  skin_accuser_dreamer:       'accuser',
  skin_accuser_duchess:       'accuser',
  skin_alpha_ragnar:          'alpha_prime',
  skin_anointed_masquerade:   'anointed',
  skin_click_roarcat:         'click_click',
  skin_dash_stormhare:        'rainbow_dash',
  skin_frost_glaciodon:       'frostbyte',
  skin_frost_skaldi:          'frostbyte',
  skin_guardian_ironknuckle:  'guardian_h',
  skin_hotwired_pyra:         'hotwired',
  skin_lowflame_wolfman:      'low_flame',
  skin_pain_highborn:         'pain_hider',
  skin_panic_glitchosaurus:   'panic_bot',
  skin_rind_sewer:            'the_rind',
  skin_roll_calculated:       'roll_safe',
};
