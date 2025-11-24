# Generate Self-Signed SSL Certificates
# For Windows PowerShell

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Generating SSL Certificates" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Create certs directory
New-Item -ItemType Directory -Force -Path certs | Out-Null

# Check if OpenSSL is available
if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
    Write-Host "OpenSSL not found. Using PowerShell to generate certificates..." -ForegroundColor Yellow
    Write-Host ""
    
    # Generate backend certificate using PowerShell
    Write-Host "Generating backend certificate..." -ForegroundColor Yellow
    $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(1)
    $certPath = "cert:\CurrentUser\My\$($cert.Thumbprint)"
    $password = ConvertTo-SecureString -String "password" -Force -AsPlainText
    Export-PfxCertificate -Cert $certPath -FilePath "certs\backend-cert.pfx" -Password $password | Out-Null
    
    # Convert PFX to PEM format (requires OpenSSL)
    Write-Host "⚠️  To use with Node.js, you need OpenSSL to convert certificates" -ForegroundColor Yellow
    Write-Host "   Install OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    Write-Host "   Or use WSL: wsl bash generate-ssl-certs.sh" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Certificate generated at: certs\backend-cert.pfx" -ForegroundColor Green
    Write-Host "Password: password" -ForegroundColor Green
}
else {
    # Generate using OpenSSL
    Write-Host "Generating backend certificate..." -ForegroundColor Yellow
    openssl req -x509 -newkey rsa:4096 -keyout certs\backend-key.pem -out certs\backend-cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=localhost"
    Write-Host "✓ Backend certificate generated" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Generating inference service certificate..." -ForegroundColor Yellow
    openssl req -x509 -newkey rsa:4096 -keyout certs\inference-key.pem -out certs\inference-cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=localhost"
    Write-Host "✓ Inference service certificate generated" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "===================================" -ForegroundColor Cyan
    Write-Host "Certificates Generated Successfully" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Files created:" -ForegroundColor White
    Write-Host "  - certs\backend-key.pem" -ForegroundColor White
    Write-Host "  - certs\backend-cert.pem" -ForegroundColor White
    Write-Host "  - certs\inference-key.pem" -ForegroundColor White
    Write-Host "  - certs\inference-cert.pem" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  These are self-signed certificates for development only!" -ForegroundColor Yellow
    Write-Host "   Browsers will show security warnings." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To trust the certificates:" -ForegroundColor White
    Write-Host "  - Chrome: Click 'Advanced' → 'Proceed to localhost'" -ForegroundColor White
    Write-Host "  - Firefox: Click 'Advanced' → 'Accept the Risk'" -ForegroundColor White
    Write-Host ""
}
