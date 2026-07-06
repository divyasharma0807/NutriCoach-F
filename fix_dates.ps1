$commits = git log -n 15 --format="%H" --reverse
$date = [datetime]::Now.AddHours(-15)
$rand = New-Object System.Random

git reset --hard HEAD~15

foreach ($c in $commits) {
    $tree = git log -1 --format="%T" $c
    $msg = git log -1 --format="%s" $c
    
    $minutes = $rand.Next(30, 61)
    $date = $date.AddMinutes($minutes)
    $dateStr = $date.ToString("yyyy-MM-ddTHH:mm:ss")
    
    $env:GIT_AUTHOR_DATE = $dateStr
    $env:GIT_COMMITTER_DATE = $dateStr
    
    $new_commit = git commit-tree $tree -p HEAD -m $msg
    
    git reset --hard $new_commit
}
git push origin main --force
