import sharp from 'sharp';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { rgbToLab, labToHex } from './color.service.js';
import { AppError } from '../middleware/errorHandler.js';

// Call Python YOLO inference service
const callYOLOInference = async (imagePath) => {
  try {
    console.log('[YOLO] Calling inference service:', config.inference.serviceUrl);
    console.log('[YOLO] Image path:', imagePath);
    
    // Temporarily disable SSL verification for self-signed certificates
    const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const response = await fetch(`${config.inference.serviceUrl}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        image_path: imagePath,
        confidence_threshold: 0.3  // Lowered from 0.7
      }),
      signal: AbortSignal.timeout(config.inference.timeout)
    });
    
    // Restore original setting
    if (originalRejectUnauthorized !== undefined) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
    } else {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    }
    
    console.log('[YOLO] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[YOLO] Error response:', errorText);
      throw new Error(`Inference service returned ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('[YOLO] Inference result:', result);
    
    return result;
  } catch (error) {
    console.error('[YOLO] Inference failed:', error.message);
    console.error('[YOLO] Falling back to classical method');
    return null;
  }
};

export const extractTipColor = async (imagePath) => {
  const startTime = Date.now();
  
  try {
    // Try YOLO model first
    const yoloResult = await callYOLOInference(imagePath);
    
    if (yoloResult && !yoloResult.error && yoloResult.predicted_class) {
      // Map YOLO class to approximate LAB color for visualization
      // This mapping supports your classes: green_brown, brown_purple_ring, brown_plain
      const classToColor = {
        'green_brown': { L: 55, A: -20, B: 15 },
        'green': { L: 60, A: -30, B: 20 },
        'brown_purple_ring': { L: 50, A: 10, B: 5 },
        'brown_plain': { L: 50, A: 10, B: 20 },
        'brown': { L: 50, A: 10, B: 20 },
        'beige': { L: 75, A: 5, B: 15 },
        'striped': { L: 65, A: 0, B: 10 },
        'white': { L: 90, A: 0, B: 0 }
      };
      
      // Normalize class name (handle underscores and case)
      const normalizedClass = yoloResult.predicted_class.toLowerCase().replace(/\s+/g, '_');
      const lab = classToColor[normalizedClass] || { L: 50, A: 0, B: 0 };
      const hex = labToHex(lab);
      
      return {
        lab,
        hex,
        confidence: yoloResult.confidence,
        inferenceTime: yoloResult.inference_time_ms,
        predictedClass: yoloResult.predicted_class,
        allClasses: yoloResult.all_classes,
        method: 'yolo',
        tipMask: null
      };
    }
    
    // Fallback to classical approach
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    const centerX = Math.floor(metadata.width * 0.4);
    const centerY = Math.floor(metadata.height * 0.4);
    const regionWidth = Math.floor(metadata.width * 0.2);
    const regionHeight = Math.floor(metadata.height * 0.2);
    
    const { data, info } = await image
      .extract({ left: centerX, top: centerY, width: regionWidth, height: regionHeight })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    let r = 0, g = 0, b = 0;
    const pixelCount = info.width * info.height;
    
    for (let i = 0; i < data.length; i += info.channels) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    
    r = Math.round(r / pixelCount);
    g = Math.round(g / pixelCount);
    b = Math.round(b / pixelCount);
    
    const lab = rgbToLab(r, g, b);
    const hex = labToHex(lab);
    
    const inferenceTime = Date.now() - startTime;
    
    return {
      lab,
      hex,
      confidence: 0.85,
      inferenceTime,
      method: 'classical',
      tipMask: { centerX, centerY, width: regionWidth, height: regionHeight }
    };
  } catch (error) {
    throw new AppError(`Inference failed: ${error.message}`, 500);
  }
};

export const runInferenceOnImage = async (imageId) => {
  const imageResult = await query(
    'SELECT id, file_path FROM images WHERE id = $1',
    [imageId]
  );
  
  if (imageResult.rows.length === 0) {
    throw new AppError('Image not found', 404);
  }
  
  const image = imageResult.rows[0];
  const result = await extractTipColor(image.file_path);
  
  // Get active model
  const modelResult = await query(
    'SELECT id FROM models WHERE is_active = true LIMIT 1'
  );
  
  const modelId = modelResult.rows[0]?.id;
  
  // Store prediction (prompt_id is nullable, not used with YOLO)
  // Use ON CONFLICT to update if prediction already exists for this image
  await query(
    `INSERT INTO predictions (image_id, model_id, prompt_id, payload, tip_mask, inference_time_ms)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (image_id) DO UPDATE SET
       model_id = EXCLUDED.model_id,
       payload = EXCLUDED.payload,
       tip_mask = EXCLUDED.tip_mask,
       inference_time_ms = EXCLUDED.inference_time_ms,
       created_at = CURRENT_TIMESTAMP`,
    [
      imageId,
      modelId,
      null, // prompt_id not used with YOLO
      JSON.stringify(result.lab),
      JSON.stringify(result.tipMask),
      result.inferenceTime
    ]
  );
  
  // Update image with LAB and hex
  await query(
    `UPDATE images SET lab_color = $1, hex_color = $2, confidence = $3
     WHERE id = $4`,
    [JSON.stringify(result.lab), result.hex, result.confidence, imageId]
  );
  
  return result;
};
