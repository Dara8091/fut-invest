$runs = Invoke-RestMethod 'https://api.github.com/repos/Dara8091/fut-invest/actions/runs?branch=master&per_page=5&event=push'
$ciRun = $runs.workflow_runs | Where-Object { $_.name -eq 'CI' -and $_.display_title -eq $runs.workflow_runs[0].display_title } | Select-Object -First 1
Write-Output "Commit SHA: $($ciRun.head_sha)"
Write-Output "CI Run URL: $($ciRun.html_url)"
