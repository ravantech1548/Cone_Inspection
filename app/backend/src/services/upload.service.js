import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { AppError } from '../middleware/errorHandler.js';

export const computeChecksum = async (filePath) => {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

export const validateImageFile = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    };
  } catch (error) {
    throw new AppError('Invalid image file', 400);
  }
};

export const saveImage = async (batchId, file, originalFilename) => {
  const uploadDir = path.join(config.upload.dir, batchId.toString());
  await fs.mkdir(uploadDir, { recursive: true });
  
  const ext = path.extname(originalFilename);
  const filename = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
  const filePath = path.join(uploadDir, filename);
  
  await fs.writeFile(filePath, file);
  
  const checksum = await computeChecksum(filePath);
  const metadata = await validateImageFile(filePath);
  const stats = await fs.stat(filePath);
  
  // Check for duplicate
  const existing = await query(
    'SELECT id, filename FROM images WHERE checksum = $1',
    [checksum]
  );
  
  if (existing.rows.length > 0) {
    await fs.unlink(filePath);
    return {
      isDuplicate: true,
      existingImage: existing.rows[0]
    };
  }
  
  const result = await query(
    `INSERT INTO images (batch_id, filename, original_filename, checksum, file_path, 
     file_size, mime_type, width, height, classification)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      batchId,
      filename,
      originalFilename,
      checksum,
      filePath,
      stats.size,
      `image/${metadata.format}`,
      metadata.width,
      metadata.height,
      'pending'
    ]
  );
  
  return {
    isDuplicate: false,
    image: result.rows[0]
  };
};
