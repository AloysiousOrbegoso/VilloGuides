-- Single-row table for studio-wide defaults (architecture 5.2 "Settings").
-- Not in architecture 8.1's original table list; added here because the studio
-- settings screen needs somewhere to persist template defaults and extra
-- reserved subdomains. id is always 1.
CREATE TABLE settings (
  id                  INTEGER PRIMARY KEY CHECK (id = 1),
  default_theme       TEXT NOT NULL DEFAULT 'daytime',
  notification_email  TEXT NOT NULL DEFAULT '',
  extra_reserved      TEXT NOT NULL DEFAULT '[]',
  intake_link_days    INTEGER NOT NULL DEFAULT 30
);

INSERT INTO settings (id) VALUES (1);
