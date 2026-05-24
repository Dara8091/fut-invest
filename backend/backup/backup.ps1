# ============================================
# fut.invest - SQLite Database Backup + Verify
# ============================================
param(
    [string]$DbPath = (Join-Path $PSScriptRoot "..\data\fut_invest.db"),
    [string]$BackupDir = (Join-Path $PSScriptRoot "..\backup\snapshots"),
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $DbPath)) {
    Write-Warning "Base de datos no encontrada: $DbPath"
    exit 1
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "fut_invest_$timestamp.db"
$backupLog = Join-Path $BackupDir "backup.log"

# Backup via SQLite .backup command
$script = @"
const Database = require('better-sqlite3');
const src = new Database('$($DbPath.Replace("'","''"))');
src.backup('$($backupFile.Replace("'","''"))');
src.close();
console.log('OK');
"@

$tempJs = Join-Path $PSScriptRoot "_backup_temp.js"
Set-Content -Path $tempJs -Value $script -Force
$result = node $tempJs 2>&1
Remove-Item $tempJs -Force

if ($LASTEXITCODE -eq 0 -and $result -eq "OK") {
    $size = (Get-Item $backupFile).Length
    $msg = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backup creado: $backupFile ($([math]::Round($size/1KB, 1)) KB)"
    Add-Content -Path $backupLog -Value $msg
    Write-Host $msg -ForegroundColor Green

    # Verify backup integrity
    $verifyScript = @"
const Database = require('better-sqlite3');
try {
    const db = new Database('$($backupFile.Replace("'","''"))');
    const integrity = db.pragma('integrity_check');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '\_%' ESCAPE '\'").all();
    const tableCount = tables.length;
    let rowCount = 0;
    for (const t of tables) {
        const r = db.get('SELECT COUNT(*) as c FROM "' + t.name + '"');
        rowCount += r.c;
    }
    db.close();
    console.log(JSON.stringify({ integrity: integrity[0].integrity_check, tables: tableCount, rows: rowCount }));
} catch (e) {
    console.log(JSON.stringify({ error: e.message }));
}
"@
    $verifyJs = Join-Path $PSScriptRoot "_verify_temp.js"
    Set-Content -Path $verifyJs -Value $verifyScript -Force
    $verifyResult = node $verifyJs 2>&1
    Remove-Item $verifyJs -Force

    try {
        $parsed = $verifyResult | ConvertFrom-Json
        if ($parsed.error) {
            Write-Error "Verificación falló: $($parsed.error)"
            exit 1
        }
        if ($parsed.integrity -ne "ok") {
            Write-Error "Integrity check falló: $($parsed.integrity)"
            exit 1
        }
        Write-Host "Verificación: integrity=ok, tablas=$($parsed.tables), filas=$($parsed.rows)" -ForegroundColor Cyan
    } catch {
        Write-Error "Error parseando verificación: $verifyResult"
        exit 1
    }

    # Clean old backups
    $cutoff = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "fut_invest_*.db" | Where-Object {
        $_.LastWriteTime -lt $cutoff
    } | Remove-Item -Force

    Write-Host "Backups anteriores a $RetentionDays días eliminados." -ForegroundColor Yellow
} else {
    Write-Error "Backup falló: $result"
    exit 1
}
