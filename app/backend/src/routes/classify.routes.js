import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { classifyBatch, createOverride } from '../services/classification.service.js';
import { ClassifyBatchSchema, CreateOverrideSchema } from '@textile-inspector/shared';

const router = express.Router();

router.use(authenticate);

router.post('/apply', async (req, res, next) => {
  try {
    const { batchId } = ClassifyBatchSchema.parse(req.body);
    const result = await classifyBatch(batchId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/override', async (req, res, next) => {
  try {
    const { imageId, newClassification, reason } = CreateOverrideSchema.parse(req.body);
    await createOverride(imageId, req.user.userId, newClassification, reason);
    res.json({ message: 'Override created' });
  } catch (error) {
    next(error);
  }
});

export default router;
