/**
 * API Route: /api/sales
 * GET — list all sales with item count
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch sales with count of items per sale
  const { data: sales, error } = await supabaseAdmin
    .from('sales')
    .select('*, sale_items(count)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }

  // Flatten the item count from the nested array Supabase returns
  const formatted = sales.map((s: Record<string, unknown>) => ({
    ...s,
    item_count: Array.isArray(s.sale_items)
      ? (s.sale_items[0] as { count: number })?.count ?? 0
      : 0,
    sale_items: undefined, // Remove raw nested data
  }))

  return NextResponse.json({ sales: formatted })
}
