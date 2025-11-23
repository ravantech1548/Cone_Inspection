import express from 'express';
import busboy from 'busboy';
import fs from 'fs/promises';
import path from 'path';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '@textile-inspector/shared';
import { config } from '../config.js';

const router = express.Router();

const REFERENCE_DIR = path.join(config.upload.dir, 'references');

// Public image serving (no auth required for viewing)
router.get('/image/:class/:filename', async (req, res, next) => {
  try {
    const { class: className, filename } = req.params;
    const filePath = path.resolve(REFERENCE_DIR, className, filename);
    
    console.log('[REFERENCE] Serving image:', filePath);
    
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error('[REFERENCE] Image not found:', filePath, error.message);
    res.status(404).json({ error: 'Image not found' });
  }
});

// Admin-only routes (for upload/delete)
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// List all reference images
router.get('/', async (req, res, next) => {
  try {
    await fs.mkdir(REFERENCE_DIR, { recursive: true });
    
    const entries = await fs.readdir(REFERENCE_DIR);
    const references = [];
    const allClasses = [];
    
    for (const className of entries) {
      const classPath = path.join(REFERENCE_DIR, className);
      
      try {
        const stat = await fs.stat(classPath);
        
        if (stat.isDirectory()) {
          allClasses.push(className);
          
          const files = await fs.readdir(classPath);
          const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
          
          for (const file of imageFiles) {
            references.push({
              class: className,
              filename: file,
              path: `/api/references/image/${className}/${file}`
            });
          }
        }
      } catch (err) {
        console.error(`Error reading class ${className}:`, err);
      }
    }
    
    res.json({ 
      references, 
      count: references.length,
      classes: allClasses 
    });
  } catch (error) {
    next(error);
  }
});

// Upload reference image
router.post('/upload', (req, res, next) => {
  const bb = busboy({ 
    headers: req.headers,
    limits: { fileSize: config.upload.maxFileSize }
  });
  
  const className = req.query.class;
  
  if (!className) {
    return res.status(400).json({ error: 'Missing class parameter' });
  }
  
  const results = [];
  
  bb.on('file', async (fieldname, file, info) => {
    const { filename, mimeType } = info;
    
    if (!['image/jpeg', 'image/png'].includes(mimeType)) {
      file.resume();
      results.push({ filename, error: 'Invalid file type' });
      return;
    }
    
    const classDir = path.join(REFERENCE_DIR, className);
    await fs.mkdir(classDir, { recursive: true });
    
    const filePath = path.join(classDir, filename);
    const chunks = [];
    
    file.on('data', (chunk) => chunks.push(chunk));
    
    file.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        await fs.writeFile(filePath, buffer);
        
        results.push({ 
          filename, 
          status: 'uploaded',
          class: className,
          path: `/api/references/image/${className}/${filename}`
        });
      } catch (error) {
        results.push({ filename, error: error.message });
      }
    });
  });
  
  bb.on('finish', () => {
    res.json({ results });
  });
  
  req.pipe(bb);
});



// Delete reference image
router.delete('/:class/:filename', async (req, res, next) => {
  try {
    const { class: className, filename } = req.params;
    const filePath = path.join(REFERENCE_DIR, className, filename);
    
    await fs.unlink(filePath);
    res.json({ message: 'Reference image deleted' });
  } catch (error) {
    next(error);
  }
});

// Create new class directory
router.post('/classes', async (req, res, next) => {
  try {
    const { className } = req.body;
    
    if (!className || !/^[a-z0-9_-]+$/i.test(className)) {
      return res.status(400).json({ error: 'Invalid class name' });
    }
    
    const classDir = path.join(REFERENCE_DIR, className);
    await fs.mkdir(classDir, { recursive: true });
    
    res.json({ message: 'Class created', className });
  } catch (error) {
    next(error);
  }
});

export default router;
