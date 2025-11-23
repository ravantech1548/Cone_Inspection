import express from 'express';
import { query } from '../db/pool.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '@textile-inspector/shared';

const router = express.Router();

router.use(authenticate);

router.get('/batch/:id', async (req, res, next) => {
  try {
    const batchResult = await query(
      `SELECT b.*, u.username, ct.color_name as acceptable_color_name
       FROM batches b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN color_taxonomy ct ON b.acceptable_color_id = ct.id
       WHERE b.id = $1`,
      [req.params.id]
    );
    
    if (batchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const imagesResult = await query(
      `SELECT i.id, i.filename, i.classification, i.hex_color, i.confidence,
              p.inference_time_ms, m.name as model_name, m.version as model_version
       FROM images i
       LEFT JOIN predictions p ON i.id = p.image_id
       LEFT JOIN models m ON p.model_id = m.id
       WHERE i.batch_id = $1
       ORDER BY i.created_at`,
      [req.params.id]
    );
    
    const overridesResult = await query(
      `SELECT o.*, u.username, i.filename
       FROM overrides o
       JOIN users u ON o.user_id = u.id
       JOIN images i ON o.image_id = i.id
       WHERE i.batch_id = $1
       ORDER BY o.created_at`,
      [req.params.id]
    );
    
    res.json({
      batch: batchResult.rows[0],
      images: imagesResult.rows,
      overrides: overridesResult.rows
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
              p.inference_time_ms, m.name as model_name, m.version as model_version,
              o.reason as override_reason, o.original_classification
       FROM images i
       LEFT JOIN predictions p ON i.id = p.image_id
       LEFT JOIN models m ON p.model_id = m.id
       LEFT JOIN overrides o ON i.id = o.image_id
       WHERE i.batch_id = $1
       ORDER BY i.created_at`,
      [req.params.id]
    );
    
    if (format === 'csv') {
      const headers = ['filename', 'classification', 'hex_color', 'confidence', 'model', 'inference_time_ms', 'override_reason'];
      const csv = [
        headers.join(','),
        ...result.rows.map(row => [
          row.filename,
          row.classification,
          row.hex_color,
          row.confidence,
          `${row.model_name}:${row.model_version}`,
          row.inference_time_ms,
          row.override_reason || ''
        ].join(','))
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
