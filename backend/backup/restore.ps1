# ============================================
# fut.invest - Restore SQLite Database
# ============================================
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$DbPath = (Join-Path $PSScriptRoot "..\data\fut_invest.db")
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Archivo de backup no encontrado: $BackupFile"
    exit 1
}

# Verify backup integrity first
$verifyScript = @"
const Database = require('better-sqlite3');
try {
    const db = new Database('$($BackupFile.Replace("'","''"))');
    const integrity = db.pragma('integrity_check');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '\_%' ESCAPE '\'").all();
    let rowCount = 0;
    for (const t of tables) {
        const r = db.get('SELECT COUNT(*) as c FROM "' + t.name + '"');
        rowCount += r.c;
    }
    db.close();
    console.log(JSON.stringify({ integrity: integrity[0].integrity_check, tables: tables.length, rows: rowCount }));
} catch (e) {
    console.log(JSON.stringify({ error: e.message }));
}
"@

$verifyJs = Join-Path $PSScriptRoot "_restore_verify_temp.js"
Set-Content -Path $verifyJs -Value $verifyScript -Force
$verifyResult = node $verifyJs 2>&1
Remove-Item $verifyJs -Force

try {
    $parsed = $verifyResult | ConvertFrom-Json
    if ($parsed.error) {
        Write-Error "Verificación del backup falló: $($parsed.error)"
        exit 1
    }
    if ($parsed.integrity -ne "ok") {
        Write-Error "Integrity check del backup falló: $($parsed.integrity)"
        exit 1
    }
    Write-Host "Backup verificado: integrity=ok, tablas=$($parsed.tables), filas=$($parsed.rows)" -ForegroundColor Cyan
} catch {
    Write-Error "Error parseando verificación: $verifyResult"
    exit 1
}

# Stop the app before restore (if running)
$apiProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*fut_invest*" }
if ($apiProcess) {
    Write-Warning "La API está corriendo. Se recomienda detenerla antes de restaurar."
    $confirm = Read-Host "¿Detener la API? (s/N)"
    if ($confirm -eq "s") {
        $apiProcess | Stop-Process -Force
        Start-Sleep -Seconds 2
        Write-Host "API detenida." -ForegroundColor Yellow
    }
}

# Backup current DB before restore
$dbDir = Split-Path $DbPath -Parent
if (-not (Test-Path $dbDir)) {
    New-Item -ItemType Directory -Path $dbDir -Force | Out-Null
}

if (Test-Path $DbPath) {
    $preRestoreBackup = "$DbPath.before_restore.$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
    Copy-Item -Path $DbPath -Destination $preRestoreBackup -Force
    Write-Host "Backup pre-restauración: $preRestoreBackup" -ForegroundColor Yellow
}

# Restore
Copy-Item -Path $BackupFile -Destination $DbPath -Force
Write-Host "Restauración completada: $BackupFile → $DbPath" -ForegroundColor Green

# Verify restored DB
$verifyRestore = @"
const Database = require('better-sqlite3');
try {
    const db = new Database('$($DbPath.Replace("'","''"))');
    const integrity = db.pragma('integrity_check');
    const count = db.get('SELECT COUNT(*) as c FROM users').c;
    db.close();
    console.log(JSON.stringify({ integrity: integrity[0].integrity_check, users: count }));
} catch (e) {
    console.log(JSON.stringify({ error: e.message }));
}
"@

$verifyRestoreJs = Join-Path $PSScriptRoot "_restore_check_temp.js"
Set-Content -Path $verifyRestoreJs -Value $verifyRestore -Force
$restoreResult = node $verifyRestoreJs 2>&1
Remove-Item $verifyRestoreJs -Force

try {
    $parsed = $restoreResult | ConvertFrom-Json
    if ($parsed.error) {
        Write-Error "Verificación post-restauración falló: $($parsed.error)"
        exit 1
    }
    Write-Host "Base de datos restaurada verificada: integrity=$($parsed.integrity), usuarios=$($parsed.users)" -ForegroundColor Green
} catch {
    Write-Error "Error en verificación post-restauración: $restoreResult"
    exit 1
}
