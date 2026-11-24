
PRAGMA foreign_keys = ON;

CREATE TABLE homes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_home_name
        CHECK (length(trim(name)) BETWEEN 1 AND 100)
);

CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_member_home
        FOREIGN KEY (home_id)
        REFERENCES homes(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_member_name
        CHECK (length(trim(name)) BETWEEN 1 AND 100),

    CONSTRAINT uq_member_name_per_home
        UNIQUE (home_id, name),

    CONSTRAINT uq_member_home_id
        UNIQUE (home_id, id)
);

CREATE TABLE bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    total_cents INTEGER NOT NULL,
    creation_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bill_home
        FOREIGN KEY (home_id)
        REFERENCES homes(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_bill_title
        CHECK (length(trim(title)) BETWEEN 1 AND 150),

    CONSTRAINT chk_bill_total
        CHECK (
            typeof(total_cents) = 'integer'
            AND total_cents > 0
        ),

    CONSTRAINT uq_bill_home_id
        UNIQUE (home_id, id)
);

CREATE TABLE shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    home_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    paid_at TEXT,
    idempotency_key TEXT,

    CONSTRAINT fk_share_bill
        FOREIGN KEY (home_id, bill_id)
        REFERENCES bills(home_id, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_share_member
        FOREIGN KEY (home_id, member_id)
        REFERENCES members(home_id, id)
        ON DELETE CASCADE,

    CONSTRAINT chk_share_amount
        CHECK (
            typeof(amount_cents) = 'integer'
            AND amount_cents >= 0
        ),

    CONSTRAINT chk_share_payment_state
        CHECK (
            (paid_at IS NULL AND idempotency_key IS NULL)
            OR
            (
                paid_at IS NOT NULL
                AND idempotency_key IS NOT NULL
                AND length(idempotency_key) > 0
            )
        ),

    CONSTRAINT uq_bill_member_share
        UNIQUE (bill_id, member_id)
);

CREATE INDEX idx_members_home_id
    ON members(home_id, id);

CREATE INDEX idx_bills_home_id
    ON bills(home_id, id);

CREATE INDEX idx_shares_bill_id
    ON shares(bill_id);

CREATE INDEX idx_shares_member_id
    ON shares(member_id);
