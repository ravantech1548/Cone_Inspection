# Quick test to verify URL display in monitor script

function Get-CurrentIP {
    try {
        $adapters = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop | 
                    Where-Object {
                        ($_.InterfaceAlias -like "*Wi-Fi*" -or 
                         $_.InterfaceAlias -like "*Ethernet*" -or
                         $_.InterfaceAlias -like "*LAN*") -and
                        ($_.IPAddress -notlike "127.*") -and 
                        ($_.IPAddress -notlike "169.*") -and
                        ($_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual")
                    }
        
        if ($adapters) {
            $ip = $adapters | Select-Object -First 1 -ExpandProperty IPAddress
            Write-Host "[INFO] Detected IP from $($adapters[0].InterfaceAlias): $ip" -ForegroundColor Gray
            return $ip
        }
        
        return $null
    } catch {
        return $null
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "URL Display Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$currentIP = Get-CurrentIP

if ($currentIP) {
    Write-Host "`n[OK] Current IP Address: $currentIP" -ForegroundColor Green
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "[OK] All Services Started Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
    Write-Host "`nAccess URLs:" -ForegroundColor Yellow
    Write-Host "  Frontend:  https://${currentIP}:5173" -ForegroundColor Cyan
    Write-Host "  Backend:   https://${currentIP}:3001" -ForegroundColor Cyan
    Write-Host "  Inference: https://${currentIP}:5000" -ForegroundColor Cyan
    Write-Host "`nNote: Accept the SSL certificate warnings in your browser" -ForegroundColor Gray
} else {
    Write-Host "`n[ERROR] Could not detect IP address" -ForegroundColor Red
}
