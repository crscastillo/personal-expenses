import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AccountService } from '@/lib/services/AccountService'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('[API /accounts GET] Auth error:', authError)
      return NextResponse.json({ error: 'Authentication failed', details: authError.message }, { status: 401 })
    }

    if (!user) {
      console.error('[API /accounts GET] No user found in session')
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }

    console.log('[API /accounts GET] Loading accounts for user:', user.id)

    const accountService = new AccountService(supabase)
    const accounts = await accountService.getAccounts(user.id)

    console.log('[API /accounts GET] Successfully loaded', accounts.length, 'accounts')
    return NextResponse.json(accounts)
  } catch (error: any) {
    console.error('[API /accounts GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const accountService = new AccountService(supabase)
    const account = await accountService.createAccount(user.id, body)

    return NextResponse.json(account, { status: 201 })
  } catch (error: any) {
    console.error('Error creating account:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    const accountService = new AccountService(supabase)
    const account = await accountService.updateAccount(id, user.id, updates)

    return NextResponse.json(account)
  } catch (error: any) {
    console.error('Error updating account:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    const accountService = new AccountService(supabase)
    await accountService.deleteAccount(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
