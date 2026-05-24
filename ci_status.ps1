$runs = Invoke-RestMethod 'https://api.github.com/repos/Dara8091/fut-invest/actions/runs?branch=master&per_page=5&event=push'
$run = $runs.workflow_runs | Where-Object { $_.status -eq 'completed' -and $_.name -eq 'CI' } | Select-Object -First 1
Write-Output "CI run id: $($run.id)"
$jobs = Invoke-RestMethod "https://api.github.com/repos/Dara8091/fut-invest/actions/runs/$($run.id)/jobs"
foreach ($job in $jobs.jobs) {
    Write-Output "Job: $($job.name) -> $($job.conclusion)"
    if ($job.conclusion -eq 'failure') {
        $job.steps | Where-Object { $_.conclusion -eq 'failure' } | ForEach-Object {
            Write-Output "  Failed step: $($_.name)"
        }
    }
}
