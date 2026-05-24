# Database Encryption at Rest

SQLite no soporta cifrado nativo. Para producción con datos sensibles:

## Opción 1: SQLCipher (recomendada para SQLite en producción)

1. Reemplazar `better-sqlite3` con `better-sqlite3-sqlcipher`:
   ```bash
   npm uninstall better-sqlite3
   npm install better-sqlite3-sqlcipher
   ```

2. Agregar `DB_ENCRYPTION_KEY` al `.env`:
   ```
   DB_ENCRYPTION_KEY=$(openssl rand -hex 32)
   ```

3. Modificar `config/database.js`:
   ```js
   const Database = require('better-sqlite3-sqlcipher');
   const db = new Database(dbPath);
   db.pragma(`key = '${process.env.DB_ENCRYPTION_KEY}'`);
   ```

## Opción 2: Volume Encryption (Linux/K8s)

Usar LUKS o dm-crypt a nivel de disco:
```bash
sudo cryptsetup luksFormat /dev/sdX
sudo cryptsetup open /dev/sdX futinvest-data
```

## Opción 3: PostgreSQL + TLS

PostgreSQL tiene cifrado de datos en reposo (data encryption) nativo con `pg_data_encrypt` o usando Extension `pgcrypto`.

## Backup Encryption

Los backups se cifran automáticamente si la DB está cifrada. Agregar cifrado adicional al backup script:

```bash
# En backup.ps1, después de crear el backup:
openssl enc -aes-256-cbc -salt -in backup.db -out backup.db.enc -pass pass:$BACKUP_ENCRYPTION_KEY
```

## Rotación de claves

- Rotar `DB_ENCRYPTION_KEY` cada 90 días
- Requiere re-cifrar la base de datos completa
- Usar Vault (HashiCorp) para gestión centralizada
