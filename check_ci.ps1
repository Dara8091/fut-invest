$url = "https://api.github.com/repos/Dara8091/fut-invest/actions/runs/26347972935/jobs"
$jobs = Invoke-RestMethod $url
foreach ($job in $jobs.jobs) {
    Write-Output ("{0}: {1}" -f $job.name, $job.conclusion)
    if ($job.conclusion -eq "failure") {
        foreach ($step in $job.steps) {
            if ($step.conclusion -eq "failure") {
                Write-Output "  -> Failed step: $($step.name)"
            }
        }
    }
}
