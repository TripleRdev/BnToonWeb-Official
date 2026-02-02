import { Layout } from "@/components/layout/Layout";
import { BrowseCard } from "@/components/browse/BrowseCard";
import { useBrowseSeries } from "@/hooks/useBrowseSeries";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useGenres } from "@/hooks/useGenres";
import { useSeriesGenresMap } from "@/hooks/useSeriesGenresMap";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BackToTop } from "@/components/ui/back-to-top";
import { BookOpen, X, Filter, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { AdBanner } from "@/components/ads/AdBanner";

const Browse = () => {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useBrowseSeries();

  const { data: genres } = useGenres();
  const { data: seriesGenresMap } = useSeriesGenresMap();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const allSeries = useMemo(
    () => data?.pages.flatMap((p) => p.series) ?? [],
    [data]
  );

  const filteredSeries = useMemo(() => {
    if (!seriesGenresMap || selectedGenres.length === 0) return allSeries;
    return allSeries.filter((s) =>
      selectedGenres.every((g) => seriesGenresMap[s.id]?.includes(g))
    );
  }, [allSeries, selectedGenres, seriesGenresMap]);

  return (
    <Layout>
      <SEO title="Browse Comics" />
      <main className="container mx-auto px-4 py-8">

        {/* Top Banner */}
        <AdBanner className="mb-8" />

        {!genres ? null : (
          <div className="mb-8">
            <div className="flex gap-2 flex-wrap">
              {genres.map((g) => (
                <button
                  key={g.id}
                  onClick={() =>
                    setSelectedGenres((p) =>
                      p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id]
                    )
                  }
                  className="px-3 py-1 rounded bg-secondary"
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : filteredSeries.length ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredSeries.map((s) => (
                <BrowseCard key={s.id} {...s} />
              ))}
            </div>

            {/* Mid Banner */}
            <AdBanner className="my-10" />

            <div ref={loadMoreRef} className="mt-10 text-center">
              {isFetchingNextPage && <Loader2 className="animate-spin mx-auto" />}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="mx-auto h-12 w-12 opacity-40" />
            <p>No series found.</p>
          </div>
        )}
      </main>

      <BackToTop />
    </Layout>
  );
};

export default Browse;
