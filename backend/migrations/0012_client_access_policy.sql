-- Automated Access app creation. access_aud already existed for the manual
-- flow (paste the AUD from an app you created by hand); access_app_id and
-- access_policy_id are new. access_aud is what the Worker uses to verify a
-- JWT (unchanged); access_app_id and access_policy_id are Cloudflare's own
-- identifiers for the application and its one policy, needed to update
-- that same policy later rather than creating a duplicate one every time
-- staff change.
ALTER TABLE clients ADD COLUMN access_app_id TEXT;
ALTER TABLE clients ADD COLUMN access_policy_id TEXT;
