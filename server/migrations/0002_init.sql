
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_user_name
        CHECK (length(trim(name)) BETWEEN 1 AND 100),

    CONSTRAINT chk_user_email
        CHECK (length(trim(email)) BETWEEN 3 AND 255),

    CONSTRAINT chk_user_password
        CHECK (length(password_hash) > 0),

    CONSTRAINT uq_user_email
        UNIQUE (email)
);

ALTER TABLE homes ADD COLUMN user_id INTEGER
    REFERENCES users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX idx_homes_user_id
    ON homes(user_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_homes_user_id_id
    ON homes(user_id, id)
    WHERE user_id IS NOT NULL;
