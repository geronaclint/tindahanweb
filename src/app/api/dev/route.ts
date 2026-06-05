/**
 * API Route: /api/dev
 * GET — returns aggregated developer data for the authenticated user
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.userId

  // ── User info ─────────────────────────────────────────────
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, username, email, created_at')
    .eq('id', userId)
    .single()

  // ── DB table row counts ───────────────────────────────────
  const [{ count: productCount }, { count: salesCount }, { count: saleItemsCount }, { count: logCount }] =
    await Promise.all([
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('store_id', userId),
      supabaseAdmin.from('sales').select('*', { count: 'exact', head: true }).eq('store_id', userId),
      supabaseAdmin.from('sale_items').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('activity_logs').select('*', { count: 'exact', head: true }).eq('store_id', userId),
    ])

  // ── Lifetime revenue ──────────────────────────────────────
  const { data: allSales } = await supabaseAdmin
    .from('sales')
    .select('total_amount')
    .eq('store_id', userId)

  const lifetimeRevenue = allSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0

  // ── Activity by action type ────────────────────────────────
  const { data: actionGroups } = await supabaseAdmin
    .from('activity_logs')
    .select('action')
    .eq('store_id', userId)

  const actionCounts: Record<string, number> = {}
  for (const row of actionGroups ?? []) {
    actionCounts[row.action] = (actionCounts[row.action] ?? 0) + 1
  }

  // ── Daily activity (last 14 days) ─────────────────────────
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const { data: recentLogs } = await supabaseAdmin
    .from('activity_logs')
    .select('created_at')
    .eq('store_id', userId)
    .gte('created_at', fourteenDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  const dailyCounts: Record<string, number> = {}
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyCounts[key] = 0
  }
  for (const row of recentLogs ?? []) {
    const key = new Date(row.created_at).toISOString().slice(0, 10)
    if (dailyCounts[key] !== undefined) dailyCounts[key]++
  }

  // ── Recent activity (last 50) ──────────────────────────────
  const { data: recentActivity } = await supabaseAdmin
    .from('activity_logs')
    .select('id, action, description, created_at')
    .eq('store_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  // ── Low stock count ────────────────────────────────────────
  const { data: lowStock } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('store_id', userId)
    .gt('quantity', 0)
    .lte('quantity', 5)

  const lowStockCount = lowStock?.length ?? 0

  // ── Out of stock count ─────────────────────────────────────
  const { data: outOfStock } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('store_id', userId)
    .eq('quantity', 0)

  const outOfStockCount = outOfStock?.length ?? 0

  // ── Session info ───────────────────────────────────────────
  const sessionCreated = session.expiresAt
    ? new Date(new Date(session.expiresAt).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    : null

  // ── System info ────────────────────────────────────────────
  const { version: nextVersion } = await import('next/package.json')

  return NextResponse.json({
    user: user
      ? { id: user.id, storeName: user.username, email: user.email, created_at: user.created_at }
      : null,
    session: {
      username: session.username,
      userId: session.userId,
      createdAt: sessionCreated,
      expiresAt: session.expiresAt,
    },
    system: {
      nodeVersion: process.version,
      nextVersion,
      environment: process.env.NODE_ENV,
      platform: process.platform,
      appVersion: '0.1.0',
    },
    db: {
      products: productCount ?? 0,
      sales: salesCount ?? 0,
      saleItems: saleItemsCount ?? 0,
      activityLogs: logCount ?? 0,
    },
    stats: {
      lifetimeRevenue,
      lowStockCount,
      outOfStockCount,
    },
    actionCounts,
    dailyActivity: Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
    recentActivity: recentActivity ?? [],
  })
}
