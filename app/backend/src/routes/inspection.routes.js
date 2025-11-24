import express from 'express';
import busboy from 'busboy';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config.js';
import { extractTipColor } from '../services/inference.service.js';
import { query, getClient } from '../db/pool.js';

const router = express.Router();

router.use(authenticate);

// Classify and save image immediately
router.post('/classify-and-save', (req, res, next) => {
  const bb = busboy({ 
    headers: req.headers,
    limits: { fileSize: config.upload.maxFileSize, files: 1 }
  });
  
  const batchId = parseInt(req.query.batchId);
  const selectedGoodClass = req.query.selectedGoodClass;
  
  if (!batchId || !selectedGoodClass) {
    return res.status(400).json({ error: 'Missing batchId or selectedGoodClass' });
  }
  
  bb.on('file', async (fieldname, file, info) => {
    const { filename, mimeType } = info;
    
    if (!['image/jpeg', 'image/png'].includes(mimeType)) {
      file.resume();
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    const chunks = [];
    file.on('data', (chunk) => chunks.push(chunk));
    
    file.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        // Save to batch directory
        const batchDir = path.resolve(config.upload.dir, batchId.toString());
        await fs.mkdir(batchDir, { recursive: true });
        
        const ext = path.extname(filename) || '.jpg';
        const savedFilename = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
        const savedPath = path.resolve(batchDir, savedFilename);
        
        console.log('[UPLOAD] Saving file to:', savedPath);
        await fs.writeFile(savedPath, buffer);
        console.log('[UPLOAD] File saved, checking exists:', await fs.access(savedPath).then(() => true).catch(() => false));
        
        // Generate thumbnail
        const sharp = (await import('sharp')).default;
        const thumbnailBuffer = await sharp(buffer)
          .resize(200, 200, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        const thumbnailBase64 = thumbnailBuffer.toString('base64');
        
        // Compute checksum
        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
        
        // Check for duplicate in current batch only
        const existingImage = await query(
          'SELECT id, filename, classification, confidence FROM images WHERE checksum = $1 AND batch_id = $2',
          [checksum, batchId]
        );
        
        if (existingImage.rows.length > 0) {
          // Image already exists in this batch
          const existing = existingImage.rows[0];
          
          // Delete the duplicate file
          await fs.unlink(savedPath).catch(() => {});
          
          return res.json({
            imageId: existing.id,
            predicted_class: selectedGoodClass,
            confidence: existing.confidence || 0.85,
            inference_time_ms: 0,
            classification: existing.classification,
            method: 'duplicate',
            all_classes: {},
            thumbnail: null,
            isDuplicate: true,
            message: 'This image was already scanned in this batch'
          });
        }
        
        // Get image metadata
        const metadata = await sharp(buffer).metadata();
        
        // Run inference
        const inferenceResult = await extractTipColor(savedPath);
        
        // Determine classification
        const predictedClass = inferenceResult.predictedClass || 'unknown';
        const isGood = predictedClass === selectedGoodClass;
        const classification = isGood ? 'good' : 'reject';
        
        // Save to database with conflict handling
        let imageResult;
        try {
          imageResult = await query(
            `INSERT INTO images (
              batch_id, filename, original_filename, checksum, file_path,
              file_size, mime_type, width, height, classification, confidence,
              lab_color, hex_color, thumbnail
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (checksum) DO UPDATE SET
              batch_id = EXCLUDED.batch_id,
              classification = EXCLUDED.classification,
              confidence = EXCLUDED.confidence
            RETURNING id, (xmax = 0) AS inserted`,
            [
              batchId,
              savedFilename,
              filename,
              checksum,
              savedPath,
              buffer.length,
              mimeType,
              metadata.width,
              metadata.height,
              classification,
              inferenceResult.confidence,
              JSON.stringify(inferenceResult.lab),
              inferenceResult.hex,
              thumbnailBase64
            ]
          );
        } catch (error) {
          // If still fails, it's a different error
          console.error('Database insert error:', error);
          await fs.unlink(savedPath).catch(() => {});
          throw error;
        }
        
        const imageId = imageResult.rows[0].id;
        const wasInserted = imageResult.rows[0].inserted;
        
        // Get active model
        const modelResult = await query('SELECT id FROM models WHERE is_active = true LIMIT 1');
        
        // Save prediction (prompt_id is nullable, not used with YOLO)
        // Use ON CONFLICT to update if prediction already exists for this image
        await query(
          `INSERT INTO predictions (
            image_id, model_id, prompt_id, payload, tip_mask, inference_time_ms
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (image_id) DO UPDATE SET
            model_id = EXCLUDED.model_id,
            payload = EXCLUDED.payload,
            tip_mask = EXCLUDED.tip_mask,
            inference_time_ms = EXCLUDED.inference_time_ms,
            created_at = CURRENT_TIMESTAMP`,
          [
            imageId,
            modelResult.rows[0]?.id,
            null, // prompt_id not used with YOLO
            JSON.stringify({
              predicted_class: predictedClass,
              all_classes: inferenceResult.allClasses,
              method: inferenceResult.method
            }),
            JSON.stringify(inferenceResult.tipMask),
            inferenceResult.inferenceTime
          ]
        );
        
        // Update batch counts and status
        await query(
          `UPDATE batches SET 
            total_images = (SELECT COUNT(*) FROM images WHERE batch_id = $1),
            good_count = (SELECT COUNT(*) FROM images WHERE batch_id = $1 AND classification = 'good'),
            reject_count = (SELECT COUNT(*) FROM images WHERE batch_id = $1 AND classification = 'reject'),
            status = CASE 
              WHEN status = 'uploading' AND (SELECT COUNT(*) FROM images WHERE batch_id = $1) > 0 
              THEN 'classified'
              ELSE status
            END
          WHERE id = $1`,
          [batchId]
        );
        
        // Store selected good class in batch_metadata if not already stored
        await query(
          `INSERT INTO batch_metadata (batch_id, key, value)
           VALUES ($1, 'selected_good_class', $2)
           ON CONFLICT (batch_id, key) DO UPDATE SET value = EXCLUDED.value`,
          [batchId, selectedGoodClass]
        );
        
        res.json({
          imageId,
          predicted_class: predictedClass,
          confidence: inferenceResult.confidence,
          inference_time_ms: inferenceResult.inferenceTime,
          classification,
          method: inferenceResult.method,
          all_classes: inferenceResult.allClasses,
          thumbnail: `data:image/jpeg;base64,${thumbnailBase64}`
        });
        
      } catch (error) {
        console.error('Classification error:', error);
        res.status(500).json({ error: error.message });
      }
    });
  });
  
  req.pipe(bb);
});

// Save inspection batch results
router.post('/save-batch', async (req, res, next) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { batchId, results, selectedGoodClass } = req.body;
    
    if (!batchId || !results || !Array.isArray(results)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    // Update batch with selected good class
    await client.query(
      `UPDATE batches 
       SET status = 'classified', 
           good_count = $1, 
           reject_count = $2
       WHERE id = $3`,
      [
        results.filter(r => r.classification === 'good').length,
        results.filter(r => r.classification === 'reject').length,
        batchId
      ]
    );
    
    // Store metadata about the inspection
    await client.query(
      `INSERT INTO batch_metadata (batch_id, key, value)
       VALUES ($1, 'selected_good_class', $2)
       ON CONFLICT (batch_id, key) DO UPDATE SET value = $2`,
      [batchId, selectedGoodClass]
    );
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Batch saved successfully',
      batchId,
      totalInspected: results.length
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

export default router;
