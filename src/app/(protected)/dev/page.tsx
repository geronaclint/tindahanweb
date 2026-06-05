'use client'

import { useState, useEffect } from 'react'

interface DevData {
  system: { nodeVersion: string; nextVersion: string; environment: string; platform: string; appVersion: string }
  session: { userId: string; username: string; expiresAt: string | null }
  db: { products: number; sales: number; saleItems: number; activityLogs: number; connected: boolean }
  recentActivity: { id: number; action: string; description: string; created_at: string }[]
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
      .catch(() => setError('Failed to load developer data'))
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

  const { system, session, db, recentActivity } = data

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-[960px] mx-auto">
      <div className="page-header mb-6">
        <h1 className="page-title text-[22px]">Developer dashboard</h1>
        <p className="page-subtitle">System info, database health, and activity logs.</p>
      </div>

      {/* System info */}
      <section className="surface overflow-hidden mb-4">
        <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>System</h2>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {([
            ['Node.js', system.nodeVersion],
            ['Next.js', system.nextVersion],
            ['Environment', system.environment],
            ['Platform', system.platform],
            ['App version', system.appVersion],
          ] as const).map(([label, value]) => (
            <div key={label} className="panel p-3">
              <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>{label}</p>
              <p className="text-[14px] font-semibold tabular mt-1" style={{ color: 'var(--text)' }}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Session */}
      <section className="surface overflow-hidden mb-4">
        <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Session</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {([
            ['User ID', session.userId],
            ['Username', session.username],
            ['Expires', session.expiresAt ? new Date(session.expiresAt).toLocaleString() : 'N/A'],
          ] as const).map(([label, value]) => (
            <div key={label} className="panel p-3">
              <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>{label}</p>
              <p className="text-[14px] font-semibold tabular mt-1 truncate" style={{ color: 'var(--text)' }}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Database health */}
      <section className="surface overflow-hidden mb-4">
        <div className="px-4 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Database</h2>
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: db.connected ? 'var(--success-bg, #14532d)' : 'var(--danger-bg, #7f1d1d)',
              color: db.connected ? 'var(--success, #4ade80)' : 'var(--danger, #f87171)',
            }}
          >
            {db.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            ['products', db.products],
            ['sales', db.sales],
            ['sale_items', db.saleItems],
            ['activity_logs', db.activityLogs],
          ] as const).map(([table, count]) => (
            <div key={table} className="panel p-3">
              <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>{table}</p>
              <p className="text-[14px] font-semibold tabular mt-1" style={{ color: 'var(--text)' }}>{count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="surface overflow-hidden mb-4">
        <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Recent activity</h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Last 50 actions</p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {recentActivity.length === 0 ? (
            <div className="p-4">
              <p className="text-[13px]" style={{ color: 'var(--text-subtle)' }}>No activity recorded.</p>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto">
              {recentActivity.map((log) => (
                <div key={log.id} className="px-4 py-2.5 flex items-start gap-3">
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0"
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
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
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
