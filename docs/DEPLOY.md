# LearnOz Deployment Guide

This guide covers environment setup, secrets management, and deployment steps for LearnOz.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Email/SMTP Configuration](#emailsmtp-configuration)
- [External Services](#external-services)
- [Backup & Retention](#backup--retention)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Database Migration](#database-migration)
- [Security Considerations](#security-considerations)

## Environment Variables

### Required Variables

These environment variables are **required** for production deployment:

```bash
# Application Environment
NODE_ENV=production
PORT=5000

# Security & Authentication
JWT_SECRET=your-secure-jwt-secret-at-least-16-characters-long

# Database Connection
DATABASE_URL=postgresql://username:password@host:port/database

# Application Base URL  
APP_BASE_URL=https://your-app.replit.app
```

### Optional Variables

```bash
# Data Management
RETAIN_DAYS=365                # Days to retain user data (default: 365)
ENCRYPTION_ENABLED=true       # Enable data encryption (default: true)

# Email/SMTP (required for magic links in production)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@learnoz.com

# External Services
OPENAI_API_KEY=sk-your-openai-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Client-side Environment (must be prefixed with VITE_)
VITE_APP_BASE_URL=https://your-app.replit.app
VITE_CLOUD_ENDPOINT=https://your-app.replit.app/api
```

## Database Setup

### PostgreSQL (Production)

1. **Provision a PostgreSQL database:**
   - Use Replit's built-in database or external provider (Neon, Supabase, etc.)
   - Note the connection URL in format: `postgresql://user:pass@host:port/db`

2. **Set environment variable:**
   ```bash
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

3. **Run database migrations:**
   ```bash
   npm run db:push
   ```

### SQLite (Development)

For local development, the app will use SQLite by default:

```bash
DATABASE_URL=file:./qi.db
```

## Email/SMTP Configuration

Email is required for magic link authentication in production.

### Supported Providers

- **Gmail**: Use App Passwords with 2FA enabled
- **SendGrid**: Use API key as password
- **Mailgun**: Use SMTP credentials
- **Amazon SES**: Use SMTP credentials

### Example Configuration

```bash
# Gmail Example
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# SendGrid Example  
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

## External Services

### OpenAI (Optional)

Used for AI-powered question generation and explanations:

1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Set environment variable:
   ```bash
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

### ElevenLabs (Optional)

Used for text-to-speech functionality:

1. Get API key from [ElevenLabs](https://elevenlabs.io/)
2. Set environment variable:
   ```bash
   ELEVENLABS_API_KEY=your-elevenlabs-api-key
   ```

## Backup & Retention

The application includes automated backup and data retention features:

### Backup Configuration

- **Schedule**: Daily backups at 02:30 UTC
- **Format**: Compressed SQLite snapshots (`.gz`)
- **Location**: `.backups/` directory
- **Retention**: 14 days (configurable)

### Backup Management

```bash
# Manual backup
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" /api/admin/backups/create

# List backups
curl -H "Authorization: Bearer $ADMIN_TOKEN" /api/admin/backups

# Run retention cleanup
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" /api/admin/retention/run
```

### Retention Configuration

```bash
RETAIN_DAYS=365  # Days to retain user data (default: 365)
```

## Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository>
   cd learnoz
   npm install
   ```

2. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure environment:**
   - Edit `.env.local` with your settings
   - Use development defaults for testing

4. **Start development server:**
   ```bash
   npm run dev
   ```

The app will start with configuration warnings for development defaults.

## Production Deployment

### 1. Environment Setup

Create a `.env` file with all required variables:

```bash
NODE_ENV=production
JWT_SECRET=your-secure-secret-key
DATABASE_URL=postgresql://...
APP_BASE_URL=https://your-app.replit.app
# ... other required variables
```

### 2. Database Migration

```bash
# Push schema to production database
npm run db:push

# Or force push if needed (⚠️  destroys data)
npm run db:push --force
```

### 3. Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

### 4. Health Check

Verify deployment:

```bash
# Check configuration
curl https://your-app.replit.app/api/health

# Verify auth endpoint
curl https://your-app.replit.app/api/auth/status
```

## Database Migration

### Development to Production

1. **Export development data:**
   ```bash
   # SQLite to SQL dump
   sqlite3 qi.db .dump > data.sql
   ```

2. **Import to PostgreSQL:**
   ```bash
   # Convert and import (may need manual adjustment)
   psql $DATABASE_URL < data.sql
   ```

3. **Run schema updates:**
   ```bash
   npm run db:push
   ```

### Schema Changes

When modifying the database schema:

1. **Update schema:**
   - Edit `shared/schema.ts`
   - Add new models/fields

2. **Push changes:**
   ```bash
   npm run db:push  # Development
   npm run db:push --force  # Production (⚠️  destructive)
   ```

## Security Considerations

### Required Security Measures

1. **Strong JWT Secret:**
   - Minimum 16 characters
   - Use cryptographically secure random string
   - Never use development defaults in production

2. **Database Security:**
   - Use connection pooling
   - Enable SSL for PostgreSQL connections
   - Restrict database access to application only

3. **Environment Variables:**
   - Never commit secrets to version control
   - Use Replit's secrets management
   - Rotate secrets regularly

4. **HTTPS:**
   - Always use HTTPS in production
   - Replit provides automatic SSL certificates

### Configuration Validation

The application validates configuration on startup:

- ✅ **Valid**: All required variables set correctly
- ⚠️  **Warning**: Using development defaults
- ❌ **Error**: Missing required variables (exits with error)

### Example Startup Logs

```
⚙️  Configuration loaded:
  • Environment: production
  • Port: 5000
  • Database: PostgreSQL
  • Encryption: ON
  • Retention: 365 days
  • Email: SMTP configured
  • OpenAI: API key configured
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify `DATABASE_URL` format and credentials
   - Check database server accessibility
   - Ensure database exists

2. **Email Not Working**
   - Verify SMTP credentials
   - Check firewall/security settings
   - Test with curl or email client

3. **Configuration Validation Errors**
   - Check environment variable names (case-sensitive)
   - Verify URL formats include protocol
   - Ensure JWT_SECRET is at least 16 characters

### Log Analysis

```bash
# View application logs
tail -f logs/app.log

# Check backup logs
grep "backup" logs/app.log

# Monitor cron jobs
grep "cron" logs/app.log
```

For additional support, refer to the application logs and audit trail for detailed error information.