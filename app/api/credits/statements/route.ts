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
    const creditId = searchParams.get('creditId')

    if (!creditId) {
      return NextResponse.json({ error: 'Credit ID is required' }, { status: 400 })
    }

    const creditService = new CreditService(supabase)
    const statements = await creditService.getStatements(creditId, user.id)
    return NextResponse.json(statements)
  } catch (error) {
    console.error('Error fetching statements:', error)
    return NextResponse.json({ error: 'Failed to fetch statements' }, { status: 500 })
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

    // Check if this is a bulk import or single statement
    if (Array.isArray(body.statements) && body.credit_id) {
      const statements = await creditService.importStatements(user.id, body.credit_id, body.statements)
      return NextResponse.json(statements, { status: 201 })
    } else {
      const statement = await creditService.createStatement(user.id, body)
      return NextResponse.json(statement, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating statement:', error)
    return NextResponse.json({ error: 'Failed to create statement' }, { status: 500 })
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
      return NextResponse.json({ error: 'Statement ID is required' }, { status: 400 })
    }

    const creditService = new CreditService(supabase)
    const statement = await creditService.updateStatement(id, user.id, updates)
    return NextResponse.json(statement)
  } catch (error) {
    console.error('Error updating statement:', error)
    return NextResponse.json({ error: 'Failed to update statement' }, { status: 500 })
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
      return NextResponse.json({ error: 'Statement ID is required' }, { status: 400 })
    }

    const creditService = new CreditService(supabase)
    await creditService.deleteStatement(id, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting statement:', error)
    return NextResponse.json({ error: 'Failed to delete statement' }, { status: 500 })
  }
}
