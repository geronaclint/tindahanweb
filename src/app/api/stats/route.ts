/**
 * API Route: /api/stats
 * GET — returns dashboard statistics
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all products for inventory calculations
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('quantity, cost_price, selling_price')
    .eq('store_id', session.userId)

  const totalProducts = products?.length ?? 0

  // Inventory value = sum of (cost_price * quantity) for all products
  const totalInventoryValue =
    products?.reduce((sum, p) => sum + p.cost_price * p.quantity, 0) ?? 0

  // Low stock = items with 1–5 units remaining
  const lowStockCount = products?.filter((p) => p.quantity > 0 && p.quantity <= 5).length ?? 0

  // Today's sales
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: todaySales } = await supabaseAdmin
    .from('sales')
    .select('total_amount')
    .eq('store_id', session.userId)
    .gte('created_at', todayStart.toISOString())

  const totalSalesToday = todaySales?.reduce((sum, s) => sum + s.total_amount, 0) ?? 0

  // This month's sales
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: monthSales } = await supabaseAdmin
    .from('sales')
    .select('total_amount')
    .eq('store_id', session.userId)
    .gte('created_at', monthStart.toISOString())

  const totalSalesMonth = monthSales?.reduce((sum, s) => sum + s.total_amount, 0) ?? 0

  return NextResponse.json({
    totalProducts,
    totalInventoryValue,
    totalSalesToday,
    totalSalesMonth,
    lowStockCount,
  })
}
