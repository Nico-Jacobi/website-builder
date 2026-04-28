-- Multi-page generation: add chrome + sitemap to sites, status to pages.
ALTER TABLE sites ADD COLUMN IF NOT EXISTS chrome jsonb NULL;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS sitemap jsonb NULL;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
