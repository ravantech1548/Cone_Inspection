# Verify No Blocking Issues Script
# This script verifies that the start-and-monitor.ps1 uses non-blocking process starts

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verifying Non-Blocking Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$scriptContent = Get-Content "start-and-monitor.ps1" -Raw

Write-Host "`nChecking for blocking patterns..." -ForegroundColor Yellow

# Check for bad patterns (blocking)
$badPatterns = @(
    @{Pattern = 'UseShellExecute\s*=\s*\$false'; Description = "UseShellExecute = false (can cause blocking)"},
    @{Pattern = 'RedirectStandardOutput\s*=\s*\$true'; Description = "RedirectStandardOutput = true (causes blocking)"},
    @{Pattern = 'RedirectStandardError\s*=\s*\$true'; Description = "RedirectStandardError = true (causes blocking)"},
    @{Pattern = 'CreateNoWindow\s*=\s*\$true'; Description = "CreateNoWindow = true (with redirection causes blocking)"}
)

$foundIssues = $false

foreach ($pattern in $badPatterns) {
    if ($scriptContent -match $pattern.Pattern) {
        Write-Host "[X] FOUND: $($pattern.Description)" -ForegroundColor Red
        $foundIssues = $true
    } else {
        Write-Host "[OK] Not found: $($pattern.Description)" -ForegroundColor Green
    }
}

Write-Host "`nChecking for good patterns..." -ForegroundColor Yellow

# Check for good patterns (non-blocking)
$goodPatterns = @(
    @{Pattern = 'Start-Process powershell.*-PassThru.*-WindowStyle Minimized'; Description = "Start-Process with PassThru and WindowStyle"},
    @{Pattern = '-NoExit'; Description = "NoExit flag (keeps windows open)"},
    @{Pattern = 'Start in a new window so output doesn''t block'; Description = "Comment explaining non-blocking approach"}
)

$foundGoodPatterns = 0

foreach ($pattern in $goodPatterns) {
    if ($scriptContent -match $pattern.Pattern) {
        Write-Host "[OK] FOUND: $($pattern.Description)" -ForegroundColor Green
        $foundGoodPatterns++
    } else {
        Write-Host "[X] Not found: $($pattern.Description)" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($foundIssues) {
    Write-Host "`n[!] BLOCKING ISSUES DETECTED!" -ForegroundColor Red
    Write-Host "The script may have stdout/stderr blocking problems." -ForegroundColor Yellow
    Write-Host "`nRecommended fix:" -ForegroundColor Yellow
    Write-Host "  Replace blocking process creation with:" -ForegroundColor Gray
    Write-Host "  Start-Process powershell -ArgumentList `"-NoExit`", `"-Command`", `$command -PassThru -WindowStyle Minimized" -ForegroundColor Cyan
} else {
    Write-Host "`n[OK] No blocking issues detected!" -ForegroundColor Green
    Write-Host "The script uses non-blocking process creation." -ForegroundColor Green
}

if ($foundGoodPatterns -eq $goodPatterns.Count) {
    Write-Host "[OK] All good patterns found ($foundGoodPatterns/$($goodPatterns.Count))" -ForegroundColor Green
} else {
    Write-Host "[!] Some good patterns missing ($foundGoodPatterns/$($goodPatterns.Count))" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "How It Works" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nNon-Blocking Approach:" -ForegroundColor Yellow
Write-Host "  1. Start-Process creates independent process" -ForegroundColor Gray
Write-Host "  2. -WindowStyle Minimized opens in separate window" -ForegroundColor Gray
Write-Host "  3. -NoExit keeps window open for logs" -ForegroundColor Gray
Write-Host "  4. -PassThru returns process object for monitoring" -ForegroundColor Gray
Write-Host "  5. Output goes to window, not redirected buffers" -ForegroundColor Gray

Write-Host "`nBlocking Approach (AVOID):" -ForegroundColor Yellow
Write-Host "  1. UseShellExecute = false" -ForegroundColor Red
Write-Host "  2. RedirectStandardOutput = true" -ForegroundColor Red
Write-Host "  3. RedirectStandardError = true" -ForegroundColor Red
Write-Host "  4. Buffers fill up and block process" -ForegroundColor Red

Write-Host "`n========================================" -ForegroundColor Cyan
