import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useChapter, useChapters, useSeries } from "@/hooks/useSeries";
import { useRecordView } from "@/hooks/useViews";
import { MinimalHeader } from "@/components/reader/MinimalHeader";
import { MinimalImageReader } from "@/components/reader/MinimalImageReader";
import { MinimalPDFReader } from "@/components/reader/MinimalPDFReader";
import { EndNavigation } from "@/components/reader/EndNavigation";
import { SEO, generateChapterDescription } from "@/components/SEO";
import { Home } from "lucide-react";

const Reader = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { data, isLoading, error } = useChapter(chapterId || "");
  const { data: series } = useSeries(data?.chapter.series_id || "");
  const { data: chapters } = useChapters(data?.chapter.series_id || "");
  const recordView = useRecordView();

  // Record view when chapter loads
  useEffect(() => {
    if (data?.chapter && chapterId) {
      recordView.mutate({
        chapterId,
        seriesId: data.chapter.series_id,
      });
    }
  }, [chapterId, data?.chapter?.series_id]);

  // Scroll to top on chapter change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [chapterId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <>
        <SEO title="Chapter not found" noindex />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-lg font-medium mb-4 text-foreground">
              Chapter not found
            </h1>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  const { chapter, pages } = data;

  // Find previous and next chapters
  const sortedChapters =
    chapters?.sort((a, b) => a.chapter_number - b.chapter_number) || [];
  const currentIndex = sortedChapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < sortedChapters.length - 1
      ? sortedChapters[currentIndex + 1]
      : null;

  // Generate SEO content
  const seoTitle = series
    ? `${series.title} Chapter ${chapter.chapter_number}${chapter.title ? ` - ${chapter.title}` : ""}`
    : `Chapter ${chapter.chapter_number}`;
  
  const seoDescription = series
    ? generateChapterDescription(series.title, chapter.chapter_number, chapter.title || undefined)
    : `Read Chapter ${chapter.chapter_number} online.`;

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={series?.cover_url || undefined}
        type="article"
      />

      <article className="min-h-screen bg-background">
        {/* Minimal Header */}
        {chapters && chapters.length > 0 && (
          <MinimalHeader
            seriesId={chapter.series_id}
            seriesTitle={series?.title}
            currentChapter={chapter}
            chapters={chapters}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
          />
        )}

        {/* Spacer for fixed header */}
        <div className="h-12" aria-hidden="true" />

        {/* Reading Area */}
        <main className="py-4">
          <header className="sr-only">
            <h1>{seoTitle}</h1>
          </header>
          
          {chapter.chapter_type === "pdf" && chapter.pdf_url ? (
            <MinimalPDFReader pdfUrl={chapter.pdf_url} />
          ) : (
            <MinimalImageReader pages={pages} />
          )}
        </main>

        {/* End Navigation */}
        <EndNavigation 
          prevChapter={prevChapter} 
          nextChapter={nextChapter} 
          seriesId={chapter.series_id}
        />
      </article>
    </>
  );
};

export default Reader;
