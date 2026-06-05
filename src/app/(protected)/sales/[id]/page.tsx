/**
 * Transaction Details Page
 * Shows full details of a single sale including all items sold
 */
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

function IconArrowLeft({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params

  // Fetch the sale record
  const { data: sale } = await supabaseAdmin
    .from('sales')
    .select('*')
    .eq('id', id)
    .eq('store_id', session.userId)
    .single()

  if (!sale) notFound()

  // Fetch sale items with joined product names
  const { data: items } = await supabaseAdmin
    .from('sale_items')
    .select('*, products(name)')
    .eq('sale_id', id)

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-[720px] mx-auto">
      {/* Back link */}
      <Link
        href="/sales"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4"
        style={{ color: 'var(--text-muted)' }}
      >
        <IconArrowLeft /> Back to sales
      </Link>

      {/* Transaction Header */}
      <div className="surface p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Transaction
            </p>
            <h1 className="mono text-[15px] font-semibold mt-1" style={{ color: 'var(--text)' }}>
              {sale.transaction_number}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {new Date(sale.created_at).toLocaleString('en-PH', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[12px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total</p>
            <p className="text-2xl font-semibold tabular tracking-tight mt-1" style={{ color: 'var(--text)' }}>
              ₱{Number(sale.total_amount).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="surface overflow-hidden">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            Items sold
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {items?.length ?? 0} {items?.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="table-container">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th className="is-num">Qty</th>
                <th className="is-num">Unit</th>
                <th className="is-num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item) => (
                <tr key={item.id}>
                  <td>
                    {/* @ts-ignore — Supabase join type */}
                    {item.products?.name || <span style={{ color: 'var(--text-subtle)' }}>Deleted product</span>}
                  </td>
                  <td className="is-num tabular">{item.quantity}</td>
                  <td className="is-num tabular" style={{ color: 'var(--text-muted)' }}>₱{Number(item.unit_price).toFixed(2)}</td>
                  <td className="is-num tabular font-semibold">₱{Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="is-num text-[13px] uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                  Total
                </td>
                <td className="is-num text-base font-semibold tabular" style={{ color: 'var(--text)', borderTop: '1px solid var(--border)' }}>
                  ₱{Number(sale.total_amount).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
