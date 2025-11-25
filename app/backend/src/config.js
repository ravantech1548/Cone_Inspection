import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://192.168.0.6:5173',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://textile_user:textile_pass_123@127.0.0.1:5432/textile_inspector',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    timezone: process.env.DB_TIMEZONE || 'Asia/Singapore'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: '24h'
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '100', 10)
  },
  
  inference: {
    timeout: parseInt(process.env.INFERENCE_TIMEOUT || '3000', 10),
    serviceUrl: process.env.INFERENCE_SERVICE_URL || 'http://192.168.0.6:5000',
    modelVersion: process.env.MODEL_VERSION || 'v1.0.0'
  },
  
  color: {
    defaultDeltaETolerance: parseFloat(process.env.DEFAULT_DELTA_E_TOLERANCE || '10.0')
  },
  
  tls: {
    enabled: process.env.USE_HTTPS === 'true',
    certPath: process.env.TLS_CERT_PATH,
    keyPath: process.env.TLS_KEY_PATH
  }
};
