import { memo, useEffect, useMemo, useRef, useState } from "react";

interface YllixAdProps {
  width: number;
  height: number;
  zoneId: string;
  scriptSrc: string;
  className?: string;
  placementId: string;
  lazy?: boolean;
  rootMargin?: string;
}

const YllixAd = memo(function YllixAd({
  width,
  height,
  zoneId,
  scriptSrc,
  className = "",
  placementId,
  lazy = false,
  rootMargin = "200px",
}: YllixAdProps) {
  const isConfigured = Boolean(scriptSrc && zoneId);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInjectedRef = useRef(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);

  const scriptKey = useMemo(() => {
    return `${scriptSrc}::${zoneId}`;
  }, [scriptSrc, zoneId]);

  useEffect(() => {
    if (!lazy || !isConfigured) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isConfigured, lazy, rootMargin]);

  useEffect(() => {
    if (!shouldLoad || !isConfigured) return;
    if (hasInjectedRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-ylx-script="${scriptKey}"]`
    );
    if (existingScript) {
      hasInjectedRef.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.dataset.ylxScript = scriptKey;
    script.dataset.ylxZone = zoneId;
    script.dataset.ylxWidth = String(width);
    script.dataset.ylxHeight = String(height);
    container.appendChild(script);
    hasInjectedRef.current = true;
  }, [height, isConfigured, scriptKey, scriptSrc, shouldLoad, width, zoneId]);

  if (!isConfigured) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`flex justify-center items-center ${className}`}
      data-ad-placement={placementId}
    >
      <div
        aria-hidden="true"
        style={{ width, height }}
        data-ylx-zone={zoneId}
        data-ylx-width={width}
        data-ylx-height={height}
      />
    </div>
  );
});

export { YllixAd };
