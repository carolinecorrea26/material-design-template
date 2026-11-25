CREATE TABLE IF NOT EXISTS portal_tpas (
  id text PRIMARY KEY,
  tpa_key text NOT NULL UNIQUE,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS portal_associations (
  id text PRIMARY KEY,
  association_key text NOT NULL UNIQUE,
  tpa_id text NOT NULL REFERENCES portal_tpas (id),
  name text NOT NULL
);

CREATE INDEX IF NOT EXISTS portal_associations_tpa_id_idx ON portal_associations (tpa_id);

ALTER TABLE portal_sites ADD COLUMN IF NOT EXISTS hosting_association_id text REFERENCES portal_associations (id);
CREATE INDEX IF NOT EXISTS portal_sites_hosting_association_id_idx ON portal_sites (hosting_association_id);
