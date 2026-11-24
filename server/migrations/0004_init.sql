ALTER TABLE members ADD COLUMN email TEXT;

CREATE INDEX idx_members_email
ON members(email);