# ============================================
# fut.invest - Schedule automated backups
# Run as Admin: powershell -File schedule-backup.ps1
# ============================================

$ErrorActionPreference = "Stop"

$taskName = "FutInvest-Backup"
$scriptPath = Join-Path $PSScriptRoot "backup.ps1"
$dailyTrigger = New-ScheduledTaskTrigger -Daily -At "03:00"
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries

# Register Windows Task Scheduler
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $dailyTrigger -Settings $settings -Principal $principal -Force
    Write-Host "Tarea programada '$taskName' creada: diaria a las 03:00" -ForegroundColor Green
    Write-Host "Script: $scriptPath" -ForegroundColor Cyan
} catch {
    Write-Error "Error creando tarea programada: $_"
    Write-Host "Crea la tarea manualmente en Task Scheduler o configura un cron en Linux." -ForegroundColor Yellow
}

# Create Linux cron equivalent (for WSL/Linux)
$cronFile = Join-Path $PSScriptRoot "crontab.txt"
@"
# fut.invest backup - daily at 3 AM
0 3 * * * /usr/bin/node $(Join-Path $PSScriptRoot "..\backup\backup.ps1") >> $(Join-Path $PSScriptRoot "..\backup\snapshots\backup.log") 2>&1
"@ | Set-Content -Path $cronFile -Force
Write-Host "Crontab example: $cronFile" -ForegroundColor Cyan
