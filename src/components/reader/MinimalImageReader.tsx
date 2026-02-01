import { useState, useRef, useEffect, useCallback, memo } from "react";
import { cn } from "@/lib/utils";

interface Page {
  id: string;
  page_number: number;
  image_url: string;
}

interface MinimalImageReaderProps {
  pages: Page[];
}

// Optimal preload settings for performance
const PRELOAD_AHEAD = 2; // Reduced from 3 to avoid over-fetching
const PRELOAD_BEHIND = 1; // Keep 1 behind for back navigation
const ROOT_MARGIN = "400px 0px"; // Reduced from 600px

// Individual page component with optimized lazy loading
const ReaderPage = memo(function ReaderPage({
  page,
  isPreloaded,
  onBecomeVisible,
  priority,
}: {
  page: Page;
  isPreloaded: boolean;
  onBecomeVisible: (pageNumber: number) => void;
  priority?: "high" | "low" | "auto";
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(isPreloaded);
  const [hasError, setHasError] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            onBecomeVisible(page.page_number);
            observer.disconnect();
          }
        });
      },
      { rootMargin: ROOT_MARGIN, threshold: 0 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isInView, page.page_number, onBecomeVisible]);

  // Preload when isPreloaded changes
  useEffect(() => {
    if (isPreloaded && !isInView) {
      setIsInView(true);
    }
  }, [isPreloaded, isInView]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // Calculate padding-bottom for aspect ratio to prevent CLS
  const paddingBottom = dimensions
    ? `${(dimensions.height / dimensions.width) * 100}%`
    : "150%"; // Default 2:3 aspect ratio

  return (
    <div
      ref={containerRef}
      className="w-full relative bg-muted/10"
      style={{
        // Use padding-bottom trick for stable aspect ratio before image loads
        paddingBottom: isLoaded ? undefined : paddingBottom,
        height: isLoaded ? "auto" : 0,
      }}
    >
      {/* Minimal loading placeholder - no heavy animations */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-5 h-5 border-2 border-muted-foreground/20 border-t-muted-foreground/50 rounded-full animate-spin"
            style={{ animationDuration: "0.8s" }}
          />
        </div>
      )}

      {/* Actual image with optimal attributes */}
      {isInView && !hasError && (
        <img
          src={page.image_url}
          alt={`Page ${page.page_number}`}
          className={cn(
            "w-full h-auto block",
            isLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority === "high" ? "eager" : "lazy"}
          decoding="async"
          // Add fetchpriority for first few images
          {...(priority === "high" && { fetchPriority: "high" as const })}
          // Responsive sizing hints
          sizes="(max-width: 768px) 100vw, 768px"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-muted/20"
          style={{ paddingBottom: "150%" }}
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Failed to load</p>
            <button
              onClick={() => {
                setHasError(false);
                setIsLoaded(false);
              }}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export function MinimalImageReader({ pages }: MinimalImageReaderProps) {
  const [visiblePage, setVisiblePage] = useState(1);
  const sortedPages = [...pages].sort((a, b) => a.page_number - b.page_number);

  const handleBecomeVisible = useCallback((pageNumber: number) => {
    setVisiblePage(pageNumber);
  }, []);

  // Determine which pages should be preloaded
  const getPreloadState = useCallback((pageNumber: number) => {
    // First 2 pages are always high priority
    if (pageNumber <= 2) return { preloaded: true, priority: "high" as const };
    
    // Pages around current visible page
    if (pageNumber >= visiblePage - PRELOAD_BEHIND && 
        pageNumber <= visiblePage + PRELOAD_AHEAD) {
      return { preloaded: true, priority: "auto" as const };
    }
    
    return { preloaded: false, priority: "low" as const };
  }, [visiblePage]);

  return (
    <div 
      className="w-full max-w-3xl mx-auto px-0 sm:px-4"
      role="img"
      aria-label={`Chapter pages, ${sortedPages.length} total`}
    >
      {sortedPages.map((page, index) => {
        const { preloaded, priority } = getPreloadState(page.page_number);
        return (
          <div 
            key={page.id} 
            className={index < sortedPages.length - 1 ? "mb-1 sm:mb-2" : ""}
          >
            <ReaderPage
              page={page}
              isPreloaded={preloaded}
              onBecomeVisible={handleBecomeVisible}
              priority={priority}
            />
          </div>
        );
      })}
    </div>
  );
}
