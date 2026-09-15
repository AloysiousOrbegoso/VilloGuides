-- Architecture section 8.1
CREATE TABLE clients (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  subdomain       TEXT UNIQUE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('company','individual')),
  logo_key        TEXT,
  brand_color     TEXT,
  custom_domain   TEXT,
  plan            TEXT NOT NULL DEFAULT 'standard' CHECK (plan IN ('standard','whitelabel')),
  dashboard_addon_paid INTEGER NOT NULL DEFAULT 0,
  access_aud      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
