import { useEffect, useRef } from "react";

interface SidebarAdProps {
  containerId: string;
  scriptUrl: string;
  className?: string;
}

/**
 * Sidebar native/display ad
 * ONE container = ONE ad
 */
export function SidebarAd({
  containerId,
  scriptUrl,
  className = "",
}: SidebarAdProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.setAttribute("data-cfasync", "false");

    ref.current.appendChild(script);
  }, [scriptUrl]);

  return (
    <div
      id={containerId}
      ref={ref}
      className={`rounded-lg overflow-hidden ${className}`}
      aria-label="Advertisement"
      role="complementary"
    />
  );
}
