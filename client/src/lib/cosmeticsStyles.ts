/**
 * cosmeticsStyles.ts
 *
 * Maps cosmetic asset IDs to actual CSS / inline style values that can be
 * applied to player cards in-game and on the game-over screen.
 *
 * Border and background cosmetics use inline styles so we don't depend on
 * dynamic Tailwind class generation.  Driver skin cosmetics are image overlays.
 *
 * Equip fallback: when no cosmetic is equipped (or the equipped id is
 * 'xxx_default'), we return empty/null so the card uses its standard styling.
 */

import type { EquippedCosmetics } from "@shared/schema";

// ─── Border Styles ────────────────────────────────────────────────────────────

const BORDER_STYLES: Record<string, React.CSSProperties> = {
  border_neon: {
    borderColor: 'rgba(34, 211, 238, 0.7)',
    boxShadow: '0 0 8px rgba(34, 211, 238, 0.4), inset 0 0 8px rgba(34, 211, 238, 0.05)',
  },
  border_chrome: {
    borderColor: 'rgba(212, 212, 212, 0.6)',
    boxShadow: '0 0 4px rgba(255, 255, 255, 0.2)',
  },
  border_haunted: {
    borderColor: 'rgba(20, 184, 166, 0.8)',
    boxShadow: '0 0 12px rgba(20, 184, 166, 0.5), inset 0 0 12px rgba(20, 184, 166, 0.08)',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
};

// ─── Background Styles ───────────────────────────────────────────────────────

const BACKGROUND_STYLES: Record<string, React.CSSProperties> = {
  bg_sunset: {
    background: 'linear-gradient(135deg, rgba(255, 94, 58, 0.15) 0%, rgba(255, 195, 0, 0.10) 100%)',
  },
  bg_void: {
    background: 'linear-gradient(135deg, rgba(17, 0, 51, 0.95) 0%, rgba(51, 0, 102, 0.85) 100%)',
  },
  bg_galaxy: {
    background:
      'linear-gradient(135deg, rgba(0, 0, 40, 0.95) 0%, rgba(75, 0, 130, 0.8) 40%, rgba(0, 180, 216, 0.4) 100%)',
  },
};

// ─── Public helpers ───────────────────────────────────────────────────────────

/** Returns the border inline style for an equipped border cosmetic, or null for default. */
export function getBorderStyle(
  equipped: EquippedCosmetics | undefined,
): React.CSSProperties | null {
  if (!equipped?.border || equipped.border === 'border_default') return null;
  return BORDER_STYLES[equipped.border] ?? null;
}

/** Returns the background inline style for an equipped background cosmetic, or null for default. */
export function getBackgroundStyle(
  equipped: EquippedCosmetics | undefined,
): React.CSSProperties | null {
  if (!equipped?.background || equipped.background === 'bg_default') return null;
  return BACKGROUND_STYLES[equipped.background] ?? null;
}

/**
 * Returns the driver skin image URL for an equipped skin cosmetic, or null for default.
 * When non-null, render an <img> overlay on top of the character portrait.
 */
export function getDriverSkinUrl(
  equipped: EquippedCosmetics | undefined,
): string | null {
  if (!equipped?.driverSkin || equipped.driverSkin === 'skin_default') return null;
  // Skins with image assets
  const SKIN_URLS: Record<string, string> = {
    skin_chrome:  '/cosmetics/skins/chrome_driver.png',
    skin_phantom: '/cosmetics/skins/phantom_racer.png',
    skin_galaxy:  '/cosmetics/skins/galactic_drifter.png',
  };
  return SKIN_URLS[equipped.driverSkin] ?? null;
}

/**
 * Returns the logo image URL for an equipped logo cosmetic, or null for default.
 * Displayed on the game-over winner card and (future) MP lobby.
 */
export function getLogoUrl(
  equipped: EquippedCosmetics | undefined,
): string | null {
  if (!equipped?.logo || equipped.logo === 'logo_default') return null;
  const LOGO_URLS: Record<string, string> = {
    logo_redline:  '/cosmetics/logos/redline_crest.png',
    logo_circuit:  '/cosmetics/logos/circuit_breaker.png',
    logo_apex:     '/cosmetics/logos/apex_legend.png',
  };
  return LOGO_URLS[equipped.logo] ?? null;
}

/**
 * Composes border + background styles into a single style object.
 * Useful for applying both at once to a wrapping div.
 */
export function getCardStyles(equipped: EquippedCosmetics | undefined): React.CSSProperties {
  return {
    ...(getBackgroundStyle(equipped) ?? {}),
    ...(getBorderStyle(equipped) ?? {}),
  };
}
