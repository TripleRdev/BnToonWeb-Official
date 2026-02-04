import { useEffect, useRef } from "react";

interface Data527AdProps {
  width: number;
  height: number;
  dataClass: string;
  dataDomain: string;
  dataAffQuery: string;
  className?: string;
  placementId: string;
}

const SCRIPT_SRC = "//data527.click/js/responsive.js";

export function Data527Ad({
  width,
  height,
  dataClass,
  dataDomain,
  dataAffQuery,
  className = "",
  placementId,
}: Data527AdProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const adElement = adRef.current;
    if (!adElement) return;

    const existingScript = adElement.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    adElement.appendChild(script);
  }, []);

  return (
    <div className={`flex justify-center items-center ${className}`} data-ad-placement={placementId}>
      <ins
        ref={adRef}
        style={{ width, height }}
        data-width={width}
        data-height={height}
        className={dataClass}
        data-domain={dataDomain}
        data-affquery={dataAffQuery}
      />
    </div>
  );
}
