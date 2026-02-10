# Migration Scripts

This directory contains database migration scripts for deployment automation.

## migrate.js

Validates database configuration during Vercel builds and ensures migrations are properly set up.

### How it works:

1. **During Build**: Vercel runs `npm run vercel-build`
2. **Validation**: The script validates that database credentials are configured
3. **Check**: Verifies that migration files exist
4. **Fail-Fast**: If credentials are missing, the build fails with clear instructions

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

**Migrations are validated but not auto-applied** for security and control:

✅ **Recommended Workflow:**
1. Develop locally with `npm run dev` and local Supabase
2. Create/modify migrations in `supabase/migrations/`
3. Test locally with `npm run supabase:reset`
4. Push to production: `npx supabase db push`
5. Deploy to Vercel (build validates configuration)

✅ **Why not auto-apply?**
- Full visibility and control over schema changes
- Avoid race conditions in deployments
- Review before applying
- Separate concerns: code deploy vs database changes

🔒 The build will fail if database credentials aren't configured, ensuring you don't deploy without proper migration setup.
