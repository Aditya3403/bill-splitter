ALTER TABLE bills
ADD COLUMN created_by INTEGER
REFERENCES users(id);

ALTER TABLE bills
ADD COLUMN shared_with TEXT NOT NULL DEFAULT '[]'
CHECK (json_valid(shared_with));

CREATE INDEX idx_bills_created_by
ON bills(created_by);