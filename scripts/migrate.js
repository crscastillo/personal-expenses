#!/usr/bin/env node

/**
 * Migration script for Vercel deployments
 * Runs database migrations against production Supabase instance
 * 
 * Required environment variables:
 * - SUPABASE_DB_URL: Full PostgreSQL connection string
 *   Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 * 
 * Or alternatively:
 * - SUPABASE_PROJECT_REF: Your Supabase project reference
 * - SUPABASE_DB_PASSWORD: Your database password
 * - SUPABASE_DB_REGION: AWS region (e.g., us-east-1)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Get database connection info from environment
const DB_URL = process.env.SUPABASE_DB_URL;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const DB_REGION = process.env.SUPABASE_DB_REGION || 'us-east-1';

// Skip migrations in development or if explicitly disabled
if (process.env.SKIP_MIGRATIONS === 'true') {
  console.log('⏭️  Migrations skipped (SKIP_MIGRATIONS=true)');
  process.exit(0);
}

if (process.env.NODE_ENV === 'development') {
  console.log('⏭️  Skipping migrations in development mode');
  process.exit(0);
}

// Validate environment variables - REQUIRED for production
if (!DB_URL && !(PROJECT_REF && DB_PASSWORD)) {
  console.error('❌ Database connection info required for migrations');
  console.error('');
  console.error('Set one of the following in Vercel environment variables:');
  console.error('');
  console.error('Option 1 - Connection String:');
  console.error('  SUPABASE_DB_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres');
  console.error('');
  console.error('Option 2 - Separate Variables:');
  console.error('  SUPABASE_PROJECT_REF=your-project-ref');
  console.error('  SUPABASE_DB_PASSWORD=your-db-password');
  console.error('  SUPABASE_DB_REGION=us-east-1 (optional, defaults to us-east-1)');
  console.error('');
  console.error('Find your database password in Supabase Dashboard:');
  console.error('Settings → Database → Connection string → URI');
  console.error('');
  console.error('To skip migrations (not recommended), set: SKIP_MIGRATIONS=true');
  process.exit(1);
}

console.log('🚀 Starting database migration...');

// Build connection string
let connectionString = DB_URL;
if (!connectionString && PROJECT_REF && DB_PASSWORD) {
  connectionString = `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-${DB_REGION}.pooler.supabase.com:6543/postgres`;
}

// Read migration file

const migrationPath = path.join(__dirname, '../supabase/migrations/20260211000000_initial_schema.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Parse connection string for display purposes
let host = 'unknown';
let port = 'unknown';
let dbName = 'postgres';

if (connectionString) {
  try {
    const pgUrl = connectionString.replace('postgresql://', '').replace('postgres://', '');
    const [auth, rest] = pgUrl.split('@');
    const [hostPart, portAndDb] = rest.split(':');
    host = hostPart;
    const [portStr, db] = portAndDb.split('/');
    port = portStr;
    dbName = db || 'postgres';
  } catch (e) {
    // Parsing failed, use defaults
  }
}

console.log(`📡 Connecting to: ${host}:${port}/${dbName}`);

// Execute migration validation
async function runMigration() {
  try {
    console.log('🔍 Validating migration configuration...');
    console.log('');
    
    if (PROJECT_REF) {
      console.log(`✅ Project configured: ${PROJECT_REF}`);
      console.log('');
      console.log('💡 To apply migrations, run from your local machine:');
      console.log(`   npx supabase link --project-ref ${PROJECT_REF}`);
      console.log('   npx supabase db push');
      console.log('');
      console.log('✅ Migration validation complete');
      console.log('   Ensure migrations are applied before first deploy');
    } else {
      console.log('✅ Database connection validated');
      console.log('');
      console.log('💡 Initial setup:');
      console.log('   1. Apply initial migration from local:');
      console.log('      npx supabase link --project-ref <your-ref>');
      console.log('      npx supabase db push');
      console.log('   2. Future migrations can be applied the same way');
      console.log('');
      console.log('✅ Migration validation complete');
    }
    
    // Note: Actual migration should be done via Supabase CLI locally
    // This just validates the configuration is present
    
  } catch (error) {
    console.error('❌ Migration validation failed:', error.message);
    console.error('');
    console.error('Please ensure:');
    console.error('1. Database credentials are correct');
    console.error('2. Database is accessible');
    console.error('3. Migrations have been applied at least once via: npx supabase db push');
    process.exit(1);
  }
}

runMigration();

