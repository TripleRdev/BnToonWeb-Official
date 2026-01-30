
# Migration Plan: Supabase to NeonDB + Bunny.net

This plan outlines how to migrate your BnToon Comics project from Lovable Cloud (Supabase) to NeonDB for the database and Bunny.net for file storage.

## Overview

We're replacing three core services:
- **Database**: Supabase PostgreSQL -> NeonDB (serverless PostgreSQL)
- **File Storage**: Supabase Storage -> Bunny.net CDN Storage
- **Authentication**: Supabase Auth -> Custom JWT-based admin auth

---

## Phase 1: Add Required Secrets

Before any code changes, you'll need to provide your API keys:

**NeonDB Secrets:**
- `NEON_DATABASE_URL` - Your NeonDB connection string (format: `postgresql://user:password@hostname/database?sslmode=require`)

**Bunny.net Secrets:**
- `BUNNY_STORAGE_ZONE` - Your storage zone name
- `BUNNY_STORAGE_API_KEY` - Your storage zone password/API key  
- `BUNNY_CDN_HOSTNAME` - Your CDN pull zone hostname (e.g., `your-zone.b-cdn.net`)

**Admin Auth Secret:**
- `ADMIN_JWT_SECRET` - A secure random string for signing JWT tokens

---

## Phase 2: Create Edge Functions for Backend Operations

Since we can no longer use the Supabase client directly, we need edge functions to handle:

### 2.1 Database Operations Edge Function (`db`)

Creates a centralized database client using `@neondatabase/serverless`:

```text
supabase/functions/db/index.ts
```

Operations:
- Query series, chapters, genres, views
- Insert/update/delete records
- Execute search functions
- Handle popular series calculations

### 2.2 File Upload Edge Function (`upload`)

Handles file uploads to Bunny.net Storage:

```text
supabase/functions/upload/index.ts
```

Operations:
- Upload covers to `covers/` path
- Upload banners to `banners/` path
- Upload chapter images to `chapters/{series_id}/`
- Upload chapter PDFs
- Delete files when content is removed

### 2.3 Auth Edge Function (`auth`)

Custom JWT-based admin authentication:

```text
supabase/functions/auth/index.ts
```

Operations:
- Admin login (validate email against allowed list)
- Token generation with JWT
- Token verification middleware

---

## Phase 3: Create Database Client Library

Replace the Supabase client with a new API client:

### 3.1 New Database Client

```text
src/lib/db.ts
```

This module will:
- Call the `db` edge function for all database operations
- Provide typed interfaces matching current data structures
- Handle authentication headers for admin operations

### 3.2 New Storage Client

```text
src/lib/storage.ts
```

This module will:
- Call the `upload` edge function for file uploads
- Generate public CDN URLs for stored files
- Handle file deletion

---

## Phase 4: Update Hooks (13 files)

Each hook needs to be updated to use the new API client:

| Hook File | Changes |
|-----------|---------|
| `useAuth.ts` | Replace Supabase Auth with custom JWT auth |
| `useSeries.ts` | Replace supabase client with db API calls |
| `useBrowseSeries.ts` | Replace supabase client with db API calls |
| `useSeriesWithLatestChapters.ts` | Replace supabase client with db API calls |
| `useGenres.ts` | Replace supabase client with db API calls |
| `useViews.ts` | Replace supabase client with db API calls |
| `usePopularSeriesWithGenres.ts` | Replace supabase client with db API calls |
| `useSearch.ts` | Replace supabase client with db API calls |
| `usePaginatedSeries.ts` | Replace supabase client with db API calls |

---

## Phase 5: Update Admin Pages (5 files)

Update file upload logic to use Bunny.net:

| Page | Changes |
|------|---------|
| `seriesform.tsx` | Replace storage upload with Bunny.net API |
| `chaptermanager.tsx` | Replace storage upload with Bunny.net API |
| `login.tsx` | Use new custom auth edge function |
| `dashboard.tsx` | Minor auth updates |
| `genremanager.tsx` | Use new db API |

---

## Phase 6: Create NeonDB Schema

You'll need to create these tables in your NeonDB database:

```sql
-- series table
CREATE TABLE series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  alternative_titles TEXT[] DEFAULT '{}',
  description TEXT,
  cover_url TEXT,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'ongoing',
  type TEXT NOT NULL DEFAULT 'manhwa',
  rating NUMERIC,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  total_views BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- chapters table
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  chapter_number NUMERIC NOT NULL,
  title TEXT,
  chapter_type TEXT NOT NULL DEFAULT 'images',
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- chapter_pages table
CREATE TABLE chapter_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- genres table
CREATE TABLE genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- series_genres junction table
CREATE TABLE series_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- chapter_views table
CREATE TABLE chapter_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL,
  series_id UUID NOT NULL,
  viewer_hash TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- admin_users table (for custom auth)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Phase 7: Remove Supabase Integration Files

Clean up files that will no longer be used:

- Keep the `supabase/` folder but only for edge functions
- The Supabase client file will be replaced with our custom clients

---

## File Changes Summary

| Category | Files to Create | Files to Modify |
|----------|-----------------|-----------------|
| Edge Functions | 3 new files | - |
| Library | 2 new files | - |
| Hooks | - | 9 files |
| Pages | - | 5 admin pages + 4 public pages |
| Total | 5 new files | ~18 modified files |

---

## Technical Details

### Edge Function: Database Operations

The `db` edge function will use `@neondatabase/serverless` which works in Deno:

```typescript
import { neon } from "npm:@neondatabase/serverless";

const sql = neon(Deno.env.get("NEON_DATABASE_URL")!);

// Execute queries
const results = await sql`SELECT * FROM series ORDER BY updated_at DESC`;
```

### Edge Function: Bunny.net Upload

Files are uploaded via HTTP PUT to Bunny.net Storage:

```typescript
const response = await fetch(
  `https://${region}.storage.bunnycdn.com/${storageZone}/${path}`,
  {
    method: "PUT",
    headers: {
      "AccessKey": Deno.env.get("BUNNY_STORAGE_API_KEY"),
      "Content-Type": contentType,
    },
    body: fileBuffer,
  }
);

// Public URL
const cdnUrl = `https://${cdnHostname}/${path}`;
```

### Custom Admin Auth

Admin authentication will use JWT tokens stored in localStorage:

1. Admin logs in with email/password
2. Edge function validates credentials against `admin_users` table
3. JWT token returned and stored
4. Token included in headers for admin API calls

---

## Important Notes

1. **Fresh Start**: Since you chose fresh start, no data migration is needed
2. **CDN Setup**: Make sure your Bunny.net pull zone is connected to your storage zone
3. **CORS**: All edge functions will include proper CORS headers
4. **Security**: Admin endpoints will verify JWT tokens server-side
5. **No RLS**: NeonDB doesn't have RLS, so security is enforced in edge functions

---

## Implementation Order

1. Add all required secrets via the Lovable UI
2. Create the 3 edge functions
3. Create the new client libraries
4. Update hooks one by one (test as you go)
5. Update admin pages with new upload logic
6. Run the SQL schema in NeonDB dashboard
7. Test complete flow end-to-end
