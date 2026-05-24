$url = "https://api.github.com/repos/Dara8091/fut-invest/actions/runs/26347972935/jobs"
$jobs = Invoke-RestMethod $url
foreach ($job in $jobs.jobs) {
    if ($job.name -eq "e2e") {
        Write-Output "=== E2E JOB LOGS ==="
        $logs = Invoke-RestMethod $job.logs_url
        Write-Output $logs
    }
}
