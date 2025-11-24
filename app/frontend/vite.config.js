import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Check if SSL certificates exist
const certsPath = path.resolve(__dirname, '../../certs');
const certFile = path.join(certsPath, 'backend-cert.pem');
const keyFile = path.join(certsPath, 'backend-key.pem');

const useHttps = fs.existsSync(certFile) && fs.existsSync(keyFile);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: useHttps ? {
      key: fs.readFileSync(keyFile),
      cert: fs.readFileSync(certFile),
    } : undefined,
    proxy: {
      '/api': {
        target: useHttps ? 'https://localhost:3001' : 'http://localhost:3001',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
      }
    }
  }
});
