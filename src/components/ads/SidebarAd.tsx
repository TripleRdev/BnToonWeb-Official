import { useEffect, useRef } from "react";

interface SidebarAdProps {
  /** Container ID required by ad network */
  containerId: string;
  /** Script URL from ad network */
  scriptUrl: string;
  /** Optional additional className */
  className?: string;
}

/**
 * Sidebar Native / Display Ad
 * Safe ONLY for sidebar placements
 * NEVER use inside reader pages
 */
export function SidebarAd({
  containerId,
  scriptUrl,
  className = "",
}: SidebarAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || loadedRef.current) return;

    loadedRef.current = true;

    // Prevent duplicate script injection
    if (document.querySelector(`script[src="${scriptUrl}"]`)) return;

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.setAttribute("data-cfasync", "false");

    container.appendChild(script);

    return () => {
      if (container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, [scriptUrl]);

  return (
    <div
      ref={containerRef}
      id={containerId}
      className={`ad-sidebar flex justify-center items-center min-h-[250px] ${className}`}
      aria-label="Advertisement"
      role="complementary"
    />
  );
}
