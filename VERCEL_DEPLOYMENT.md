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

You need to run your migrations on the production database.

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

### Option B: Run Migration Manually

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/20260207000000_initial_schema.sql`
3. Paste and run it in the SQL Editor

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
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`

4. Add **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. Click **Deploy**

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

```bash
# From local, push to production
npx supabase db push
```

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
