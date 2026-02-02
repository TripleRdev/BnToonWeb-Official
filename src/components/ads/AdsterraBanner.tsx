import { useEffect, useRef } from "react";

interface AdsterraBannerProps {
  adKey: string;
  width: number;
  height: number;
  className?: string;
}

export function AdsterraBanner({
  adKey,
  width,
  height,
  className = "",
}: AdsterraBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // clear container on re-mount
    containerRef.current.innerHTML = "";

    // create inline config script (SCOPED)
    const configScript = document.createElement("script");
    configScript.type = "text/javascript";
    configScript.innerHTML = `
      atOptions = {
        'key': '${adKey}',
        'format': 'iframe',
        'height': ${height},
        'width': ${width},
        'params': {}
      };
    `;

    // invoke script
    const invokeScript = document.createElement("script");
    invokeScript.src = `https://openairtowhardworking.com/${adKey}/invoke.js`;
    invokeScript.async = true;
    invokeScript.setAttribute("data-cfasync", "false");

    containerRef.current.appendChild(configScript);
    containerRef.current.appendChild(invokeScript);
  }, [adKey, width, height]);

  return (
    <div
      ref={containerRef}
      className={`flex justify-center ${className}`}
      style={{ minHeight: height }}
    />
  );
}
