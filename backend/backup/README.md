# Backup Database

## Uso manual
```powershell
.\backup\backup.ps1
```

## Programar backup automático (Windows Task Scheduler)
```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File `"$PWD\backup\backup.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At "03:00AM"
Register-ScheduledTask -TaskName "futinvest-backup" -Action $action -Trigger $trigger -RunLevel Highest
```

## Programar backup (Linux crontab)
```
0 3 * * * cd /opt/futinvest/backend && pwsh -File backup/backup.ps1
```

## Restaurar
```bash
cp backup/snapshots/fut_invest_20260522_030000.db data/fut_invest.db
```
