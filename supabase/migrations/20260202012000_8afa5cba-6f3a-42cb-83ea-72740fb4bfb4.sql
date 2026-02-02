-- Move pg_trgm extension from public to extensions schema
-- First drop from public, then create in extensions schema

-- Drop extension from public schema
DROP EXTENSION IF EXISTS pg_trgm CASCADE;

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Install pg_trgm in extensions schema
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Recreate the index using the extension from extensions schema
CREATE INDEX IF NOT EXISTS idx_series_title_trgm ON public.series USING gin(title extensions.gin_trgm_ops);