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

// Email/SMTP configuration
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const SMTP_FROM = process.env.SMTP_FROM || 'noreply@learnoz.com';

// App configuration
export const APP_BASE_URL = process.env.APP_BASE_URL || (
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://your-app.replit.app'
);

// Email configuration helpers
export const EMAIL_ENABLED = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
export const EMAIL_PREVIEW_MODE = process.env.NODE_ENV === 'development' && !EMAIL_ENABLED;