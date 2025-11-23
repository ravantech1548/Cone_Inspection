import sharp from 'sharp';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { rgbToLab, labToHex } from './color.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const extractTipColor = async (imagePath) => {
  const startTime = Date.now();
  
  try {
    // Classical approach: extract dominant color from center region (tip area)
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Extract center 20% region (assumed tip location)
    const centerX = Math.floor(metadata.width * 0.4);
    const centerY = Math.floor(metadata.height * 0.4);
    const regionWidth = Math.floor(metadata.width * 0.2);
    const regionHeight = Math.floor(metadata.height * 0.2);
    
    const { data, info } = await image
      .extract({ left: centerX, top: centerY, width: regionWidth, height: regionHeight })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Calculate average RGB
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
      confidence: 0.85, // Classical method confidence
      inferenceTime,
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
  
  // Get active model and prompt
  const modelResult = await query(
    'SELECT id FROM models WHERE is_active = true LIMIT 1'
  );
  const promptResult = await query(
    'SELECT id FROM prompts WHERE is_active = true LIMIT 1'
  );
  
  const modelId = modelResult.rows[0]?.id;
  const promptId = promptResult.rows[0]?.id;
  
  // Store prediction
  await query(
    `INSERT INTO predictions (image_id, model_id, prompt_id, payload, tip_mask, inference_time_ms)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      imageId,
      modelId,
      promptId,
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
