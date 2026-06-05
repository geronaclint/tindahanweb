/**
 * Developer Dashboard — monitor user activity, system health, and DB stats
 */
'use client'

import { useState, useEffect } from 'react'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="surface p-3.5 min-w-0 flex-1">
      <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>{label}</p>
      <p className="text-lg font-semibold tabular tracking-tight mt-0.5" style={{ color: 'var(--text)' }}>{value}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="surface overflow-hidden mb-4">
      <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{title}</h2>
        {subtitle && <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      <div className="p-4">
        {children}
      </div>
    </section>
  )
}

function KeyValue({ k, v, mono }: { k: string; v: string | number | null | undefined; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{k}</span>
      <span className={`text-[13px] font-medium max-w-[60%] truncate text-right ${mono ? 'mono' : ''}`} style={{ color: 'var(--text)' }}>
        {v ?? '—'}
      </span>
    </div>
  )
}

interface DevData {
  user: { id: string; storeName: string; email: string; created_at: string } | null
  session: { username: string; userId: string; createdAt: string | null; expiresAt: string | null }
  system: { nodeVersion: string; nextVersion: string; environment: string; platform: string; appVersion: string }
  db: { products: number; sales: number; saleItems: number; activityLogs: number }
  stats: { lifetimeRevenue: number; lowStockCount: number; outOfStockCount: number }
  actionCounts: Record<string, number>
  dailyActivity: { date: string; count: number }[]
  recentActivity: { id: number; action: string; description: string; created_at: string }[]
}

const actionColors: Record<string, string> = {
  Login: '#818cf8',
  Logout: '#a1a1aa',
  'Product Added': '#4ade80',
  'Product Updated': '#fbbf24',
  'Product Deleted': '#f87171',
  'Sale Completed': '#34d399',
  'Settings Updated': '#a78bfa',
}

export default function DevPage() {
  const [data, setData] = useState<DevData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dev')
      .then((r) => r.json())
      .then((d: DevData & { error?: string }) => {
        if (d.error) { setError(d.error); return }
        setData(d)
      })
      .catch(() => setError('Failed to load dev data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-8 max-w-[960px] mx-auto">
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Loading developer data…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-8 max-w-[960px] mx-auto">
        <div className="surface p-4">
          <p className="text-[13px]" style={{ color: 'var(--danger)' }}>{error || 'No data available'}</p>
        </div>
      </div>
    )
  }

  const { user, session, system, db, stats, actionCounts, dailyActivity, recentActivity } = data

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="page-header mb-6">
        <h1 className="page-title text-[22px]">Developer dashboard</h1>
        <p className="page-subtitle">Monitor activity, system health, and database state.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-4">
        <StatCard label="Products" value={db.products.toString()} sub={stats.lowStockCount > 0 ? `${stats.lowStockCount} low stock` : undefined} />
        <StatCard label="Sales" value={db.sales.toString()} sub={`₱${stats.lifetimeRevenue.toFixed(0)} lifetime`} />
        <StatCard label="Sale items" value={db.saleItems.toString()} />
        <StatCard label="Activity logs" value={db.activityLogs.toString()} />
        <StatCard label="Out of stock" value={stats.outOfStockCount.toString()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* User & Session */}
        <Section title="User & session">
          <KeyValue k="Store name" v={user?.storeName} />
          <KeyValue k="Email" v={user?.email} />
          <KeyValue k="User ID" v={user?.id} mono />
          <div className="divider my-2" />
          <KeyValue k="Session username" v={session?.username} />
          <KeyValue k="Session created" v={session?.createdAt ? new Date(session.createdAt).toLocaleString() : '—'} />
          <KeyValue k="Expires" v={session?.expiresAt ? new Date(session.expiresAt).toLocaleString() : '—'} />
        </Section>

        {/* Activity by action */}
        <Section title="Activity by action" subtitle="Breakdown of logged actions">
          {Object.entries(actionCounts).length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--text-subtle)' }}>No activity recorded.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(actionCounts)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([action, count]) => {
                  const maxCount = Math.max(...Object.values(actionCounts) as number[])
                  const pct = count / maxCount
                  return (
                    <div key={action}>
                      <div className="flex justify-between items-center text-[12px] mb-1">
                        <span style={{ color: 'var(--text-muted)' }}>{action}</span>
                        <span className="mono font-semibold" style={{ color: 'var(--text)' }}>{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(pct * 100, 4)}%`,
                            backgroundColor: actionColors[action] || '#818cf8',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </Section>
      </div>

      {/* Daily activity (last 14 days) */}
      <Section title="Daily activity" subtitle="Actions per day (last 14 days)">
        <div className="space-y-1.5">
          {dailyActivity.map(({ date, count }: { date: string; count: number }) => {
            const maxDay = Math.max(...dailyActivity.map((d: { count: number }) => d.count), 1)
            const pct = count / maxDay
            const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-PH', {
              weekday: 'short', month: 'short', day: 'numeric',
            })
            return (
              <div key={date} className="flex items-center gap-3">
                <span className="text-[11px] w-28 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {dayLabel}
                </span>
                <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(pct * 100, count > 0 ? 4 : 0)}%`,
                      backgroundColor: count > 0 ? 'var(--accent)' : 'transparent',
                    }}
                  />
                </div>
                <span className="mono text-[11px] w-6 text-right" style={{ color: 'var(--text)' }}>{count}</span>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Recent activity */}
      <Section title="Recent activity" subtitle="Last 50 actions">
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {recentActivity.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--text-subtle)' }}>No activity yet.</p>
          ) : (
            recentActivity.map((log) => {
              return (
                <div key={log.id} className="py-2.5 flex items-start gap-3">
                  <span
                    className="pill text-[11px] whitespace-nowrap flex-shrink-0"
                    style={{
                      backgroundColor: actionColors[log.action] ? `${actionColors[log.action]}20` : 'var(--bg-subtle)',
                      color: actionColors[log.action] || 'var(--text-muted)',
                      border: '1px solid transparent',
                    }}
                  >
                    {log.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] truncate" style={{ color: 'var(--text)' }}>{log.description}</p>
                    <p className="text-[11px] mt-0.5 tabular" style={{ color: 'var(--text-subtle)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Section>

      {/* System info */}
      <Section title="System" subtitle="Runtime and environment">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="panel p-3">
            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Node.js</p>
            <p className="text-[14px] font-semibold tabular mt-1" style={{ color: 'var(--text)' }}>{system?.nodeVersion || '—'}</p>
          </div>
          <div className="panel p-3">
            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Next.js</p>
            <p className="text-[14px] font-semibold tabular mt-1" style={{ color: 'var(--text)' }}>{system?.nextVersion || '—'}</p>
          </div>
          <div className="panel p-3">
            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Environment</p>
            <p className="text-[14px] font-semibold mt-1" style={{ color: 'var(--text)' }}>{system?.environment || '—'}</p>
          </div>
          <div className="panel p-3">
            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Platform</p>
            <p className="text-[14px] font-semibold mt-1" style={{ color: 'var(--text)' }}>{system?.platform || '—'}</p>
          </div>
        </div>
      </Section>
    </div>
  )
}
