import express from 'express';
import fs from 'fs';
import https from 'https';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import batchesRoutes from './routes/batches.routes.js';
import imagesRoutes from './routes/images.routes.js';
import classifyRoutes from './routes/classify.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.frontendUrl);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Correlation ID
app.use((req, res, next) => {
  req.headers['x-correlation-id'] = req.headers['x-correlation-id'] || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  next();
});

import referencesRoutes from './routes/references.routes.js';
import inspectionRoutes from './routes/inspection.routes.js';
import modelRoutes from './routes/model.routes.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/batches', batchesRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/classify', classifyRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/references', referencesRoutes);
app.use('/api/inspection', inspectionRoutes);
app.use('/api/model', modelRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
let server;

if (config.tls.enabled && config.tls.certPath && config.tls.keyPath) {
  const options = {
    cert: fs.readFileSync(config.tls.certPath),
    key: fs.readFileSync(config.tls.keyPath)
  };
  server = https.createServer(options, app);
  console.log('Starting HTTPS server...');
} else {
  server = app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.env}`);
  });
}

export default app;
