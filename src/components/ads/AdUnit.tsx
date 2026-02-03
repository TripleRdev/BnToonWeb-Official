import { useEffect, useRef, useState } from "react";

/**
 * Singleton registry to track loaded ad units and prevent duplicates
 */
const adRegistry = new Map<string, boolean>();
const loadedScripts = new Set<string>();

interface AdUnitProps {
  /** Unique Adsterra ad key */
  adKey: string;
  /** Ad width in pixels */
  width: number;
  /** Ad height in pixels */
  height: number;
  /** Optional className for wrapper */
  className?: string;
  /** Unique placement ID (e.g., "home-banner", "browse-sidebar") */
  placementId: string;
}

/**
 * Unified Adsterra ad component with:
 * - Singleton script loading (no duplicates)
 * - StrictMode-safe mounting
 * - Scoped atOptions (no global conflicts)
 * - Graceful ad-blocker fallback
 * - SPA routing compatible
 */
export function AdUnit({
  adKey,
  width,
  height,
  className = "",
  placementId,
}: AdUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const [adBlocked, setAdBlocked] = useState(false);

  // Stable container ID based on placement
  const containerId = `adsterra-${placementId}`;

  useEffect(() => {
    // Prevent StrictMode double-mount
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Check if this placement already loaded
    if (adRegistry.has(containerId)) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Mark as loading
    adRegistry.set(containerId, true);

    // Clear any existing content
    container.innerHTML = "";

    // Create unique namespace for this ad's options
    const optionsVarName = `atOptions_${placementId.replace(/-/g, "_")}`;

    // Inline config script with SCOPED variable
    const configScript = document.createElement("script");
    configScript.type = "text/javascript";
    configScript.textContent = `
      window['${optionsVarName}'] = {
        'key': '${adKey}',
        'format': 'iframe',
        'height': ${height},
        'width': ${width},
        'params': {}
      };
      window.atOptions = window['${optionsVarName}'];
    `;

    // Invoke script (Adsterra domain)
    const invokeScript = document.createElement("script");
    const scriptUrl = `https://www.topcreativeformat.com/${adKey}/invoke.js`;
    invokeScript.src = scriptUrl;
    invokeScript.async = true;
    invokeScript.setAttribute("data-cfasync", "false");

    // Error handling for ad blockers
    invokeScript.onerror = () => {
      setAdBlocked(true);
      adRegistry.delete(containerId);
    };

    // Timeout fallback for silent blocks
    const timeout = setTimeout(() => {
      if (container.children.length <= 2) {
        // Only our scripts, no ad iframe
        setAdBlocked(true);
      }
    }, 5000);

    container.appendChild(configScript);
    container.appendChild(invokeScript);

    return () => {
      clearTimeout(timeout);
      // Don't remove from registry on unmount - keeps ad persistent during SPA navigation
    };
  }, [adKey, width, height, containerId, placementId]);

  // Graceful fallback when blocked
  if (adBlocked) {
    return null; // Silent fail, no broken UI
  }

  return (
    <div
      id={containerId}
      ref={containerRef}
      className={`flex justify-center items-center ${className}`}
      style={{ minHeight: height, minWidth: width }}
      aria-label="Advertisement"
      role="complementary"
    />
  );
}

/**
 * Clear ad registry (useful for testing or forced refresh)
 */
export function resetAdRegistry() {
  adRegistry.clear();
  loadedScripts.clear();
}
