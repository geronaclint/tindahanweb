'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DevUser {
  id: string
  username: string
  email: string
  created_at: string
  is_dev: boolean
  totalRevenue: number
  totalSales: number
  totalActions: number
  lastLogin: string | null
  lastActive: string | null
  isActive: boolean
}

interface DevData {
  system: { nodeVersion: string; nextVersion: string; environment: string; platform: string; appVersion: string }
  session: { userId: string; username: string; expiresAt: string | null }
  db: { products: number; sales: number; saleItems: number; activityLogs: number; connected: boolean }
  all: { totalUsers: number; activeNow: number; totalProducts: number; totalSales: number; totalRevenue: number; totalLogs: number }
  users: DevUser[]
  dailyActivity: { date: string; count: number }[]
  recentActivity: { id: number; action: string; description: string; created_at: string; store_id: string }[]
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function DevPage() {
  const router = useRouter()
  const [data, setData] = useState<DevData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dev')
      .then(async (r) => {
        if (r.status === 403) { router.replace('/'); return null }
        if (!r.ok) throw new Error('Failed to load')
        return r.json()
      })
      .then((d: (DevData & { error?: string }) | null) => {
        if (!d) return
        if (d.error) { setError(d.error); return }
        setData(d)
      })
      .catch(() => setError('Failed to load developer data'))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-8 max-w-[1200px] mx-auto">
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-8 max-w-[1200px] mx-auto">
        <div className="surface p-4">
          <p className="text-[13px]" style={{ color: 'var(--danger)' }}>{error || 'No data available'}</p>
        </div>
      </div>
    )
  }

  const { system, session, db, all, users, dailyActivity, recentActivity } = data
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-[1200px] mx-auto">
      <div className="page-header mb-6">
        <h1 className="page-title text-[22px]">Developer dashboard</h1>
        <p className="page-subtitle">
          {all.totalUsers} user{all.totalUsers !== 1 ? 's' : ''} &middot; {all.activeNow} active now &middot; {all.totalSales} sales &middot; {'\u20B1'}{all.totalRevenue.toFixed(0)} revenue
        </p>
      </div>

      {/* Stats row */}
      <section className="grid grid-cols-3 md:grid-cols-7 gap-2 mb-4">
        {[
          ['Users', all.totalUsers],
          ['Active now', all.activeNow],
          ['Products', all.totalProducts],
          ['Sales', all.totalSales],
          ['Revenue', `₱${all.totalRevenue.toFixed(0)}`],
          ['Logs', all.totalLogs],
          ['DB', db.connected ? 'OK' : 'Off'],
        ].map(([label, value]) => (
          <div key={label} className="surface p-3 text-center min-w-0">
            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>{label}</p>
            <p className="text-base font-semibold tabular mt-0.5 truncate" style={{ color: 'var(--text)' }}>{value}</p>
          </div>
        ))}
      </section>

      {/* Users table */}
      <section className="surface overflow-hidden mb-4">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Users</h2>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>All registered stores with activity stats</p>
          </div>
          {users.filter((u) => u.isActive).length > 0 && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--success-bg, #14532d)', color: 'var(--success, #4ade80)' }}
            >
              {users.filter((u) => u.isActive).filter((u) => !u.is_dev).length} online
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Status', 'Store', 'Email', 'Sales', 'Revenue', 'Actions', 'Last active', 'Joined'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-semibold whitespace-nowrap" style={{ color: 'var(--text-subtle)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: u.isActive ? 'var(--success, #4ade80)' : 'var(--border)' }}
                      title={u.isActive ? 'Active now' : 'Offline'}
                    />
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>
                    <span className="font-medium">{u.username}</span>
                    {u.is_dev && (
                      <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-bg, #818cf820)', color: 'var(--accent)' }}>dev</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td className="px-4 py-2.5 tabular" style={{ color: 'var(--text)' }}>{u.totalSales}</td>
                  <td className="px-4 py-2.5 tabular" style={{ color: 'var(--text)' }}>₱{u.totalRevenue.toFixed(0)}</td>
                  <td className="px-4 py-2.5 tabular" style={{ color: 'var(--text-muted)' }}>{u.totalActions}</td>
                  <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text)' }} title={u.lastActive ? new Date(u.lastActive).toLocaleString() : 'Never'}>
                    {u.lastActive ? timeAgo(u.lastActive) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Daily activity */}
      <section className="surface overflow-hidden mb-4">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Daily activity</h2>
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Actions per day across all stores (last 14 days)</p>
        </div>
        <div className="p-4">
          <div className="space-y-1.5">
            {(() => {
              const max = Math.max(...dailyActivity.map((d) => d.count), 1)
              return dailyActivity.map(({ date, count }) => {
                const pct = count / max
                const label = new Date(date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
                return (
                  <div key={date} className="flex items-center gap-3">
                    <span className="text-[11px] w-28 flex-shrink-0 truncate" style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <div className="flex-1 h-2.5 rounded-full" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(pct * 100, count > 0 ? 2 : 0)}%`, backgroundColor: count > 0 ? 'var(--accent)' : 'transparent' }}
                      />
                    </div>
                    <span className="mono text-[11px] w-6 text-right tabular" style={{ color: 'var(--text)' }}>{count}</span>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section className="surface overflow-hidden mb-4">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Recent activity</h2>
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Last 100 actions across all stores</p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {recentActivity.length === 0 ? (
            <div className="p-4"><p className="text-[13px]" style={{ color: 'var(--text-subtle)' }}>No activity.</p></div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto">
              {recentActivity.map((log) => {
                const store = userMap[log.store_id]
                return (
                  <div key={log.id} className="px-4 py-2.5 flex items-start gap-3">
                    <span
                      className="text-[10.5px] font-medium px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0"
                      style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    >
                      {log.action}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] truncate" style={{ color: 'var(--text)' }}>{log.description}</p>
                      <p className="text-[11px] mt-0.5 tabular" style={{ color: 'var(--text-subtle)' }}>
                        {store?.username || log.store_id} &middot; {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* System / Session */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="surface overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>System</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {([
              ['Node.js', system.nodeVersion],
              ['Next.js', system.nextVersion],
              ['Environment', system.environment],
              ['Platform', system.platform],
              ['App version', system.appVersion],
            ] as const).map(([label, value]) => (
              <div key={label} className="panel p-3">
                <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>{label}</p>
                <p className="text-[13px] font-semibold tabular mt-1" style={{ color: 'var(--text)' }}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Session</h2>
          </div>
          <div className="p-4 space-y-1.5">
            {[
              ['User ID', session.userId],
              ['Username', session.username],
              ['Expires', session.expiresAt ? new Date(session.expiresAt).toLocaleString() : 'N/A'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-1.5">
                <span className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-[12.5px] font-medium mono max-w-[60%] truncate text-right" style={{ color: 'var(--text)' }}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>DB connection</span>
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: db.connected ? 'var(--success-bg, #14532d)' : 'var(--danger-bg, #7f1d1d)',
                  color: db.connected ? 'var(--success, #4ade80)' : 'var(--danger, #f87171)',
                }}
              >
                {db.connected ? 'OK' : 'Offline'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
