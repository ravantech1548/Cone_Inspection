// SSE event types and schemas
export const SSE_EVENTS = {
  UPLOAD_PROGRESS: 'upload:progress',
  UPLOAD_COMPLETE: 'upload:complete',
  UPLOAD_ERROR: 'upload:error',
  INFERENCE_START: 'inference:start',
  INFERENCE_PROGRESS: 'inference:progress',
  INFERENCE_COMPLETE: 'inference:complete',
  INFERENCE_ERROR: 'inference:error',
  CLASSIFY_COMPLETE: 'classify:complete'
};

export const createSSEMessage = (event, data) => {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
};
