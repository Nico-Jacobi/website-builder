-- Chat-Messages for the interactive editor.
-- Cascade-delete when the parent site is removed.

CREATE TABLE IF NOT EXISTS "site_messages" (
    "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "site_id"    uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "role"       text NOT NULL,
    "content"    text NOT NULL,
    "metadata"   jsonb,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "site_messages_site_id_idx"
    ON "site_messages" ("site_id", "created_at");
