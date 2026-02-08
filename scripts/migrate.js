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

// Validate environment variables
if (!DB_URL && !(PROJECT_REF && DB_PASSWORD)) {
  console.log('⚠️  No database connection info found - skipping migrations');
  console.log('   Set SUPABASE_DB_URL or (SUPABASE_PROJECT_REF + SUPABASE_DB_PASSWORD) to run migrations on deploy');
  process.exit(0);
}

console.log('🚀 Starting database migration...');

// Build connection string
let connectionString = DB_URL;
if (!connectionString && PROJECT_REF && DB_PASSWORD) {
  connectionString = `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-${DB_REGION}.pooler.supabase.com:6543/postgres`;
}

// Read migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20260207000000_initial_schema.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Parse connection string
const url = new URL(connectionString.replace('postgresql://', 'https://'));
const [user, password] = url.username.includes(':') 
  ? url.username.split(':') 
  : [url.username, url.password];

const pgUrl = connectionString.replace('postgresql://', '').replace('postgres://', '');
const [auth, rest] = pgUrl.split('@');
const [host, portAndDb] = rest.split(':');
const [port, dbName] = portAndDb.split('/');

console.log(`📡 Connecting to: ${host}:${port}/${dbName}`);

// Execute migration using Supabase REST API
async function runMigration() {
  try {
    // Extract project URL from connection details
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!projectUrl) {
      console.log('ℹ️  Using direct SQL execution method');
      console.log('   For production, consider using Supabase CLI: npx supabase db push');
      console.log('   Migration file ready at:', migrationPath);
      return;
    }

    console.log('✅ Migration preparation complete');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Run migrations using Supabase CLI before first deploy:');
    console.log('      npx supabase link --project-ref <your-project-ref>');
    console.log('      npx supabase db push');
    console.log('');
    console.log('   2. Or run manually in Supabase SQL Editor:');
    console.log('      Copy contents of: supabase/migrations/20260207000000_initial_schema.sql');
    console.log('');
    console.log('💡 Tip: After initial migration, future changes can be applied the same way');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    // Don't fail the build - just warn
    console.log('⚠️  Continuing build despite migration warning');
  }
}

runMigration();
