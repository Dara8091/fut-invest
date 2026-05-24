# PostgreSQL Migration Guide

## When to Migrate

- Cuando superes 100+ usuarios concurrentes
- Cuando necesites alta disponibilidad (replicación)
- Cuando SQLite WAL mode no sea suficiente

## Prerequisites

```bash
# Install PostgreSQL 16+
# Create database
psql -U postgres -c "CREATE DATABASE futinvest;"
psql -U postgres -c "CREATE USER futinvest WITH PASSWORD 'your_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE futinvest TO futinvest;"
```

## Configuration

```env
# .env
DB_TYPE=postgres
DATABASE_URL=postgresql://futinvest:your_password@localhost:5432/futinvest
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
```

## Schema Migration

SQLite schema is mostly compatible with PostgreSQL. Key differences:

1. **INTEGER PRIMARY KEY AUTOINCREMENT** → `SERIAL PRIMARY KEY`
2. **TEXT dates** → `TIMESTAMP WITH TIME ZONE`
3. **REAL** → `NUMERIC(18,8)` for financial fields
4. **CHECK constraints** are supported in both
5. **INSERT OR IGNORE** → `ON CONFLICT DO NOTHING`

Run the migration:
```bash
node src/db/migrate.js
```

## Connection Pool

The `config/database.js` adapter uses `pg.Pool` with configurable pool size.
Monitor with:
```sql
SELECT * FROM pg_stat_activity WHERE application_name = 'futinvest';
```

## Connection string examples

Local: `postgresql://user:pass@localhost:5432/futinvest`
RDS: `postgresql://user:pass@host:5432/futinvest?sslmode=require`
Cloud SQL: `postgresql://user:pass@/futinvest?host=/cloudsql/INSTANCE_CONNECTION_NAME`

## Backup

```bash
pg_dump -U futinvest futinvest > backup_$(date +%Y%m%d).sql
# Restore
psql -U futinvest futinvest < backup.sql
```
