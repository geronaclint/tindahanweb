/**
 * Sales Records Page
 * Shows all sales with search, date filter, and link to transaction details
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Sale } from '@/lib/types'

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filtered, setFiltered] = useState<Sale[]>([])
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

  // Apply search and date filters
  useEffect(() => {
    let result = [...sales]

    // Search by transaction number
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((s) =>
        s.transaction_number.toLowerCase().includes(q)
      )
    }

    // Date range filter
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

    setFiltered(result)
  }, [sales, search, dateFrom, dateTo])

  // Total displayed amount
  const totalDisplayed = filtered.reduce((sum, s) => sum + s.total_amount, 0)

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Sales Records</h1>
        <p className="text-xs text-gray-500">{filtered.length} transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 space-y-2">
        <input
          type="text"
          placeholder="Search by transaction number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-0.5">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-0.5">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(dateFrom || dateTo || search) && (
            <div className="flex items-end">
              <button
                onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex justify-between items-center">
          <span className="text-sm text-blue-700 font-medium">Showing {filtered.length} sales</span>
          <span className="text-lg font-bold text-blue-800">₱{totalDisplayed.toFixed(2)}</span>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 table-container">
        {loading ? (
          <p className="p-8 text-center text-gray-400 text-sm">Loading sales...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">No sales found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-gray-600 text-xs">Date</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600 text-xs">Transaction ID</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-600 text-xs">Items</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-600 text-xs">Total</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600 text-xs">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3 text-gray-600">
                    <p>{new Date(sale.created_at).toLocaleDateString('en-PH')}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(sale.created_at).toLocaleTimeString('en-PH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-gray-800">
                    {sale.transaction_number}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600">
                    {sale.item_count ?? '—'}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-gray-900">
                    ₱{sale.total_amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Link
                      href={`/sales/${sale.id}`}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
