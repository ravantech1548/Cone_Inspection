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
              i.created_at,
              p.inference_time_ms, p.payload, p.created_at as prediction_time,
              m.name as model_name, m.version as model_version
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
    
    // Get batch information
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
    
    const batch = batchResult.rows[0];
    
    // Get selected good class
    const metadataResult = await query(
      `SELECT value as selected_good_class
       FROM batch_metadata
       WHERE batch_id = $1 AND key = 'selected_good_class'`,
      [req.params.id]
    );
    
    const selectedGoodClass = metadataResult.rows[0]?.selected_good_class || 'Not set';
    
    // Get images data with timestamps
    const result = await query(
      `SELECT i.filename, i.classification, i.hex_color, i.lab_color, i.confidence,
              i.created_at,
              p.inference_time_ms, p.payload, p.created_at as prediction_time,
              m.name as model_name, m.version as model_version
       FROM images i
       LEFT JOIN predictions p ON i.id = p.image_id
       LEFT JOIN models m ON p.model_id = m.id
       WHERE i.batch_id = $1
       ORDER BY i.created_at`,
      [req.params.id]
    );
    
    if (format === 'csv') {
      // Build CSV with summary section
      const csvLines = [];
      
      // Summary Section
      csvLines.push('INSPECTION REPORT SUMMARY');
      csvLines.push('');
      csvLines.push(`Batch ID,${batch.id}`);
      csvLines.push(`Batch Name,${batch.name || 'N/A'}`);
      csvLines.push(`Inspector,${batch.username || 'Unknown'}`);
      csvLines.push(`Selected Good Class,${selectedGoodClass}`);
      csvLines.push(`Status,${batch.status}`);
      csvLines.push(`Total Images,${batch.total_images || 0}`);
      csvLines.push(`Good Count,${batch.good_count || 0}`);
      csvLines.push(`Reject Count,${batch.reject_count || 0}`);
      csvLines.push(`Created,${new Date(batch.created_at).toLocaleString()}`);
      if (batch.finalized_at) {
        csvLines.push(`Finalized,${new Date(batch.finalized_at).toLocaleString()}`);
      }
      csvLines.push('');
      csvLines.push('');
      
      // Images Section
      csvLines.push('INSPECTION DETAILS');
      csvLines.push('');
      const headers = ['Filename', 'Classification', 'Predicted Class', 'Selected Good Class', 'Confidence', 'Hex Color', 'Date & Time', 'Model', 'Inference Time (ms)'];
      csvLines.push(headers.join(','));
      
      result.rows.forEach(row => {
        const predictedClass = row.payload?.predicted_class || 'N/A';
        const confidence = row.confidence ? (row.confidence * 100).toFixed(1) + '%' : 'N/A';
        // Format timestamp in local timezone
        const timestamp = row.created_at ? new Date(row.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) : 'N/A';
        csvLines.push([
          row.filename,
          row.classification.toUpperCase(),
          predictedClass,
          selectedGoodClass,
          confidence,
          row.hex_color || 'N/A',
          timestamp,
          `${row.model_name}:${row.model_version}`,
          row.inference_time_ms || 'N/A'
        ].join(','));
      });
      
      const csv = csvLines.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=inspection-report-batch-${req.params.id}.csv`);
      res.send(csv);
    } else {
      // JSON export includes batch info and selected_good_class in each image
      res.json({
        batch: {
          ...batch,
          selected_good_class: selectedGoodClass
        },
        images: result.rows.map(row => ({
          ...row,
          selected_good_class: selectedGoodClass,
          predicted_class: row.payload?.predicted_class || null,
          // Format timestamps for display
          created_at_formatted: row.created_at ? new Date(row.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Singapore'
          }) : null,
          prediction_time_formatted: row.prediction_time ? new Date(row.prediction_time).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Singapore'
          }) : null
        }))
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
