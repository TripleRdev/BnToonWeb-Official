import { useEffect, useRef, useState } from "react";

/**
 * Singleton registry to track loaded ad units and prevent duplicates
 */
const adRegistry = new Map<string, boolean>();
const loadedScripts = new Set<string>();
let adLoadQueue: Promise<void> = Promise.resolve();

const enqueueAdLoad = (load: () => Promise<void>) => {
  adLoadQueue = adLoadQueue.then(load).catch(() => undefined);
  return adLoadQueue;
};

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
  /** Ad format (iframe or native) */
  format?: "iframe" | "native";
  /** Adsterra base URL */
  baseUrl?: string;
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
  format = "iframe",
  baseUrl = "https://openairtowhardworking.com",
}: AdUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adBlocked, setAdBlocked] = useState(false);

  // Stable container ID based on placement (native uses provider-required container id)
  const containerId =
    format === "native" ? `container-${adKey}` : `adsterra-${placementId}`;
  const registryKey = `adsterra-${placementId}`;

  useEffect(() => {
    setAdBlocked(false);

    // Check if this placement already loaded
    if (adRegistry.has(registryKey)) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Mark as loading
    adRegistry.set(registryKey, true);

    // Clear any existing content
    container.innerHTML = "";

    // Create unique namespace for this ad's options
    const optionsVarName = `atOptions_${placementId.replace(/-/g, "_")}`;
    const adOptions =
      format === "iframe"
        ? {
            key: adKey,
            format: "iframe",
            height,
            width,
            params: {},
          }
        : null;

    if (adOptions) {
      (window as typeof window & { [key: string]: unknown })[optionsVarName] =
        adOptions;
    }

    // Invoke script (Adsterra domain)
    const invokeScript = document.createElement("script");
    const scriptUrl = `${baseUrl}/${adKey}/invoke.js`;
    invokeScript.src = scriptUrl;
    invokeScript.async = true;
    invokeScript.setAttribute("data-cfasync", "false");

    // Error handling for ad blockers
    let resolved = false;
    let resolveLoad: (() => void) | null = null;
    const finalize = () => {
      if (resolved) return;
      resolved = true;
      if (invokeScript.parentNode) {
        invokeScript.parentNode.removeChild(invokeScript);
      }
    };

    // Timeout fallback for silent blocks
    const timeout = setTimeout(() => {
      if (container.children.length <= 2) {
        // Only our scripts, no ad iframe
        setAdBlocked(true);
        adRegistry.delete(registryKey);
        container.innerHTML = "";
        resolveLoad?.();
        void finalize();
      }
    }, 5000);

    void enqueueAdLoad(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
          if (!containerRef.current) {
            resolve();
            return;
          }

          invokeScript.onload = () => {
            resolve();
            void finalize();
          };
          invokeScript.onerror = () => {
            setAdBlocked(true);
            adRegistry.delete(registryKey);
            resolve();
            void finalize();
          };

          if (adOptions) {
            window.atOptions = adOptions;
          }
          container.appendChild(invokeScript);
        })
    );

    return () => {
      clearTimeout(timeout);
      adRegistry.delete(registryKey);
    };
  }, [
    adKey,
    width,
    height,
    containerId,
    registryKey,
    placementId,
    format,
    baseUrl,
  ]);

  return (
    <div
      id={containerId}
      ref={containerRef}
      className={`flex justify-center items-center ${className} ${
        adBlocked ? "hidden" : ""
      }`}
      style={adBlocked ? undefined : { minHeight: height, minWidth: width }}
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
