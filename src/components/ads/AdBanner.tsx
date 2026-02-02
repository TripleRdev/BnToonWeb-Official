import { useEffect, useRef } from "react";

interface AdBannerProps {
  className?: string;
}

/**
 * Adsterra Banner (320x50)
 * SPA-safe, isolated, non-blocking
 */
export function AdBanner({ className = "" }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    // create local options script (NO global pollution)
    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key' : '60b102fe0a6bd36b3aa4e1cf27080918',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement("script");
    invokeScript.src =
      "https://openairtowhardworking.com/60b102fe0a6bd36b3aa4e1cf27080918/invoke.js";
    invokeScript.async = true;
    invokeScript.setAttribute("data-cfasync", "false");

    container.appendChild(optionsScript);
    container.appendChild(invokeScript);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full flex justify-center items-center min-h-[50px] ${className}`}
      aria-label="Advertisement"
      role="complementary"
    />
  );
}
