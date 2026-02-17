#!/usr/bin/env node

/**
 * Check database state
 */

const path = require('path');

async function checkDatabase() {
  console.log('🔍 Checking database state...\n');

  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check expense_categories
    const { data: categories, error: catError, count: catCount } = await supabase
      .from('expense_categories')
      .select('id, name, is_custom', { count: 'exact' })
      .limit(5);

    if (catError) {
      console.error('❌ Error fetching categories:', catError.message);
    } else {
      console.log(`📊 Expense Categories: ${catCount || 0} total`);
      if (categories && categories.length > 0) {
        console.log('\nSample categories:');
        categories.forEach(cat => {
          console.log(`  - ${cat.name}: is_custom=${cat.is_custom}`);
        });
        
        const customCount = categories.filter(c => c.is_custom).length;
        const nonCustomCount = categories.filter(c => !c.is_custom).length;
        console.log(`\n  Custom: ${customCount}, Non-custom: ${nonCustomCount} (in sample)`);
      }
    }

    // Check expense_groups
    const { data: groups, error: grpError, count: grpCount } = await supabase
      .from('expense_groups')
      .select('id, name, is_system', { count: 'exact' })
      .limit(5);

    if (grpError) {
      console.error('\n❌ Error fetching groups:', grpError.message);
    } else {
      console.log(`\n📊 Expense Groups: ${grpCount || 0} total`);
      if (groups && groups.length > 0) {
        console.log('\nSample groups:');
        groups.forEach(grp => {
          console.log(`  - ${grp.name}: is_system=${grp.is_system}`);
        });
      }
    }

    // Check users
    const { count: userCount } = await supabase
      .from('expense_categories')
      .select('user_id', { count: 'exact', head: true });

    console.log(`\n👥 Database has records from ${userCount || 0} user(s)\n`);

  } catch (error) {
    console.error('\n❌ Check failed:', error.message);
    process.exit(1);
  }
}

checkDatabase();
