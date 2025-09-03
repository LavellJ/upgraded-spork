// Server configuration
export const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'development' 
    ? 'dev-secret-key-change-in-production' 
    : (() => { throw new Error('JWT_SECRET environment variable is required in production'); })()
);

export const TOKEN_TTL_DAYS = 30;

// Data retention configuration
export const RETAIN_DAYS = parseInt(process.env.RETAIN_DAYS || '365', 10);

// Encryption configuration
export const ENCRYPTION_ENABLED = process.env.ENCRYPTION_ENABLED !== 'false'; // Default: enabled