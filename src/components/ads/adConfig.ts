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

export const AD_UNITS = {
  // 320x50 mobile banner
  mobileBanner: {
    adKey: "60b102fe0a6bd36b3aa4e1cf27080918",
    width: 320,
    height: 50,
  },
  
  // 728x90 leaderboard (desktop)
  leaderboard: {
    adKey: "55df5565f644bb1aefe96eefc0393e90",
    width: 728,
    height: 90,
  },
  
  // Native sidebar banner
  sidebar: {
    adKey: "c35c6f6f42ee902bbfca715ccd1d497f",
    width: 300,
    height: 250,
    usesContainerId: true,
  },
} as const;

/**
 * Pages where ads are FORBIDDEN (reader must be distraction-free)
 */
export const AD_FORBIDDEN_PATHS = [
  "/read/",
  "/admin",
] as const;

/**
 * Check if ads are allowed on current path
 */
export function isAdAllowed(pathname: string): boolean {
  return !AD_FORBIDDEN_PATHS.some(path => pathname.startsWith(path));
}
