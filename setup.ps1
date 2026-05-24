# ============================================
# fut.invest - Setup Script
# ============================================
param(
    [switch]$NoFrontend,
    [switch]$NoDocker
)

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  fut.invest - Configuración del proyecto" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ---- Backend ----
Write-Host "[1/4] Instalando dependencias del backend..." -ForegroundColor Yellow
Set-Location "$rootDir\backend"
cmd /c "npm install" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: npm install falló" -ForegroundColor Red; exit 1 }
Write-Host "  OK" -ForegroundColor Green

# ---- .env ----
Write-Host "[2/4] Configurando variables de entorno..." -ForegroundColor Yellow
if (-not (Test-Path "$rootDir\backend\.env")) {
    Copy-Item "$rootDir\backend\.env.example" "$rootDir\backend\.env"
    # Generar JWT_SECRET aleatorio
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
    $envContent = Get-Content "$rootDir\backend\.env" -Raw
    $envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$jwtSecret"
    Set-Content "$rootDir\backend\.env" -Value $envContent
    Write-Host "  .env creado con JWT_SECRET generado" -ForegroundColor Green
} else {
    Write-Host "  .env ya existe" -ForegroundColor Green
}

# ---- Certs HTTPS ----
Write-Host "[3/4] Generando certificados SSL para desarrollo..." -ForegroundColor Yellow
& "$rootDir\backend\scripts\generate-certs.ps1"
Write-Host "  OK" -ForegroundColor Green

# ---- DB Migration ----
Write-Host "[4/4] Ejecutando migración de base de datos..." -ForegroundColor Yellow
cmd /c "npm run migrate" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Migración falló" -ForegroundColor Red; exit 1 }
Write-Host "  OK" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Configuración completada!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar el backend:" -ForegroundColor White
Write-Host "  cd backend && npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "Para iniciar con Docker:" -ForegroundColor White
Write-Host "  docker-compose up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "Usuario demo:" -ForegroundColor White
Write-Host "  Email:    demo@futinvest.io" -ForegroundColor Gray
Write-Host "  Password: Demo123!" -ForegroundColor Gray
