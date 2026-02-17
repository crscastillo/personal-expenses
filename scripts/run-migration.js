#!/usr/bin/env node

/**
 * One-time migration runner
 * Marks all existing expense categories and groups as user-customizable
 */

const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Running migration: Mark all categories as custom...\n');

  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    process.exit(1);
  }

  console.log(`📡 Connecting to: ${supabaseUrl}`);

  try {
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Update expense_categories
    console.log('\n1️⃣  Updating expense_categories...');
    const { data: categoriesData, error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: `UPDATE public.expense_categories SET is_custom = true WHERE is_custom = false`
    });

    if (categoriesError) {
      // Try direct update instead
      const { count: categoriesCount, error: directCatError } = await supabase
        .from('expense_categories')
        .update({ is_custom: true })
        .eq('is_custom', false)
        .select('*', { count: 'exact', head: true });

      if (directCatError) {
        console.error('❌ Failed to update categories:', directCatError);
        throw directCatError;
      }
      console.log(`✅ Updated ${categoriesCount || 0} expense categories`);
    } else {
      console.log('✅ Expense categories updated');
    }

    // Step 2: Update expense_groups
    console.log('\n2️⃣  Updating expense_groups...');
    const { count: groupsCount, error: groupsError } = await supabase
      .from('expense_groups')
      .update({ is_system: false })
      .eq('is_system', true)
      .select('*', { count: 'exact', head: true });

    if (groupsError) {
      console.error('❌ Failed to update groups:', groupsError);
      throw groupsError;
    }
    console.log(`✅ Updated ${groupsCount || 0} expense groups`);

    console.log('\n✨ Migration completed successfully!\n');
    console.log('All expense categories and groups are now user-customizable.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration();
