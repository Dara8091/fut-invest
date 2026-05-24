-- Account lockout para prevenir brute force
CREATE TABLE IF NOT EXISTS login_attempts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    NOT NULL,
    attempts        INTEGER NOT NULL DEFAULT 1,
    first_attempt_at INTEGER NOT NULL,
    locked_until    INTEGER,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
