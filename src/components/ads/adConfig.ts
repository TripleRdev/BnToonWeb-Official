/**
 * Ad configuration - centralized Adsterra ad unit settings
 *
 * ALLOWED AD TYPES:
 * - Banner ads ✓
 * - Sidebar ads ✓
 * - Footer ads ✓
 *
 * FORBIDDEN:
 * - Pop-under/pop-up ads ✗
 * - Click-redirect ads ✗
 * - Full-page takeover ads ✗
 * - Ads between chapter images ✗
 */

import { BANNER_320X50, BANNER_728X90, NATIVE_300X250 } from "./units";

export const AD_UNITS = {
  // 320x50 mobile banner
  mobileBanner: BANNER_320X50,

  // 728x90 leaderboard (desktop)
  leaderboard: BANNER_728X90,

  // Native sidebar banner
  sidebar: NATIVE_300X250,
} as const;

/**
 * Pages where ads are FORBIDDEN (reader must be distraction-free)
 */
export const AD_FORBIDDEN_PATHS = ["/read/", "/admin"] as const;

/**
 * Check if ads are allowed on current path
 */
export function isAdAllowed(pathname: string): boolean {
  return !AD_FORBIDDEN_PATHS.some((path) => pathname.startsWith(path));
}
