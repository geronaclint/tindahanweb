import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabaseAdmin
    .from('users')
    .select('is_dev')
    .eq('id', session.userId)
    .single()

  if (!me?.is_dev) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { version: nextVersion } = await import('next/package.json')

  const [
    { data: allUsers },
    { count: productCount },
    { count: salesCount },
    { count: saleItemsCount },
    { count: logCount },
    { data: allSales },
    { data: allLogs },
    { data: last100 },
    { data: dailyLogs },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('id, username, email, created_at, is_dev').order('created_at', { ascending: false }),
    supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('sales').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('sale_items').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('activity_logs').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('sales').select('store_id, total_amount'),
    // All activity logs for per-user stats
    supabaseAdmin.from('activity_logs')
      .select('id, action, description, created_at, store_id')
      .order('created_at', { ascending: false })
      .limit(5000),
    // Last 100 (for display)
    supabaseAdmin.from('activity_logs')
      .select('id, action, description, created_at, store_id')
      .order('created_at', { ascending: false })
      .limit(100),
    // Daily activity last 14 days
    supabaseAdmin.from('activity_logs')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
      .order('created_at', { ascending: true }),
  ])

  // ── Per-user revenue & sales counts ──────────────
  const userRevenue: Record<string, number> = {}
  const userSalesCount: Record<string, number> = {}
  for (const s of allSales ?? []) {
    userRevenue[s.store_id] = (userRevenue[s.store_id] ?? 0) + Number(s.total_amount)
    userSalesCount[s.store_id] = (userSalesCount[s.store_id] ?? 0) + 1
  }

  // ── Per-user activity stats ──────────────────────
  const now = Date.now()
  const userLastLogin: Record<string, string> = {}
  const userLastActivity: Record<string, string> = {}
  const userActivityCount: Record<string, number> = {}

  // We need to find the first (most recent) Login + most recent overall per user
  for (const log of allLogs ?? []) {
    const uid = log.store_id
    if (!uid) continue
    if (!userLastActivity[uid]) userLastActivity[uid] = log.created_at
    if (!userLastLogin[uid] && log.action === 'Login') userLastLogin[uid] = log.created_at
    userActivityCount[uid] = (userActivityCount[uid] ?? 0) + 1
  }

  const activeThreshold = 15 * 60 * 1000 // 15 minutes

  const users = (allUsers ?? []).map((u) => {
    const lastActive = userLastActivity[u.id] || null
    const active = lastActive ? (now - new Date(lastActive).getTime()) < activeThreshold : false
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      created_at: u.created_at,
      is_dev: u.is_dev,
      totalRevenue: userRevenue[u.id] ?? 0,
      totalSales: userSalesCount[u.id] ?? 0,
      totalActions: userActivityCount[u.id] ?? 0,
      lastLogin: userLastLogin[u.id] || null,
      lastActive,
      isActive: active,
    }
  })

  const activeNow = users.filter((u) => u.isActive).length

  // ── Daily activity (last 14 days) ────────────────
  const dailyCounts: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dailyCounts[d.toISOString().slice(0, 10)] = 0
  }
  for (const row of dailyLogs ?? []) {
    const key = new Date(row.created_at).toISOString().slice(0, 10)
    if (dailyCounts[key] !== undefined) dailyCounts[key]++
  }
  const dailyActivity = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))

  const totalRevenue = Object.values(userRevenue).reduce((a, b) => a + b, 0)

  // ── Ping ─────────────────────────────────────────
  const { status: pingStatus } = await supabaseAdmin.from('products').select('id').limit(1).maybeSingle()

  return NextResponse.json({
    system: {
      nodeVersion: process.version,
      nextVersion,
      environment: process.env.NODE_ENV,
      platform: process.platform,
      appVersion: '0.1.0',
    },
    session: {
      userId: session.userId,
      username: session.username,
      expiresAt: session.expiresAt,
    },
    db: {
      products: productCount ?? 0,
      sales: salesCount ?? 0,
      saleItems: saleItemsCount ?? 0,
      activityLogs: logCount ?? 0,
      connected: pingStatus !== null || pingStatus !== undefined,
    },
    all: {
      totalUsers: (allUsers ?? []).length,
      activeNow,
      totalProducts: productCount ?? 0,
      totalSales: salesCount ?? 0,
      totalRevenue,
      totalLogs: logCount ?? 0,
    },
    users,
    dailyActivity,
    recentActivity: last100 ?? [],
  })
}
