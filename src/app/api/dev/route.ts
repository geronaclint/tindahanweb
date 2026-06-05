import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.userId

  // ── Environment / system ─────────────────────────────
  const { version: nextVersion } = await import('next/package.json')

  // ── Row counts ───────────────────────────────────────
  const [{ count: products }, { count: sales }, { count: saleItems }, { count: logs }] =
    await Promise.all([
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('store_id', userId),
      supabaseAdmin.from('sales').select('*', { count: 'exact', head: true }).eq('store_id', userId),
      supabaseAdmin.from('sale_items').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('activity_logs').select('*', { count: 'exact', head: true }).eq('store_id', userId),
    ])

  // ── Recent activity (last 50) ────────────────────────
  const { data: recentActivity } = await supabaseAdmin
    .from('activity_logs')
    .select('id, action, description, created_at')
    .eq('store_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  // ─── Supabase connectivity check ─────────────────────
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
      products: products ?? 0,
      sales: sales ?? 0,
      saleItems: saleItems ?? 0,
      activityLogs: logs ?? 0,
      connected: pingStatus !== null || pingStatus !== undefined,
    },
    recentActivity: recentActivity ?? [],
  })
}
