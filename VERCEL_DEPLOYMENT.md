# Deploying to Vercel

This guide walks you through deploying the Personal Expenses app to Vercel with a production Supabase instance.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
3. **GitHub Repository**: Your code pushed to GitHub

## Step 1: Create Production Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a **Database Password** (save this securely)
3. Select a **Region** closest to your users
4. Wait for the project to be provisioned (~2 minutes)

## Step 2: Set Up Database Schema

You need to run your migrations on the production database **before your first deployment**.

### Option A: Push from Local (Recommended)

1. Link your local project to remote:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```
   
   Find your project ref in your Supabase project URL:
   `https://supabase.com/dashboard/project/[your-project-ref]`

2. Push your local schema to production:
   ```bash
   npx supabase db push
   ```

   Or use the npm script:
   ```bash
   npm run supabase:push
   ```

### Option B: Run Migration Manually

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/20260207000000_initial_schema.sql`
3. Paste and run it in the SQL Editor

### Migration Validation During Builds

The project includes an automatic migration validation script that runs during every Vercel deployment:

1. **Validates** that database credentials are configured
2. **Checks** that the migration file exists
3. **Provides** clear instructions if migrations haven't been applied yet

**Important**: The build script validates configuration but doesn't automatically apply migrations. You must apply migrations manually (Option A or B above) before your first deployment.

**Why?**: Running migrations manually gives you:
- Full visibility into schema changes
- Ability to review before applying
- Control over when database changes happen
- Avoid race conditions in multi-region deployments

To skip migration validation (not recommended):
```
SKIP_MIGRATIONS=true
```

## Step 3: Get Supabase Connection Details

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (the longer JWT token)

## Step 4: Deploy to Vercel

### Via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure your project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: Leave default (Vercel will use `vercel-build` script automatically)
   - **Install Command**: `npm install`

4. Add **Required Environment Variables**:
   
   Application:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   Database (for migrations) - Use EITHER Option 1 OR Option 2:
   
   **Option 1** - Connection String:
   ```
   SUPABASE_DB_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
   
   **Option 2** - Separate Variables:
   ```
   SUPABASE_PROJECT_REF=your-project-ref
   SUPABASE_DB_PASSWORD=your-db-password
   SUPABASE_DB_REGION=us-east-1
   ```
   
   Find your database credentials:
   - Go to Supabase → **Settings** → **Database** → **Connection string** → **URI**
   - Extract the project-ref, password, and region from the connection string

5. Click **Deploy**

**Note**: The `vercel-build` script will validate your database configuration before building. Migrations should be applied via `npx supabase db push` from your local machine before your first deployment.

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

## Step 5: Configure Supabase Authentication

Update your Supabase project's authentication settings:

1. Go to **Authentication** → **URL Configuration**
2. Add your Vercel domain to **Site URL**:
   ```
   https://your-app.vercel.app
   ```

3. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   ```

4. Go to **Authentication** → **Settings**
5. Set **JWT expiry limit** to `1800` seconds (30 minutes)
6. Under **Session timeouts** (if available):
   - **Timebox**: Set to 30 minutes
   - **Inactivity timeout**: Set to 30 minutes

## Step 6: Test Your Deployment

1. Visit your Vercel URL
2. Try to sign up with a new account
3. Create test data during signup
4. Verify transactions, accounts, and categories work

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key | `eyJhbGc...` (JWT token) |

## Troubleshooting

### Database Connection Issues

**Error**: `PGRST106` or `42P01` (relation does not exist)
- **Solution**: Make sure you ran the migrations (Step 2)

**Error**: `42501` (permission denied)
- **Solution**: The migrations include GRANT statements. Re-run them.

### Authentication Issues

**Error**: Redirects to wrong URL after login
- **Solution**: Update Site URL and Redirect URLs in Supabase (Step 5)

**Error**: "Invalid JWT" or "Invalid API Key"
- **Solution**: Double-check your environment variables in Vercel

### Build Failures

**Error**: Module not found
- **Solution**: Make sure all dependencies are in `package.json`, not just devDependencies

**Error**: Type errors during build
- **Solution**: Run `npm run build` locally first to catch issues

## Updating Your Deployment

### Automatic Deployments

Vercel automatically deploys when you push to your main branch.

### Manual Redeployment

```bash
vercel --prod
```

### Database Migrations

When you add new migrations:

1. **Recommended**: Push from local using Supabase CLI:
   ```bash
   npx supabase db push
   ```

2. **Or** if you set up the optional environment variables, they'll run automatically on next deploy

3. **Or** run manually in Supabase SQL Editor

## Additional Configuration

### Custom Domain

1. Go to your Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Update Supabase Auth URLs with your custom domain

### Analytics

Vercel provides built-in analytics. Enable in:
**Project Settings** → **Analytics**

### Environment-Specific Settings

Create different environments in Vercel:
- **Production**: Your main deployment
- **Preview**: Automatic preview for PRs
- **Development**: Optional separate environment

## Security Best Practices

1. ✅ **Never commit** `.env.local` to git (already in `.gitignore`)
2. ✅ **Rotate keys** if accidentally exposed
3. ✅ **Enable RLS** (Row Level Security) in production Supabase
4. ✅ **Use environment variables** for all secrets
5. ✅ **Monitor** Supabase logs for suspicious activity

## Cost Monitoring

- **Vercel**: Free tier includes hobby projects
- **Supabase**: Free tier includes:
  - 500MB database space
  - 1GB file storage
  - 2GB bandwidth
  - 50,000 monthly active users

Monitor usage in respective dashboards.

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
