# Local Development with Supabase

This app is configured to run **entirely locally** using Docker and Supabase CLI.

## Prerequisites

✅ **Docker Desktop** must be installed and running
- Download from [docker.com](https://www.docker.com/products/docker-desktop/)
- Start Docker Desktop before proceeding

## Quick Start

### 1. Start Local Supabase

```bash
npm run supabase:start
```

This will:
- Pull Docker images (first time only, ~2-3 minutes)
- Start PostgreSQL database
- Start all Supabase services (Auth, Storage, REST API, etc.)
- Apply your database schema automatically
- Display connection details

### 2. Start the App

In a **new terminal**:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Supabase Dashboard

Access the local Studio dashboard:
**http://127.0.0.1:54323**

Here you can:
- View/edit database tables
- Run SQL queries
- Manage authentication
- View logs

## Authentication

**Email confirmation is disabled by default** for local development. Users can sign up and immediately access the app without email verification.

Configuration is in `supabase/config.toml`:
```toml
[auth.email]
enable_confirmations = false  # No email needed
```

To test email flows, access the local email inbox at **http://127.0.0.1:54324**

For more details on authentication configuration, see [AUTH_CONFIGURATION.md](AUTH_CONFIGURATION.md).

## Connection Details

Your `.env.local` is already configured with:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Useful Commands

```bash
# Start Supabase (if stopped)
npm run supabase:start

# Stop Supabase
npm run supabase:stop

# Restart Supabase
npm run supabase:restart

# Reset database (WARNING: deletes all data)
npm run supabase:reset

# Check status
npm run supabase:status
```

## Database Schema

Your database schema is automatically applied from:
```
supabase/migrations/20260211000000_initial_schema.sql
```

This includes:
- All tables (categories, accounts, plans, transactions, etc.)
- Row Level Security policies
- Predefined categories and subcategories
- Helper functions and views

## Making Database Changes

### Option 1: Add a Migration (Recommended)

```bash
# Create a new migration
npx supabase migration new add_my_feature

# Edit the created file in supabase/migrations/
# Then reset to apply
npm run supabase:reset
```

### Option 2: Use Studio SQL Editor

1. Go to http://127.0.0.1:54323
2. Click "SQL Editor"
3. Write and run your SQL
4. To persist changes, save to a migration file

## Troubleshooting

### "Docker not running"
- Make sure Docker Desktop is open and running
- Check the Docker icon in your system tray/menu bar

### "Port already in use"
- Stop Supabase: `npm run supabase:stop`
- Check for other services using ports 54321-54324
- Restart Supabase: `npm run supabase:start`

### "Database errors"
- Reset database: `npm run supabase:reset`
- This will wipe data and reapply all migrations

### "Lost connection"
- Check if Docker is still running
- Restart Supabase: `npm run supabase:restart`

## Data Persistence

Your data is stored in Docker volumes and persists between restarts.

To completely wipe everything:
```bash
npm run supabase:stop
npx supabase stop --no-backup
```

## Development Workflow

1. **Start of day:**
   ```bash
   # Start Supabase (if not running)
   npm run supabase:start
   
   # Start Next.js
   npm run dev
   ```

2. **During development:**
   - App auto-reloads on code changes
   - Database changes require migrations
   - Use Studio dashboard to inspect data

3. **End of day:**
   ```bash
   # Stop Supabase (optional, can leave running)
   npm run supabase:stop
   ```

## Switching to Cloud Supabase

If you later want to use cloud Supabase instead:

1. Create a project at [supabase.com](https://supabase.com)
2. Update `.env.local` with your cloud URL and keys
3. Run the migration in the cloud SQL Editor:
   ```bash
   # Copy the migration file contents
   cat supabase/migrations/20260211000000_initial_schema.sql
   ```
4. Paste and run in Supabase Cloud SQL Editor

## Production Deployment

For production (Vercel, etc.):
- Use cloud Supabase (not local)
- Set environment variables in your hosting platform
- Never expose local Supabase to the internet

## Resources

- **Supabase Docs:** https://supabase.com/docs
- **CLI Reference:** https://supabase.com/docs/reference/cli
- **Docker Docs:** https://docs.docker.com

## Summary

✅ No cloud account needed  
✅ No internet required  
✅ Complete local development  
✅ Free and fast  
✅ Easy to reset and experiment
