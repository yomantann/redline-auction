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
 *
 * DRIVER-SPECIFIC SKINS:
 * Skins are scoped to specific drivers. Pass the current player's driver ID
 * (e.g. 'accuser', 'frostbyte') as the second argument to getDriverSkinUrl.
 * If the skin's required driver doesn't match, null is returned and no overlay
 * is applied — the player still owns the skin but it only renders for that driver.
 */

import type { EquippedCosmetics } from "@shared/schema";
import { SKIN_ASSET_URLS, SKIN_DRIVER_REQUIREMENT, CARD_BACKGROUND_URLS, CARD_BORDER_URLS, LOGO_ASSET_URLS } from "./skinAssets";

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
  border_turbo: {
    borderColor: 'rgba(249, 115, 22, 0.8)',
    boxShadow: '0 0 10px rgba(249, 115, 22, 0.5), inset 0 0 8px rgba(249, 115, 22, 0.06)',
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
  // Image-based borders are rendered via getBorderImageUrl overlay — skip border-image CSS here
  if (CARD_BORDER_URLS[equipped.border]) return null;
  return BORDER_STYLES[equipped.border] ?? null;
}

/**
 * Returns the PNG image URL for image-based border cosmetics, or null.
 * Used to render the border as an absolutely-positioned overlay with mix-blend-mode
 * so the white outer padding of the PNG becomes invisible on the dark card background.
 */
export function getBorderImageUrl(
  equipped: EquippedCosmetics | undefined,
): string | null {
  if (!equipped?.border || equipped.border === 'border_default') return null;
  return CARD_BORDER_URLS[equipped.border] ?? null;
}

/** Returns the background inline style for an equipped background cosmetic, or null for default. */
export function getBackgroundStyle(
  equipped: EquippedCosmetics | undefined,
): React.CSSProperties | null {
  if (!equipped?.background || equipped.background === 'bg_default') return null;
  // Image-based backgrounds (from generated CardBackground)
  const imgUrl = CARD_BACKGROUND_URLS[equipped.background];
  if (imgUrl) {
    return {
      backgroundImage: `url(${imgUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return BACKGROUND_STYLES[equipped.background] ?? null;
}

/**
 * Returns the driver skin image URL for an equipped skin cosmetic, or null.
 *
 * Pass `currentDriverId` (e.g. 'accuser', 'frostbyte') — driver-specific skins
 * are only rendered when the active character matches the skin's required driver.
 * Skins with no driver requirement (e.g. earnable legendaries) always render.
 */
export function getDriverSkinUrl(
  equipped: EquippedCosmetics | undefined,
  currentDriverId?: string,
): string | null {
  if (!equipped?.driverSkin || equipped.driverSkin === 'skin_default') return null;

  const url = SKIN_ASSET_URLS[equipped.driverSkin] ?? null;
  if (!url) return null;

  // Check driver restriction
  const requiredDriver = SKIN_DRIVER_REQUIREMENT[equipped.driverSkin];
  if (requiredDriver && currentDriverId !== requiredDriver) return null;

  return url;
}

/**
 * Returns the logo image URL for an equipped logo cosmetic, or null for default.
 * Displayed on the game-over winner card and MP lobby.
 */
export function getLogoUrl(
  equipped: EquippedCosmetics | undefined,
): string | null {
  if (!equipped?.logo || equipped.logo === 'logo_default') return null;
  const LOGO_URLS: Record<string, string> = {
    logo_redline:    '/cosmetics/logos/redline_crest.png',
    logo_circuit:    '/cosmetics/logos/circuit_breaker.png',
    ...LOGO_ASSET_URLS,
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
