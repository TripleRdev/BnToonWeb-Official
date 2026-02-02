-- ============================================
-- DATABASE PERFORMANCE OPTIMIZATION INDEXES
-- ============================================

-- Enable pg_trgm extension for fuzzy text search FIRST
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. SERIES TABLE INDEXES
-- Index for ordering by updated_at (used in most queries)
CREATE INDEX IF NOT EXISTS idx_series_updated_at ON public.series(updated_at DESC);

-- Index for featured series filtering
CREATE INDEX IF NOT EXISTS idx_series_is_featured ON public.series(is_featured) WHERE is_featured = true;

-- Index for filtering by status and type
CREATE INDEX IF NOT EXISTS idx_series_status ON public.series(status);
CREATE INDEX IF NOT EXISTS idx_series_type ON public.series(type);

-- Composite index for browse queries (status + type + updated_at)
CREATE INDEX IF NOT EXISTS idx_series_browse ON public.series(status, type, updated_at DESC);

-- Index for total_views ordering (popular series)
CREATE INDEX IF NOT EXISTS idx_series_total_views ON public.series(total_views DESC);

-- Full-text search index on title for faster searching
CREATE INDEX IF NOT EXISTS idx_series_title_trgm ON public.series USING gin(title gin_trgm_ops);

-- 2. CHAPTERS TABLE INDEXES
-- Index for fast chapter lookup by series_id (most common query)
CREATE INDEX IF NOT EXISTS idx_chapters_series_id ON public.chapters(series_id);

-- Composite index for ordered chapter listing
CREATE INDEX IF NOT EXISTS idx_chapters_series_order ON public.chapters(series_id, chapter_number DESC);

-- Index for getting latest chapters
CREATE INDEX IF NOT EXISTS idx_chapters_created_at ON public.chapters(created_at DESC);

-- 3. CHAPTER_PAGES TABLE INDEXES
-- Index for fast page lookup by chapter_id
CREATE INDEX IF NOT EXISTS idx_chapter_pages_chapter_id ON public.chapter_pages(chapter_id);

-- Composite index for ordered page listing
CREATE INDEX IF NOT EXISTS idx_chapter_pages_order ON public.chapter_pages(chapter_id, page_number ASC);

-- 4. CHAPTER_VIEWS TABLE INDEXES
-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_chapter_views_viewer_hash ON public.chapter_views(viewer_hash, viewed_at DESC);

-- Index for period-based view counting
CREATE INDEX IF NOT EXISTS idx_chapter_views_series_time ON public.chapter_views(series_id, viewed_at DESC);

-- Index for deduplication check
CREATE INDEX IF NOT EXISTS idx_chapter_views_dedup ON public.chapter_views(chapter_id, viewer_hash, viewed_at DESC);

-- 5. SERIES_GENRES TABLE INDEXES
-- Index for genre filtering
CREATE INDEX IF NOT EXISTS idx_series_genres_genre_id ON public.series_genres(genre_id);

-- Index for getting genres by series
CREATE INDEX IF NOT EXISTS idx_series_genres_series_id ON public.series_genres(series_id);

-- 6. GENRES TABLE INDEX
-- Index for ordering genres by name
CREATE INDEX IF NOT EXISTS idx_genres_name ON public.genres(name);