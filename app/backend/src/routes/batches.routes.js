import express from 'express';
import { query } from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { CreateBatchSchema, SelectAcceptableColorSchema } from '@textile-inspector/shared';

const router = express.Router();

router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const { name } = CreateBatchSchema.parse(req.body);
    
    const result = await query(
      `INSERT INTO batches (user_id, name, status)
       VALUES ($1, $2, 'uploading')
       RETURNING *`,
      [req.user.userId, name || `Batch ${Date.now()}`]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, u.username
       FROM batches b
       LEFT JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error loading batches:', error);
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, u.username
       FROM batches b
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error loading batch:', error);
    next(error);
  }
});

router.post('/:id/select-color', async (req, res, next) => {
  try {
    const { colorId, deltaETolerance } = SelectAcceptableColorSchema.parse({
      batchId: parseInt(req.params.id),
      ...req.body
    });
    
    const result = await query(
      `UPDATE batches 
       SET acceptable_color_id = $1, delta_e_tolerance = $2
       WHERE id = $3
       RETURNING *`,
      [colorId, deltaETolerance || 10.0, req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/finalize', async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE batches 
       SET status = 'finalized', finalized_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
