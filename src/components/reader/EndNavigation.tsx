import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  chapter_number: number;
  title: string | null;
  series_id?: string;
}

interface EndNavigationProps {
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
  seriesId?: string;
}

export function EndNavigation({ prevChapter, nextChapter, seriesId }: EndNavigationProps) {
  const navigate = useNavigate();

  return (
    <nav 
      className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12"
      aria-label="Chapter navigation"
    >
      {/* Main navigation buttons - stacked on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
        <button
          disabled={!prevChapter}
          onClick={() => prevChapter && navigate(`/read/${prevChapter.id}`)}
          className={cn(
            "flex items-center justify-center gap-2 px-5 py-3.5 sm:py-3 text-sm font-medium rounded-lg transition-colors",
            "min-h-[48px] sm:min-h-[44px]",
            "bg-muted/30 text-muted-foreground",
            "hover:bg-muted/50 hover:text-foreground active:bg-muted/70",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-muted/30 disabled:hover:text-muted-foreground"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous Chapter</span>
        </button>

        <button
          disabled={!nextChapter}
          onClick={() => nextChapter && navigate(`/read/${nextChapter.id}`)}
          className={cn(
            "flex items-center justify-center gap-2 px-5 py-3.5 sm:py-3 text-sm font-medium rounded-lg transition-colors",
            "min-h-[48px] sm:min-h-[44px]",
            "bg-primary/90 text-primary-foreground",
            "hover:bg-primary active:bg-primary/80",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-muted/30 disabled:text-muted-foreground disabled:hover:bg-muted/30"
          )}
        >
          <span>Next Chapter</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Back to series link */}
      {seriesId && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate(`/series/${seriesId}`)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm rounded-md transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-muted/40 active:bg-muted/60"
            )}
          >
            <BookOpen className="h-4 w-4" />
            <span>Back to Series</span>
          </button>
        </div>
      )}
    </nav>
  );
}
