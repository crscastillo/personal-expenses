-- Migration: Mark all expense categories as custom (user-editable)
-- Date: 2026-02-17
-- Description: Updates all existing expense categories to be user-customizable
-- This allows users to delete/modify any category, including those created during signup

-- Update all expense categories to be marked as custom (user-modifiable)
UPDATE public.expense_categories
SET is_custom = true
WHERE is_custom = false;

-- Update all expense groups to be marked as non-system (user-modifiable)
UPDATE public.expense_groups
SET is_system = false
WHERE is_system = true;

COMMENT ON COLUMN public.expense_categories.is_custom IS 'Always true - all categories are user-customizable';
COMMENT ON COLUMN public.expense_groups.is_system IS 'Always false - all groups are user-customizable';
