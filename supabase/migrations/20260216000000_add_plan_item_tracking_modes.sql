-- Migration: Add tracking modes to plan items
-- Date: 2026-02-16
-- Description: Adds support for automatic and manual tracking modes for plan items

-- Add tracking_mode column
ALTER TABLE public.plan_items 
ADD COLUMN tracking_mode TEXT NOT NULL DEFAULT 'automatic' 
CHECK (tracking_mode IN ('automatic', 'manual'));

-- Add completed_amount column for manual tracking
ALTER TABLE public.plan_items 
ADD COLUMN completed_amount DECIMAL(12, 2) DEFAULT 0;

-- Add is_completed column for manual tracking
ALTER TABLE public.plan_items 
ADD COLUMN is_completed BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN public.plan_items.tracking_mode IS 'automatic: track via transaction categories, manual: manually check off as done';
COMMENT ON COLUMN public.plan_items.completed_amount IS 'For manual tracking: amount marked as completed';
COMMENT ON COLUMN public.plan_items.is_completed IS 'For manual tracking: whether item is fully completed';
