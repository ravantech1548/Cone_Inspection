import { query, getClient } from '../db/pool.js';
import { calculateDeltaE } from './color.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const classifyBatch = async (batchId) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Get batch with acceptable color
    const batchResult = await client.query(
      `SELECT b.id, b.acceptable_color_id, b.delta_e_tolerance, ct.lab_range
       FROM batches b
       LEFT JOIN color_taxonomy ct ON b.acceptable_color_id = ct.id
       WHERE b.id = $1`,
      [batchId]
    );
    
    if (batchResult.rows.length === 0) {
      throw new AppError('Batch not found', 404);
    }
    
    const batch = batchResult.rows[0];
    
    if (!batch.acceptable_color_id) {
      throw new AppError('No acceptable color selected', 400);
    }
    
    // Get reference LAB from taxonomy
    const labRange = batch.lab_range;
    const referenceLab = {
      L: (labRange.L[0] + labRange.L[1]) / 2,
      A: (labRange.A[0] + labRange.A[1]) / 2,
      B: (labRange.B[0] + labRange.B[1]) / 2
    };
    
    // Get all images in batch with LAB colors
    const imagesResult = await client.query(
      'SELECT id, lab_color FROM images WHERE batch_id = $1 AND lab_color IS NOT NULL',
      [batchId]
    );
    
    let goodCount = 0;
    let rejectCount = 0;
    
    // Classify each image
    for (const image of imagesResult.rows) {
      const imageLab = image.lab_color;
      const deltaE = calculateDeltaE(referenceLab, imageLab);
      
      const classification = deltaE <= batch.delta_e_tolerance ? 'good' : 'reject';
      
      await client.query(
        'UPDATE images SET classification = $1 WHERE id = $2',
        [classification, image.id]
      );
      
      if (classification === 'good') {
        goodCount++;
      } else {
        rejectCount++;
      }
    }
    
    // Update batch counts and status
    await client.query(
      `UPDATE batches 
       SET good_count = $1, reject_count = $2, status = 'classified'
       WHERE id = $3`,
      [goodCount, rejectCount, batchId]
    );
    
    await client.query('COMMIT');
    
    return { goodCount, rejectCount };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const createOverride = async (imageId, userId, newClassification, reason) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Get current classification
    const imageResult = await client.query(
      'SELECT classification, batch_id FROM images WHERE id = $1',
      [imageId]
    );
    
    if (imageResult.rows.length === 0) {
      throw new AppError('Image not found', 404);
    }
    
    const originalClassification = imageResult.rows[0].classification;
    const batchId = imageResult.rows[0].batch_id;
    
    // Create override record
    await client.query(
      `INSERT INTO overrides (image_id, user_id, original_classification, new_classification, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [imageId, userId, originalClassification, newClassification, reason]
    );
    
    // Update image classification
    await client.query(
      'UPDATE images SET classification = $1 WHERE id = $2',
      [newClassification, imageId]
    );
    
    // Recalculate batch counts
    const countsResult = await client.query(
      `SELECT 
         COUNT(*) FILTER (WHERE classification = 'good') as good_count,
         COUNT(*) FILTER (WHERE classification = 'reject') as reject_count
       FROM images WHERE batch_id = $1`,
      [batchId]
    );
    
    await client.query(
      'UPDATE batches SET good_count = $1, reject_count = $2 WHERE id = $3',
      [countsResult.rows[0].good_count, countsResult.rows[0].reject_count, batchId]
    );
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
