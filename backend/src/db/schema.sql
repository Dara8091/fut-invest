-- ============================================
-- fut.invest - Database Schema (completo)
-- RLS implementado a nivel aplicación (cada
-- consulta filtra por user_id autenticado)
-- ============================================
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    email               TEXT    NOT NULL UNIQUE,
    password_hash       TEXT    NOT NULL,
    full_name           TEXT    NOT NULL DEFAULT 'Inversor',
    role                TEXT    NOT NULL DEFAULT 'investor' CHECK(role IN ('investor','admin','superadmin')),
    tier                TEXT    NOT NULL DEFAULT 'gold' CHECK(tier IN ('silver','gold','black')),
    kyc_status          TEXT    NOT NULL DEFAULT 'pending' CHECK(kyc_status IN ('pending','approved','rejected')),
    totp_enabled        INTEGER NOT NULL DEFAULT 0,
    email_verified      INTEGER NOT NULL DEFAULT 0,
    verification_token  TEXT,
    verification_sent   TEXT,
    email_notifications INTEGER NOT NULL DEFAULT 1,
    push_enabled        INTEGER NOT NULL DEFAULT 0,
    referral_code       TEXT UNIQUE,
    referred_by         INTEGER,
    kyc_document_url    TEXT,
    kyc_submitted_at    TEXT,
    kyc_reviewed_by     INTEGER,
    kyc_notes           TEXT,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    token_hash      TEXT    NOT NULL UNIQUE,
    expires_at      TEXT    NOT NULL,
    revoked         INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reset_tokens (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    token_hash      TEXT    NOT NULL UNIQUE,
    expires_at      TEXT    NOT NULL,
    used            INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS accounts (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL UNIQUE,
    balance             REAL    NOT NULL DEFAULT 0 CHECK(balance >= 0),
    accumulated_earnings REAL   NOT NULL DEFAULT 0,
    daily_roi           REAL    NOT NULL DEFAULT 1.85,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS contracts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    contract_ref    TEXT    NOT NULL UNIQUE,
    amount          REAL    NOT NULL CHECK(amount > 0),
    tier            TEXT    NOT NULL,
    roi_range_min   REAL    NOT NULL,
    roi_range_max   REAL    NOT NULL,
    harvested       REAL    NOT NULL DEFAULT 0,
    harvest_target  REAL    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','cancelled')),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    type            TEXT    NOT NULL CHECK(type IN ('deposit','withdraw','roi_payout','liquidation','fee')),
    asset           TEXT    NOT NULL DEFAULT 'USDT',
    amount          REAL    NOT NULL CHECK(amount > 0),
    fee             REAL    NOT NULL DEFAULT 0,
    status          TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed','cancelled')),
    tx_hash         TEXT,
    wallet_address  TEXT,
    provider        TEXT,
    provider_tx_id  TEXT,
    metadata        TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS roi_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    rate            REAL    NOT NULL,
    gain            REAL    NOT NULL,
    date            TEXT    NOT NULL DEFAULT (date('now')),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS network_nodes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    parent_id       INTEGER,
    side            TEXT    CHECK(side IN ('left','right')),
    name            TEXT    NOT NULL,
    role            TEXT    NOT NULL DEFAULT 'Socio',
    points_left     INTEGER NOT NULL DEFAULT 0,
    points_right    INTEGER NOT NULL DEFAULT 0,
    volume          REAL    NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES network_nodes(id)
);

-- === Payment Gateway Tables ===

CREATE TABLE IF NOT EXISTS payment_addresses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    asset           TEXT    NOT NULL,
    address         TEXT    NOT NULL UNIQUE,
    derivation_path TEXT,
    provider        TEXT    NOT NULL DEFAULT 'mock',
    active          INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    idempotency_key TEXT    NOT NULL UNIQUE,
    provider        TEXT    NOT NULL,
    event_type      TEXT    NOT NULL,
    payload         TEXT    NOT NULL,
    processed       INTEGER NOT NULL DEFAULT 0,
    error           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS withdrawal_queue (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    transaction_id  INTEGER NOT NULL,
    asset           TEXT    NOT NULL,
    amount          REAL    NOT NULL CHECK(amount > 0),
    address         TEXT    NOT NULL,
    fee             REAL    NOT NULL DEFAULT 0,
    status          TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed','cancelled')),
    provider        TEXT,
    provider_tx_id  TEXT,
    approved_by     INTEGER,
    approved_at     TEXT,
    processed_at    TEXT,
    error_message   TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER,
    action          TEXT    NOT NULL,
    entity_type     TEXT,
    entity_id       INTEGER,
    old_value       TEXT,
    new_value       TEXT,
    ip_address      TEXT,
    user_agent      TEXT,
    metadata        TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS fee_config (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    asset           TEXT    NOT NULL,
    network         TEXT    NOT NULL,
    withdrawal_fee  REAL    NOT NULL DEFAULT 0,
    deposit_fee     REAL    NOT NULL DEFAULT 0,
    min_withdrawal  REAL    NOT NULL DEFAULT 10,
    max_withdrawal  REAL    NOT NULL DEFAULT 50000,
    confirmations   INTEGER NOT NULL DEFAULT 1,
    active          INTEGER NOT NULL DEFAULT 1,
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(asset, network)
);

-- === Metrics & Analytics ===

CREATE TABLE IF NOT EXISTS metrics_hourly (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    hour            TEXT    NOT NULL,
    endpoint        TEXT    NOT NULL,
    method          TEXT    NOT NULL DEFAULT 'GET',
    status_code     INTEGER NOT NULL DEFAULT 200,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    count           INTEGER NOT NULL DEFAULT 1,
    user_id         INTEGER,
    ip_address      TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS onboarding_progress (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL UNIQUE,
    step_welcome    INTEGER NOT NULL DEFAULT 0,
    step_profile    INTEGER NOT NULL DEFAULT 0,
    step_deposit    INTEGER NOT NULL DEFAULT 0,
    step_kyc        INTEGER NOT NULL DEFAULT 0,
    step_contract   INTEGER NOT NULL DEFAULT 0,
    completed       INTEGER NOT NULL DEFAULT 0,
    completed_at    TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS kyc_documents (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    document_type   TEXT    NOT NULL CHECK(document_type IN ('id_front','id_back','passport','selfie','proof_of_address')),
    file_url        TEXT    NOT NULL,
    file_hash       TEXT,
    status          TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    reviewed_by     INTEGER,
    review_notes    TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- === Indexes ===
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_roi_history_user ON roi_history(user_id);
CREATE INDEX IF NOT EXISTS idx_network_user ON network_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_network_parent ON network_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_addresses_user ON payment_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_addresses_addr ON payment_addresses(address);
CREATE INDEX IF NOT EXISTS idx_webhook_events_key ON webhook_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_webhook_events_proc ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_withdrawal_queue_user ON withdrawal_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_queue_status ON withdrawal_queue(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- === Missing Indexes (added for performance) ===
CREATE INDEX IF NOT EXISTS idx_metrics_hourly_hour ON metrics_hourly(hour);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_fee_config_active ON fee_config(asset, network, active);
CREATE INDEX IF NOT EXISTS idx_withdrawal_queue_created ON withdrawal_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_updated ON transactions(updated_at);
