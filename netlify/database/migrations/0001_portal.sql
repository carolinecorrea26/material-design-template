CREATE TABLE IF NOT EXISTS portal_catalog (
  id integer PRIMARY KEY CHECK (id = 1),
  revision text NOT NULL,
  payload json NOT NULL
);

CREATE TABLE IF NOT EXISTS portal_sites (
  site_key text PRIMARY KEY,
  identity jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  migration_stage text,
  migration_status text NOT NULL
);

CREATE TABLE IF NOT EXISTS portal_users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  role_key text NOT NULL CHECK (role_key IN ('portal-admin', 'account-manager')),
  password_hash text NOT NULL
);

CREATE TABLE IF NOT EXISTS portal_user_sites (
  user_id text REFERENCES portal_users (id) ON DELETE CASCADE,
  site_key text REFERENCES portal_sites (site_key),
  PRIMARY KEY (user_id, site_key)
);

CREATE TABLE IF NOT EXISTS portal_sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES portal_users (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS portal_site_drafts (
  id text PRIMARY KEY,
  site_key text NOT NULL REFERENCES portal_sites (site_key),
  base_revision text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  form_template text CHECK (form_template IN ('single', 'multi')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_key, base_revision)
);

CREATE TABLE IF NOT EXISTS portal_applicant_workflow (
  site_key text PRIMARY KEY REFERENCES portal_sites (site_key),
  state jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS portal_applications (
  id text PRIMARY KEY,
  site_key text NOT NULL REFERENCES portal_sites (site_key),
  catalog_revision text NOT NULL,
  submitted_at timestamptz NOT NULL,
  record jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS portal_application_events (
  id text PRIMARY KEY,
  application_id text NOT NULL REFERENCES portal_applications (id),
  event jsonb NOT NULL
);
