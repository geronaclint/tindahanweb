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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sales Records</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-4 space-y-2">
        <input
          type="text"
          placeholder="Search by transaction number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-white"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-white"
            />
          </div>
        </div>
        {(dateFrom || dateTo || search) && (
          <button
            onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}
            className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 flex justify-between items-center">
          <span className="text-sm text-blue-700 dark:text-blue-400 font-medium">Showing {filtered.length} sales</span>
          <span className="text-lg font-bold text-blue-800 dark:text-blue-300">₱{totalDisplayed.toFixed(2)}</span>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 table-container">
        {loading ? (
          <p className="p-8 text-center text-gray-400 text-sm">Loading sales...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">No sales found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs">Date</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs">Transaction ID</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs">Items</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs">Total</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                    <p>{new Date(sale.created_at).toLocaleDateString('en-PH')}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(sale.created_at).toLocaleTimeString('en-PH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-gray-800 dark:text-gray-200">
                    {sale.transaction_number}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600 dark:text-gray-300">
                    {sale.item_count ?? '—'}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-gray-900 dark:text-white">
                    ₱{sale.total_amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Link
                      href={`/sales/${sale.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium"
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
