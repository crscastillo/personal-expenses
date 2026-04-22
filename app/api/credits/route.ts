import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreditService } from '@/lib/services/CreditService'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    const creditService = new CreditService(supabase)

    if (id) {
      const credit = await creditService.getCreditById(id, user.id)
      return NextResponse.json(credit)
    }

    const credits = await creditService.getCredits(user.id)
    return NextResponse.json(credits)
  } catch (error) {
    console.error('Error fetching credits:', error)
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const creditService = new CreditService(supabase)

    const credit = await creditService.createCredit(user.id, body)
    return NextResponse.json(credit, { status: 201 })
  } catch (error) {
    console.error('Error creating credit:', error)
    return NextResponse.json({ error: 'Failed to create credit' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Credit ID is required' }, { status: 400 })
    }

    const creditService = new CreditService(supabase)
    const credit = await creditService.updateCredit(id, user.id, updates)
    return NextResponse.json(credit)
  } catch (error) {
    console.error('Error updating credit:', error)
    return NextResponse.json({ error: 'Failed to update credit' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Credit ID is required' }, { status: 400 })
    }

    const creditService = new CreditService(supabase)
    await creditService.deleteCredit(id, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting credit:', error)
    return NextResponse.json({ error: 'Failed to delete credit' }, { status: 500 })
  }
}
