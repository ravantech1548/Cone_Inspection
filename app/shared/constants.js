export const ROLES = {
  INSPECTOR: 'inspector',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin'
};

export const BATCH_STATUS = {
  UPLOADING: 'uploading',
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  CLASSIFIED: 'classified',
  FINALIZED: 'finalized'
};

export const CLASSIFICATION = {
  PENDING: 'pending',
  GOOD: 'good',
  REJECT: 'reject'
};

export const MIME_TYPES = {
  JPEG: 'image/jpeg',
  PNG: 'image/png'
};

export const ALLOWED_MIME_TYPES = [MIME_TYPES.JPEG, MIME_TYPES.PNG];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_BATCH_SIZE = 100;
export const DEFAULT_DELTA_E_TOLERANCE = 10.0;
export const INFERENCE_TIMEOUT = 3000; // 3s
