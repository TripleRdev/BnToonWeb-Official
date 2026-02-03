import { useEffect, useRef } from "react";

const loadedHilltopSlots = new Set<string>();

interface HilltopAdProps {
  slotId: string;
  scriptSrc: string;
  className?: string;
  allowAdultAds?: boolean;
}

export function HilltopAd({
  slotId,
  scriptSrc,
  className = "",
  allowAdultAds = false,
}: HilltopAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!allowAdultAds) {
      return;
    }

    if (loadedHilltopSlots.has(slotId)) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    loadedHilltopSlots.add(slotId);
    container.innerHTML = "";

    const script = document.createElement("script");
    script.async = true;
    script.referrerPolicy = "no-referrer-when-downgrade";
    script.src = scriptSrc;

    container.appendChild(script);

    return () => {
      loadedHilltopSlots.delete(slotId);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [allowAdultAds, scriptSrc, slotId]);

  if (!allowAdultAds) {
    return null;
  }

  return <div ref={containerRef} className={className} data-ad-slot={slotId} />;
}
