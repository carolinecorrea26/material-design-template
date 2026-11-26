CREATE TABLE IF NOT EXISTS portal_catalog_revisions (
  revision text PRIMARY KEY,
  payload json NOT NULL
);

CREATE TABLE IF NOT EXISTS portal_template_drafts (
  id text PRIMARY KEY,
  base_revision text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'discarded', 'queued', 'publishing', 'failed', 'published')),
  changes jsonb NOT NULL,
  reason text NOT NULL,
  updated_by text NOT NULL REFERENCES portal_users (id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  target_revision text,
  release_commit text,
  release_error text,
  reverts_id text REFERENCES portal_template_drafts (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS portal_template_single_release
  ON portal_template_drafts ((true)) WHERE status IN ('queued', 'publishing', 'failed');
