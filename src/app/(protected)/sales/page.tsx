/**
 * Sales Records Page
 * Shows all sales with search, date filter, and link to transaction details
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { Sale } from '@/lib/types'

function IconSearch({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}
function IconArrow({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSales() {
      setLoading(true)
      const res = await fetch('/api/sales')
      const data = await res.json()
      setSales(data.sales || [])
      setLoading(false)
    }
    loadSales()
  }, [])

  // Derived: apply search and date filters
  const filtered = useMemo(() => {
    let result = [...sales]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((s) =>
        s.transaction_number.toLowerCase().includes(q)
      )
    }

    if (dateFrom) {
      result = result.filter(
        (s) => new Date(s.created_at) >= new Date(dateFrom + 'T00:00:00')
      )
    }
    if (dateTo) {
      result = result.filter(
        (s) => new Date(s.created_at) <= new Date(dateTo + 'T23:59:59')
      )
    }

    return result
  }, [sales, search, dateFrom, dateTo])

  // Total displayed amount
  const totalDisplayed = filtered.reduce((sum, s) => sum + s.total_amount, 0)
  const hasFilter = Boolean(dateFrom || dateTo || search)

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title text-[22px]">Sales</h1>
        <p className="page-subtitle">
          {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
          {hasFilter && sales.length !== filtered.length && ` of ${sales.length}`}
        </p>
      </div>

      {/* Filters */}
      <div className="surface p-3 mb-4 space-y-2.5">
        <div className="relative">
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-subtle)' }}
          >
            <IconSearch />
          </div>
          <input
            type="text"
            placeholder="Search by transaction number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 min-w-0"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="min-w-0">
            <label className="field-label">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
            />
          </div>
          <div className="min-w-0">
            <label className="field-label">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
            />
          </div>
        </div>
        {hasFilter && (
          <button
            onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--danger)' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div
          className="px-4 py-3 mb-4 flex items-center justify-between"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}
        >
          <div>
            <p className="text-[12px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Total {hasFilter ? 'filtered' : 'sales'}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>
              {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
            </p>
          </div>
          <p className="text-xl font-semibold tabular tracking-tight" style={{ color: 'var(--text)' }}>
            ₱{totalDisplayed.toFixed(2)}
          </p>
        </div>
      )}

      {/* Sales Table */}
      <div className="surface overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-[13px]" style={{ color: 'var(--text-subtle)' }}>Loading sales…</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {hasFilter ? 'No sales match your filters.' : 'No sales recorded yet.'}
          </p>
        ) : (
          <div className="table-container">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction ID</th>
                  <th className="is-num">Items</th>
                  <th className="is-num">Total</th>
                  <th className="is-center">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <p style={{ color: 'var(--text)' }}>
                        {new Date(sale.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                        {new Date(sale.created_at).toLocaleTimeString('en-PH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="mono" style={{ color: 'var(--text)' }}>{sale.transaction_number}</td>
                    <td className="is-num tabular" style={{ color: 'var(--text-muted)' }}>
                      {sale.item_count ?? '—'}
                    </td>
                    <td className="is-num tabular font-semibold">₱{sale.total_amount.toFixed(2)}</td>
                    <td className="is-center">
                      <Link
                        href={`/sales/${sale.id}`}
                        className="inline-flex items-center gap-1 text-[13px] font-medium"
                        style={{ color: 'var(--accent)' }}
                      >
                        View <IconArrow />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
