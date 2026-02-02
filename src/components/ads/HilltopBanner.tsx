import { useEffect, useRef } from "react";

interface HilltopBannerProps {
  className?: string;
}

export function HilltopBanner({ className = "" }: HilltopBannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!ref.current || loaded.current) return;
    loaded.current = true;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.referrerPolicy = "no-referrer-when-downgrade";
    script.src =
      "//impossibledisease.com/b.X/V/s_dsGvl-0JYDW/cj/femmA9auHZzUiltkuPqTlYU3oNAjSMGypM/DUAGtQNkjNcr2/Mnz/Ilw/M/QK";

    ref.current.appendChild(script);

    return () => {
      if (ref.current?.contains(script)) {
        ref.current.removeChild(script);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`w-full flex justify-center items-center min-h-[90px] ${className}`}
      aria-label="Advertisement"
    />
  );
}
