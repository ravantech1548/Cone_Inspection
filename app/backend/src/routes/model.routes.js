import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config.js';

const router = express.Router();

router.use(authenticate);

// Get model classes from YOLO inference service
router.get('/classes', async (req, res, next) => {
  try {
    const response = await fetch(`${config.inference.serviceUrl}/api/model-info`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch model info');
    }
    
    const modelInfo = await response.json();
    
    res.json({
      classes: modelInfo.classes || [],
      num_classes: modelInfo.num_classes || 0,
      model_type: modelInfo.model_type || 'YOLO',
      class_mapping: modelInfo.class_mapping || {}
    });
    
  } catch (error) {
    console.error('Error fetching model classes:', error);
    // Return empty array if service unavailable
    res.json({
      classes: [],
      num_classes: 0,
      error: error.message
    });
  }
});

export default router;
