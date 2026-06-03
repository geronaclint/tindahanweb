/**
 * Transaction Details Page
 * Shows full details of a single sale including all items sold
 */
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch the sale record
  const { data: sale } = await supabaseAdmin
    .from('sales')
    .select('*')
    .eq('id', id)
    .single()

  if (!sale) notFound()

  // Fetch sale items with joined product names
  const { data: items } = await supabaseAdmin
    .from('sale_items')
    .select('*, products(name)')
    .eq('sale_id', id)

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/sales"
        className="text-blue-600 text-sm flex items-center gap-1 mb-4 hover:text-blue-800"
      >
        ← Back to Sales Records
      </Link>

      {/* Transaction Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{sale.transaction_number}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date(sale.created_at).toLocaleString('en-PH', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-green-600">₱{Number(sale.total_amount).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm table-container">
        <div className="p-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Items Sold</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs">Product</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600 text-xs">Qty</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600 text-xs">Unit Price</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600 text-xs">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="px-3 py-3 text-gray-900">
                  {/* @ts-ignore — Supabase join type */}
                  {item.products?.name || 'Deleted Product'}
                </td>
                <td className="px-3 py-3 text-right text-gray-600">{item.quantity}</td>
                <td className="px-3 py-3 text-right text-gray-600">₱{Number(item.unit_price).toFixed(2)}</td>
                <td className="px-3 py-3 text-right font-medium text-gray-900">₱{Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-3 py-3 text-right font-bold text-gray-800">
                TOTAL
              </td>
              <td className="px-3 py-3 text-right font-bold text-green-700 text-base">
                ₱{Number(sale.total_amount).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
