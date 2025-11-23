export const errorHandler = (err, req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || 'unknown';
  
  console.error('Error:', {
    correlationId,
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  
  // Don't leak internal errors
  const message = err.statusCode ? err.message : 'Internal server error';
  
  res.status(err.statusCode || 500).json({
    error: message,
    correlationId
  });
};

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
