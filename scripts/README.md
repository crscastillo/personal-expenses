# Migration Scripts

This directory contains database migration scripts for deployment automation.

## migrate.js

Automatically runs database migrations during Vercel builds.

### How it works:

1. **During Build**: Vercel runs `npm run vercel-build`
2. **Migration Check**: The script checks for required environment variables
3. **Execution**: If configured, applies the latest migration to production database
4. **Fail-Safe**: If not configured, just logs a reminder and continues build

### Environment Variables:

#### Option 1: Direct Connection String
```bash
SUPABASE_DB_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

#### Option 2: Separate Components
```bash
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_DB_PASSWORD=your-db-password
SUPABASE_DB_REGION=us-east-1
```

#### Skip Migrations
```bash
SKIP_MIGRATIONS=true  # Skips migration during build
```

### Usage:

```bash
# Run manually
npm run migrate

# Runs automatically during Vercel build via:
npm run vercel-build  # which runs: npm run migrate && next build
```

### Security Note:

For production environments, consider:
- Running migrations manually via `npx supabase db push`
- Using GitHub Actions for controlled migration deployments
- Setting `SKIP_MIGRATIONS=true` and managing migrations separately

The auto-migration feature is optional and provided for convenience.
