# Database Reset Guide

## What Was Done

1. **Consolidated Migrations**: All previous migrations have been backed up to `supabase/migrations/backup/` and replaced with a single consolidated migration: `20260211000000_initial_schema.sql`

2. **Updated Schema**: The `supabase/schema.sql` file now matches the new migration exactly.

3. **Final Schema Structure**:
   - `expense_groups` (formerly categories) - per-user expense groups
   - `expense_categories` (formerly subcategories) - per-user categories within groups
   - `accounts` (with `include_in_plan` column)
   - `monthly_plans` (formerly monthly_budgets)
   - `plan_items` (formerly budget_items, references expense_categories)
   - `transactions` (references expense_categories)
   - `reminders` (references plan_items)

## How to Reset Your Supabase Cloud Database

### Step 1: Access Supabase SQL Editor

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Drop All Existing Data

1. Create a new query in the SQL Editor
2. Copy and paste the contents of `supabase/reset_database.sql`
3. Click **Run** to execute
4. This will delete:
   - All tables in the `public` schema
   - All views, functions, and the schema itself
   - Optionally: migration history (commented out by default)

⚠️ **WARNING**: This will permanently delete ALL user data and tables!

### Step 3: Run the New Migration

1. In the SQL Editor, create a new query
2. Copy and paste the entire contents of `supabase/migrations/20260211000000_initial_schema.sql`
3. Click **Run** to execute
4. This will create:
   - The `public` schema
   - All tables with proper constraints
   - All indexes for performance
   - All RLS policies for security
   - All functions and views

### Step 4: Verify the Migration

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- accounts
- expense_categories
- expense_groups
- monthly_plans
- plan_items
- reminders
- transactions

### Step 5: Test with Your App

1. Start your Next.js app: `npm run dev`
2. Sign up for a new account
3. Verify that default expense groups and categories are created

## Alternative: Using Supabase CLI

If you prefer using the CLI:

```bash
# Make sure you're logged in to Supabase
npx supabase login

# Link to your remote project (if not already linked)
npx supabase link --project-ref your-project-ref

# Reset the remote database (WARNING: Deletes all data!)
npx supabase db reset --linked

# The reset command will automatically run all migrations in supabase/migrations/
```

## Local Development Database

If you also want to reset your local Supabase database:

```bash
# Stop local Supabase
npm run supabase:stop

# Reset local database (deletes all data and reruns migrations)
npx supabase db reset

# Start local Supabase
npm run supabase:start
```

The local reset will automatically run the new consolidated migration.

## Backup Information

- Old migrations are saved in: `supabase/migrations/backup/`
- You can review them if needed, but they are no longer used
- The new consolidated migration incorporates all changes from the old migrations

## What Changed

### Table Renames
- `categories` → `expense_groups`
- `subcategories` → `expense_categories`
- `monthly_budgets` → `monthly_plans`
- `budget_items` → `plan_items`

### Column Renames
- `category_id` → `expense_group_id`
- `subcategory_id` → `expense_category_id`
- `budget_id` → `plan_id`
- `budget_item_id` → `plan_item_id`
- `include_in_budget` → `include_in_plan`

### New Features
- All tables are now per-user (expense_groups and expense_categories have user_id)
- Proper RLS policies for multi-user support
- Updated indexes for better performance
- Consolidated schema for easier maintenance

## Next Steps

After resetting the database:

1. Sign up for a new account in your app
2. The default expense groups and categories will be created automatically
3. Create your first account
4. Add some transactions
5. Create your first monthly plan

## Troubleshooting

### If you see foreign key errors:
- Make sure you ran the reset script first to drop all tables
- Run the new migration in a fresh state

### If RLS policies block access:
- Make sure you're logged in
- Check that the `auth.uid()` function returns your user ID:
  ```sql
  SELECT auth.uid();
  ```

### If tables already exist:
- Run the reset script again
- Make sure all old tables are dropped before running the migration

## Questions?

If you encounter issues, check:
1. The Supabase project logs (Logs & Analytics section)
2. Browser console for any errors
3. Network tab to see failed requests
