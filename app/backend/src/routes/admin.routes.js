import express from 'express';
import { query } from '../db/pool.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '@textile-inspector/shared';

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN, ROLES.SUPERVISOR));

// Color taxonomy
router.get('/taxonomy', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM color_taxonomy ORDER BY color_name');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/taxonomy', async (req, res, next) => {
  try {
    const { colorName, labRange, hexExamples, description } = req.body;
    
    const result = await query(
      `INSERT INTO color_taxonomy (color_name, lab_range, hex_examples, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [colorName, JSON.stringify(labRange), hexExamples, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Models
router.get('/models', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM models ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/models', async (req, res, next) => {
  try {
    const { name, version, checksum, config } = req.body;
    
    const result = await query(
      `INSERT INTO models (name, version, checksum, config)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, version, checksum, JSON.stringify(config)]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch('/models/:id/activate', async (req, res, next) => {
  try {
    await query('UPDATE models SET is_active = false');
    const result = await query(
      'UPDATE models SET is_active = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Prompts
router.get('/prompts', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM prompts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/prompts', async (req, res, next) => {
  try {
    const { name, version, schemaVersion, content, schema } = req.body;
    
    const result = await query(
      `INSERT INTO prompts (name, version, schema_version, content, schema)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, version, schemaVersion, content, JSON.stringify(schema)]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
