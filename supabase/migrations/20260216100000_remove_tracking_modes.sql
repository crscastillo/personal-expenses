-- Migration: Remove tracking modes from plan items
-- Date: 2026-02-16
-- Description: Removes tracking_mode and completed_amount columns. 
-- All items now track via transactions with optional manual completion override.

-- Drop tracking_mode column
ALTER TABLE public.plan_items 
DROP COLUMN IF EXISTS tracking_mode;

-- Drop completed_amount column
ALTER TABLE public.plan_items 
DROP COLUMN IF EXISTS completed_amount;

-- Update comment on is_completed to reflect new usage
COMMENT ON COLUMN public.plan_items.is_completed IS 'Manual completion override: when true, marks item as complete regardless of transaction amounts';
