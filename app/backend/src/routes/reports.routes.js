import express from 'express';
import { query } from '../db/pool.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '@textile-inspector/shared';

const router = express.Router();

router.use(authenticate);

router.get('/batch/:id', async (req, res, next) => {
  try {
    const batchResult = await query(
      `SELECT b.*, u.username
       FROM batches b
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.id = $1`,
      [req.params.id]
    );
    
    if (batchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const imagesResult = await query(
      `SELECT i.id, i.filename, i.classification, i.hex_color, i.confidence, i.thumbnail,
              p.inference_time_ms, p.payload, m.name as model_name, m.version as model_version
       FROM images i
       LEFT JOIN predictions p ON i.id = p.image_id
       LEFT JOIN models m ON p.model_id = m.id
       WHERE i.batch_id = $1
       ORDER BY i.created_at`,
      [req.params.id]
    );
    
    // Get selected good class from batch_metadata
    const metadataResult = await query(
      `SELECT value as selected_good_class
       FROM batch_metadata
       WHERE batch_id = $1 AND key = 'selected_good_class'`,
      [req.params.id]
    );
    
    res.json({
      batch: {
        ...batchResult.rows[0],
        selected_good_class: metadataResult.rows[0]?.selected_good_class
      },
      images: imagesResult.rows,
      overrides: [] // Overrides feature not implemented
    });
  } catch (error) {
    next(error);
  }
});

router.get('/batch/:id/export', async (req, res, next) => {
  try {
    const format = req.query.format || 'json';
    
    const result = await query(
      `SELECT i.filename, i.classification, i.hex_color, i.lab_color, i.confidence,
              p.inference_time_ms, p.payload, m.name as model_name, m.version as model_version
       FROM images i
       LEFT JOIN predictions p ON i.id = p.image_id
       LEFT JOIN models m ON p.model_id = m.id
       WHERE i.batch_id = $1
       ORDER BY i.created_at`,
      [req.params.id]
    );
    
    if (format === 'csv') {
      const headers = ['filename', 'classification', 'hex_color', 'confidence', 'predicted_class', 'model', 'inference_time_ms'];
      const csv = [
        headers.join(','),
        ...result.rows.map(row => {
          const predictedClass = row.payload?.predicted_class || '';
          return [
            row.filename,
            row.classification,
            row.hex_color,
            row.confidence,
            predictedClass,
            `${row.model_name}:${row.model_version}`,
            row.inference_time_ms
          ].join(',');
        })
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=batch-${req.params.id}.csv`);
      res.send(csv);
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    next(error);
  }
});

export default router;
