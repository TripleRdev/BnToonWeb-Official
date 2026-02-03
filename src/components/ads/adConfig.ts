 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/src/components/ads/adConfig.ts b/src/components/ads/adConfig.ts
index 1b7b8793756540a2433b91ce9a2edc7742b50d77..27678c3e50f43a9f3473cb710ab6f482e163925f 100644
--- a/src/components/ads/adConfig.ts
+++ b/src/components/ads/adConfig.ts
@@ -1,52 +1,39 @@
 /**
  * Ad configuration - centralized Adsterra ad unit settings
- * 
+ *
  * ALLOWED AD TYPES:
  * - Banner ads ✓
  * - Sidebar ads ✓
  * - Footer ads ✓
- * 
+ *
  * FORBIDDEN:
  * - Pop-under/pop-up ads ✗
  * - Click-redirect ads ✗
  * - Full-page takeover ads ✗
  * - Ads between chapter images ✗
  */
 
+import { BANNER_320X50, BANNER_728X90, NATIVE_300X250 } from "./units";
+
 export const AD_UNITS = {
   // 320x50 mobile banner
-  mobileBanner: {
-    adKey: "60b102fe0a6bd36b3aa4e1cf27080918",
-    width: 320,
-    height: 50,
-  },
-  
+  mobileBanner: BANNER_320X50,
+
   // 728x90 leaderboard (desktop)
-  leaderboard: {
-    adKey: "55df5565f644bb1aefe96eefc0393e90",
-    width: 728,
-    height: 90,
-  },
-  
+  leaderboard: BANNER_728X90,
+
   // Native sidebar banner
-  sidebar: {
-    adKey: "c35c6f6f42ee902bbfca715ccd1d497f",
-    width: 300,
-    height: 250,
-  },
+  sidebar: NATIVE_300X250,
 } as const;
 
 /**
  * Pages where ads are FORBIDDEN (reader must be distraction-free)
  */
-export const AD_FORBIDDEN_PATHS = [
-  "/read/",
-  "/admin",
-] as const;
+export const AD_FORBIDDEN_PATHS = ["/read/", "/admin"] as const;
 
 /**
  * Check if ads are allowed on current path
  */
 export function isAdAllowed(pathname: string): boolean {
-  return !AD_FORBIDDEN_PATHS.some(path => pathname.startsWith(path));
+  return !AD_FORBIDDEN_PATHS.some((path) => pathname.startsWith(path));
 }
 
EOF
)
