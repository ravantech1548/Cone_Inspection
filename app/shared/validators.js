import { z } from 'zod';
import { ROLES, CLASSIFICATION, ALLOWED_MIME_TYPES } from './constants.js';

export const LoginSchema = z.object({
  username: z.string().min(3).max(255),
  password: z.string().min(6)
});

export const CreateBatchSchema = z.object({
  name: z.string().min(1).max(255).optional()
});

export const UploadImageSchema = z.object({
  batchId: z.number().int().positive(),
  filename: z.string().min(1).max(255),
  checksum: z.string().length(64),
  fileSize: z.number().int().positive(),
  mimeType: z.enum(ALLOWED_MIME_TYPES)
});

export const SelectAcceptableColorSchema = z.object({
  batchId: z.number().int().positive(),
  colorId: z.number().int().positive(),
  deltaETolerance: z.number().min(0).max(100).optional()
});

export const ClassifyBatchSchema = z.object({
  batchId: z.number().int().positive()
});

export const CreateOverrideSchema = z.object({
  imageId: z.number().int().positive(),
  newClassification: z.enum([CLASSIFICATION.GOOD, CLASSIFICATION.REJECT]),
  reason: z.string().min(1).max(500)
});

export const LABColorSchema = z.object({
  L: z.number().min(0).max(100),
  A: z.number().min(-128).max(127),
  B: z.number().min(-128).max(127)
});

export const InferenceResultSchema = z.object({
  L: z.number(),
  A: z.number(),
  B: z.number(),
  color_name: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  tip_mask: z.any().optional()
});
