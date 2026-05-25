-- Contact form submissions: stores messages sent by site visitors.
CREATE TABLE IF NOT EXISTS contact_submissions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name        text NOT NULL,
    email       text NOT NULL,
    message     text NOT NULL,
    ip          text,
    created_at  timestamptz NOT NULL DEFAULT now()
);
