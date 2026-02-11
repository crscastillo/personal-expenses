-- Reset Database Script
-- WARNING: This will delete ALL data including users and tables!
-- Run this in your Supabase SQL Editor to completely reset your database

-- Step 1: Drop all tables in public schema (in correct order to handle foreign keys)
DROP TABLE IF EXISTS public.reminders CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.plan_items CASCADE;
DROP TABLE IF EXISTS public.monthly_plans CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.expense_categories CASCADE;
DROP TABLE IF EXISTS public.expense_groups CASCADE;

-- Also drop old table names if they exist
DROP TABLE IF EXISTS public.subcategories CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.budget_items CASCADE;
DROP TABLE IF EXISTS public.monthly_budgets CASCADE;

-- Step 2: Drop views
DROP VIEW IF EXISTS public.plan_summary CASCADE;
DROP VIEW IF EXISTS public.budget_summary CASCADE;

-- Step 3: Drop functions
DROP FUNCTION IF EXISTS public.copy_plan_from_previous_month(UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.copy_budget_from_previous_month(UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Step 4: Drop the schema
DROP SCHEMA IF EXISTS public CASCADE;

-- Step 5: Clear migration history (optional - only if you want to track from scratch)
-- DELETE FROM supabase_migrations.schema_migrations WHERE version LIKE '2026%';

-- Now you're ready to run the new migration!
-- After running this script:
-- 1. Go to the SQL Editor
-- 2. Copy and run the contents of: supabase/migrations/20260211000000_initial_schema.sql
