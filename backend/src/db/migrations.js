const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const logger = require('../config/logger');

const MIGRATIONS_TABLE = '_migrations';

function ensureMigrationsTable() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL UNIQUE,
            applied_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            checksum    TEXT    NOT NULL,
            duration_ms INTEGER NOT NULL DEFAULT 0
        )
    `);
}

function fileChecksum(filePath) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(fs.readFileSync(filePath, 'utf-8')).digest('hex').slice(0, 16);
}

function getAppliedMigrations() {
    const rows = db.prepare(`SELECT name, checksum FROM ${MIGRATIONS_TABLE} ORDER BY id`).all();
    return new Map(rows.map(r => [r.name, r.checksum]));
}

async function runMigrations() {
    ensureMigrationsTable();
    const applied = getAppliedMigrations();
    const migrationsDir = path.join(__dirname, 'versions');

    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
        fs.writeFileSync(path.join(migrationsDir, '001_initial.sql'),
            fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8'));
        logger.info('Migración base creada: 001_initial.sql');
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    for (const file of files) {
        if (applied.has(file)) {
            const cs = fileChecksum(path.join(migrationsDir, file));
            if (applied.get(file) !== cs) {
                throw new Error(`Migración ${file} fue modificada después de aplicarse. Checksum mismatch.`);
            }
            continue;
        }

        const start = Date.now();
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        const cs = fileChecksum(path.join(migrationsDir, file));

        try {
            // Strip PRAGMA lines — already set by database.js and can't run inside a transaction
            const cleanSql = sql.split('\n').filter(l => !l.trim().toUpperCase().startsWith('PRAGMA')).join('\n');

            db.transaction(() => {
                db.exec(cleanSql);
                db.prepare(
                    `INSERT INTO ${MIGRATIONS_TABLE} (name, checksum, duration_ms) VALUES (?, ?, ?)`
                ).run(file, cs, Date.now() - start);
            })();

            logger.info(`Migración aplicada: ${file} (${Date.now() - start}ms)`);
        } catch (err) {
            logger.error(`Error aplicando migración ${file}: ${err.message}`);
            throw err;
        }
    }

    logger.info(`Migraciones: ${files.length} totales, ${files.length - applied.size} nuevas`);
}

module.exports = { runMigrations };
