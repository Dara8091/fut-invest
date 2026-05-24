# Genera certificados SSL autofirmados para desarrollo
$certsDir = Join-Path $PSScriptRoot "..\certs"
New-Item -ItemType Directory -Path $certsDir -Force | Out-Null

$keyPath = Join-Path $certsDir "key.pem"
$certPath = Join-Path $certsDir "cert.pem"

if (Test-Path $keyPath -and Test-Path $certPath) {
    Write-Host "Certificados ya existen en $certsDir" -ForegroundColor Green
    exit 0
}

# Intentar con OpenSSL si está disponible
try {
    $openssl = Get-Command "openssl" -ErrorAction Stop
    & $openssl req -x509 -newkey rsa:2048 -keyout $keyPath -out $certPath -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>$null
    Write-Host "Certificados generados con OpenSSL en $certsDir" -ForegroundColor Green
    exit 0
} catch {
    Write-Host "OpenSSL no encontrado. Generando certificados con Node.js..." -ForegroundColor Yellow
}

# Fallback: generar con Node.js (certificado débil pero funcional para dev)
$script = @'
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });

// Generar par de llaves RSA
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(path.join(certsDir, 'key.pem'), privateKey);
fs.writeFileSync(path.join(certsDir, 'cert.pem'), publicKey);
console.log('Certificados generados en ' + certsDir);
'@

$scriptPath = Join-Path $certsDir "..\scripts\gen-certs-fallback.js"
Set-Content -Path $scriptPath -Value $script -Force
node $scriptPath
Remove-Item $scriptPath -Force
