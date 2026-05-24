const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const logger = require('./logger');

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

let db;

if (DB_TYPE === 'postgres') {
    // PostgreSQL adapter — preparado para migración
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });

    db = {
        _pool: pool,
        prepare(sql) {
            return {
                run(...params) { return pool.query(sql, params); },
                get(...params) {
                    return pool.query(sql, params).then(r => r.rows[0] || null);
                },
                all(...params) {
                    return pool.query(sql, params).then(r => r.rows);
                },
            };
        },
        transaction(fn) {
            return async (...args) => {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    // Wrap db methods with client
                    const txDb = {
                        prepare(sql) {
                            return {
                                run(...params) { return client.query(sql, params); },
                                get(...params) { return client.query(sql, params).then(r => r.rows[0] || null); },
                                all(...params) { return client.query(sql, params).then(r => r.rows); },
                            };
                        },
                    };
                    const result = await fn.call({ db: txDb }, ...args);
                    await client.query('COMMIT');
                    return result;
                } catch (e) {
                    await client.query('ROLLBACK');
                    throw e;
                } finally {
                    client.release();
                }
            };
        },
        pragma() {},
        close() { return pool.end(); },
    };

    logger.info('Database: PostgreSQL conectado');
} else {
    const rawPath = process.env.DB_PATH || './data/fut_invest.db';
    const dbPath = rawPath === ':memory:' ? ':memory:' : path.resolve(__dirname, '../../', rawPath);

    if (rawPath !== ':memory:') {
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
    }

    db = new Database(dbPath);
    if (rawPath !== ':memory:') {
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        db.pragma('cache_size = -64000'); // 64MB
        db.pragma('busy_timeout = 5000');
    }
    db.pragma('foreign_keys = ON');

    logger.info(`Database: SQLite (${rawPath === ':memory:' ? 'memoria' : dbPath})`);
}

module.exports = db;
