/**
 * API Route: /api/products
 * GET  — list all products
 * POST — add a new product
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'

// GET /api/products — fetch all products ordered by name
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('name')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }

  return NextResponse.json({ products })
}

// POST /api/products — create a new product
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { barcode, name, quantity, cost_price, selling_price, category } = body

  if (!name || quantity === undefined || !cost_price || !selling_price) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('products').insert({
    barcode: barcode || null,
    name: name.trim(),
    quantity: Number(quantity),
    cost_price: Number(cost_price),
    selling_price: Number(selling_price),
    category: category || null,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A product with this barcode already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }

  // Log the action
  await supabaseAdmin.from('activity_logs').insert({
    action: 'Product Added',
    description: `Product "${name}" was added to inventory.`,
  })

  return NextResponse.json({ success: true })
}
