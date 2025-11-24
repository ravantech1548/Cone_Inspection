import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('===================================');
console.log('Generating SSL Certificates');
console.log('===================================');
console.log('');

// Create certs directory
const certsDir = './certs';
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

try {
  // Check if OpenSSL is available
  execSync('openssl version', { stdio: 'ignore' });
  
  console.log('Generating backend certificate...');
  execSync(`openssl req -x509 -newkey rsa:4096 -keyout ${certsDir}/backend-key.pem -out ${certsDir}/backend-cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=localhost"`, { stdio: 'inherit' });
  console.log('✓ Backend certificate generated');
  console.log('');
  
  console.log('Generating inference service certificate...');
  execSync(`openssl req -x509 -newkey rsa:4096 -keyout ${certsDir}/inference-key.pem -out ${certsDir}/inference-cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=localhost"`, { stdio: 'inherit' });
  console.log('✓ Inference service certificate generated');
  console.log('');
  
  // Set permissions on Unix-like systems
  if (process.platform !== 'win32') {
    fs.chmodSync(`${certsDir}/backend-key.pem`, 0o600);
    fs.chmodSync(`${certsDir}/backend-cert.pem`, 0o600);
    fs.chmodSync(`${certsDir}/inference-key.pem`, 0o600);
    fs.chmodSync(`${certsDir}/inference-cert.pem`, 0o600);
  }
  
  console.log('===================================');
  console.log('Certificates Generated Successfully');
  console.log('===================================');
  console.log('');
  console.log('Files created:');
  console.log('  - certs/backend-key.pem');
  console.log('  - certs/backend-cert.pem');
  console.log('  - certs/inference-key.pem');
  console.log('  - certs/inference-cert.pem');
  console.log('');
  console.log('⚠️  These are self-signed certificates for development only!');
  console.log('   Browsers will show security warnings.');
  console.log('');
  
} catch (error) {
  console.error('✗ OpenSSL not found or failed to generate certificates');
  console.log('');
  console.log('Please install OpenSSL:');
  console.log('  Windows: https://slproweb.com/products/Win32OpenSSL.html');
  console.log('  macOS: brew install openssl');
  console.log('  Linux: sudo apt-get install openssl');
  console.log('');
  console.log('Or use WSL on Windows: wsl bash generate-ssl-certs.sh');
  process.exit(1);
}
