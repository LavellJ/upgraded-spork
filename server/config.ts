// Centralized configuration with Zod validation
import { z } from 'zod';

// Configuration schema with validation and defaults
const configSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  
  // Security & Authentication
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  TOKEN_TTL_DAYS: z.coerce.number().default(30),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // Application
  APP_BASE_URL: z.string().url('APP_BASE_URL must be a valid URL'),
  
  // Data Management
  RETAIN_DAYS: z.coerce.number().default(365),
  ENCRYPTION_ENABLED: z.coerce.boolean().default(true),
  
  // Email/SMTP (optional in development)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().default('noreply@learnoz.com'),
  
  // External Services (optional)
  OPENAI_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
});

// Development defaults for sensitive values
const developmentDefaults = {
  JWT_SECRET: 'dev-secret-key-change-in-production-16chars-minimum',
  DATABASE_URL: 'file:./qi.db',
  APP_BASE_URL: 'http://localhost:5000',
};

// Production requirements - these must be set explicitly
const productionRequirements = [
  'JWT_SECRET',
  'DATABASE_URL', 
  'APP_BASE_URL'
] as const;

let cachedConfig: Config | null = null;

/**
 * Get validated configuration with proper defaults and warnings
 */
export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  // Build config with environment variables and development defaults
  const rawConfig = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT,
    
    // Use development defaults if not in production
    JWT_SECRET: process.env.JWT_SECRET || (isDevelopment ? developmentDefaults.JWT_SECRET : undefined),
    TOKEN_TTL_DAYS: process.env.TOKEN_TTL_DAYS,
    
    DATABASE_URL: process.env.DATABASE_URL || (isDevelopment ? developmentDefaults.DATABASE_URL : undefined),
    
    APP_BASE_URL: process.env.APP_BASE_URL || (isDevelopment ? developmentDefaults.APP_BASE_URL : undefined),
    
    RETAIN_DAYS: process.env.RETAIN_DAYS,
    ENCRYPTION_ENABLED: process.env.ENCRYPTION_ENABLED,
    
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  };

  // Validate configuration
  try {
    cachedConfig = configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Configuration validation failed:');
      error.errors.forEach(err => {
        console.error(`  • ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }

  // Production validation - ensure required vars are set explicitly
  if (cachedConfig.NODE_ENV === 'production') {
    const missingRequired = productionRequirements.filter(key => 
      !process.env[key] || process.env[key] === developmentDefaults[key as keyof typeof developmentDefaults]
    );
    
    if (missingRequired.length > 0) {
      console.error('❌ Production deployment missing required environment variables:');
      missingRequired.forEach(key => {
        console.error(`  • ${key} must be set explicitly in production`);
      });
      process.exit(1);
    }
  }

  // Log configuration status with warnings
  logConfigStatus(cachedConfig, isDevelopment, isTest);

  return cachedConfig;
}

/**
 * Log configuration status and warnings
 */
function logConfigStatus(config: Config, isDevelopment: boolean, isTest: boolean) {
  if (isTest) {
    return; // Skip logging in test environment
  }

  console.log('⚙️  Configuration loaded:');
  console.log(`  • Environment: ${config.NODE_ENV}`);
  console.log(`  • Port: ${config.PORT}`);
  console.log(`  • Database: ${config.DATABASE_URL.includes('file:') ? 'SQLite' : 'PostgreSQL'}`);
  console.log(`  • Encryption: ${config.ENCRYPTION_ENABLED ? 'ON' : 'OFF'}`);
  console.log(`  • Retention: ${config.RETAIN_DAYS} days`);

  // Email configuration
  const emailEnabled = !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
  console.log(`  • Email: ${emailEnabled ? 'SMTP configured' : isDevelopment ? 'Preview mode (dev)' : 'DISABLED'}`);

  // External services
  if (config.OPENAI_API_KEY) {
    console.log('  • OpenAI: API key configured');
  }
  if (config.ELEVENLABS_API_KEY) {
    console.log('  • ElevenLabs: API key configured');
  }

  // Development warnings
  if (isDevelopment) {
    const warnings: string[] = [];
    
    if (config.JWT_SECRET === developmentDefaults.JWT_SECRET) {
      warnings.push('JWT_SECRET using development default');
    }
    if (config.DATABASE_URL === developmentDefaults.DATABASE_URL) {
      warnings.push('DATABASE_URL using SQLite file (dev default)');
    }
    if (config.APP_BASE_URL === developmentDefaults.APP_BASE_URL) {
      warnings.push('APP_BASE_URL using localhost (dev default)');
    }
    if (!emailEnabled) {
      warnings.push('SMTP not configured (magic links in preview mode)');
    }

    if (warnings.length > 0) {
      console.log('⚠️  Development warnings:');
      warnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }
  }
}

// Derived configuration values
export function getDerivedConfig(config: Config) {
  return {
    EMAIL_ENABLED: !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS),
    EMAIL_PREVIEW_MODE: config.NODE_ENV === 'development' && !(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS),
    IS_DEVELOPMENT: config.NODE_ENV === 'development',
    IS_PRODUCTION: config.NODE_ENV === 'production',
    IS_TEST: config.NODE_ENV === 'test',
  };
}

// Type definitions
export type Config = z.infer<typeof configSchema>;

// Legacy exports for backward compatibility (will be deprecated)
const config = getConfig();
export const JWT_SECRET = config.JWT_SECRET;
export const TOKEN_TTL_DAYS = config.TOKEN_TTL_DAYS;
export const RETAIN_DAYS = config.RETAIN_DAYS;
export const ENCRYPTION_ENABLED = config.ENCRYPTION_ENABLED;
export const SMTP_HOST = config.SMTP_HOST;
export const SMTP_PORT = config.SMTP_PORT;
export const SMTP_USER = config.SMTP_USER;
export const SMTP_PASS = config.SMTP_PASS;
export const SMTP_FROM = config.SMTP_FROM;
export const APP_BASE_URL = config.APP_BASE_URL;

const derived = getDerivedConfig(config);
export const EMAIL_ENABLED = derived.EMAIL_ENABLED;
export const EMAIL_PREVIEW_MODE = derived.EMAIL_PREVIEW_MODE;