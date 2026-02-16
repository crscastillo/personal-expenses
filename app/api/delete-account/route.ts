import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const userId = user.id
    console.log('[DELETE ACCOUNT] Starting account deletion for user:', userId)

    try {
      // Delete all user data explicitly (though CASCADE will handle it)
      // This is more explicit and gives us better logging
      console.log('[DELETE ACCOUNT] Deleting user reminders...')
      await supabase.from('reminders').delete().eq('user_id', userId)

      console.log('[DELETE ACCOUNT] Deleting user transactions...')
      await supabase.from('transactions').delete().eq('user_id', userId)
      
      console.log('[DELETE ACCOUNT] Deleting user monthly plans (with plan items)...')
      await supabase.from('monthly_plans').delete().eq('user_id', userId)
      
      console.log('[DELETE ACCOUNT] Deleting user accounts...')
      await supabase.from('accounts').delete().eq('user_id', userId)
      
      console.log('[DELETE ACCOUNT] Deleting user expense categories...')
      await supabase.from('expense_categories').delete().eq('user_id', userId)
      
      console.log('[DELETE ACCOUNT] Deleting user expense groups...')
      await supabase.from('expense_groups').delete().eq('user_id', userId)

      console.log('[DELETE ACCOUNT] All user data deleted successfully')
    } catch (dataError) {
      console.error('[DELETE ACCOUNT] Error deleting user data:', dataError)
      // Continue anyway - the CASCADE will clean up when we delete the auth user
    }

    // Use admin client to delete the auth user
    // This requires SUPABASE_SERVICE_ROLE_KEY environment variable
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('[DELETE ACCOUNT] Deleting auth user with admin client...')
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
      
      if (deleteError) {
        console.error('[DELETE ACCOUNT] Error deleting auth user:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete user account', details: deleteError.message },
          { status: 500 }
        )
      }

      console.log('[DELETE ACCOUNT] Auth user deleted successfully')
    } else {
      console.error('[DELETE ACCOUNT] SUPABASE_SERVICE_ROLE_KEY not configured')
      // Sign out the user at least
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Service role key not configured. Please delete your account from Supabase dashboard.' },
        { status: 500 }
      )
    }

    // Sign out the user
    await supabase.auth.signOut()
    
    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[DELETE ACCOUNT] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
