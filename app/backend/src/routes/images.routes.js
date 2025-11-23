import express from 'express';
import busboy from 'busboy';
import { query } from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { saveImage } from '../services/upload.service.js';
import { runInferenceOnImage } from '../services/inference.service.js';
import { config } from '../config.js';

const router = express.Router();

router.use(authenticate);

router.post('/upload', (req, res, next) => {
  const bb = busboy({ 
    headers: req.headers,
    limits: {
      fileSize: config.upload.maxFileSize,
      files: config.upload.maxBatchSize
    }
  });
  
  const batchId = parseInt(req.query.batchId);
  const results = [];
  
  bb.on('file', async (fieldname, file, info) => {
    const { filename, mimeType } = info;
    
    if (!['image/jpeg', 'image/png'].includes(mimeType)) {
      file.resume();
      results.push({ filename, error: 'Invalid file type' });
      return;
    }
    
    const chunks = [];
    file.on('data', (chunk) => chunks.push(chunk));
    
    file.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const result = await saveImage(batchId, buffer, filename);
        
        if (result.isDuplicate) {
          results.push({ 
            filename, 
            status: 'duplicate',
            existingId: result.existingImage.id 
          });
        } else {
          // Run inference asynchronously
          runInferenceOnImage(result.image.id).catch(console.error);
          
          results.push({ 
            filename, 
            status: 'uploaded',
            imageId: result.image.id 
          });
        }
      } catch (error) {
        results.push({ filename, error: error.message });
      }
    });
  });
  
  bb.on('finish', async () => {
    // Update batch status and count
    await query(
      `UPDATE batches 
       SET status = 'uploaded', total_images = (SELECT COUNT(*) FROM images WHERE batch_id = $1)
       WHERE id = $1`,
      [batchId]
    );
    
    res.json({ results });
  });
  
  req.pipe(bb);
});

router.get('/', async (req, res, next) => {
  try {
    const { batchId, classification, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let queryText = 'SELECT i.* FROM images i WHERE 1=1';
    const params = [];
    
    if (batchId) {
      params.push(batchId);
      queryText += ' AND i.batch_id = $' + params.length;
    }
    
    if (classification) {
      params.push(classification);
      queryText += ' AND i.classification = $' + params.length;
    }
    
    queryText += ' ORDER BY i.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    console.log('Images query:', queryText, params);
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error loading images:', error);
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT i.*, p.payload, p.tip_mask, p.inference_time_ms, m.name as model_name, m.version as model_version
       FROM images i
       LEFT JOIN predictions p ON i.id = p.image_id
       LEFT JOIN models m ON p.model_id = m.id
       WHERE i.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
