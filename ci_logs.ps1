$runs = Invoke-RestMethod 'https://api.github.com/repos/Dara8091/fut-invest/actions/runs?branch=master&per_page=5&event=push'
$ciRun = $runs.workflow_runs | Where-Object { $_.status -eq 'completed' -and $_.name -eq 'CI' } | Select-Object -First 1
$runId = $ciRun.id
$zipUrl = $ciRun.logs_url
Write-Output "Downloading logs from: $zipUrl"
$zipPath = "$env:TEMP\ci_logs.zip"
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
Expand-Archive -Path $zipPath -DestinationPath "$env:TEMP\ci_logs" -Force
$e2eFile = Get-ChildItem "$env:TEMP\ci_logs" -Recurse -Filter "*e2e*" | Select-Object -First 1
if ($e2eFile) {
    Write-Output "=== E2E LOGS ==="
    Get-Content $e2eFile.FullName -Tail 100
} else {
    Write-Output "No e2e log file found"
    Get-ChildItem "$env:TEMP\ci_logs" -Recurse | Select-Object FullName
}
