$runs = Invoke-RestMethod 'https://api.github.com/repos/Dara8091/fut-invest/actions/runs?branch=master&per_page=5&event=push'
$ciRun = $runs.workflow_runs | Where-Object { $_.status -eq 'completed' -and $_.name -eq 'CI' } | Select-Object -First 1
$runId = $ciRun.id
$jobs = Invoke-RestMethod "https://api.github.com/repos/Dara8091/fut-invest/actions/runs/$runId/jobs"
$e2eJob = $jobs.jobs | Where-Object { $_.name -eq 'e2e' } | Select-Object -First 1

Write-Output "=== E2E Job Steps ==="
foreach ($step in $e2eJob.steps) {
    Write-Output "$($step.number). $($step.name): $($step.conclusion)"
}
