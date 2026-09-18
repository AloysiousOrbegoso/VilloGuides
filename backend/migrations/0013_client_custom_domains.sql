-- White-label custom domains (architecture 11.3). custom_domain already
-- existed (added in the original migration, unused until now) and holds
-- the client's own bare domain, e.g. "acme-rentals.com". custom_domain_scope
-- decides what it covers: the dashboard (an exact match against
-- custom_domain), a client's guides (a wildcard *.custom_domain, one
-- Cloudflare custom hostname covering every property the client publishes,
-- since a guide's slug is just the label in front of it, the same way it
-- already is under {slug}.villoguides.com), or both. "Both" needs two
-- separate Cloudflare custom hostname registrations, an apex match for the
-- dashboard and a wildcard for guides, hence two id columns rather than one.
ALTER TABLE clients ADD COLUMN custom_domain_scope TEXT CHECK (custom_domain_scope IN ('dashboard', 'guides', 'both'));
ALTER TABLE clients ADD COLUMN custom_domain_dashboard_hostname_id TEXT;
ALTER TABLE clients ADD COLUMN custom_domain_guides_hostname_id TEXT;
