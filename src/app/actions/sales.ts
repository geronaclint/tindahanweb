/**
 * Server Action for completing a sale (POS)
 * Wraps the entire transaction in a single atomic operation
 */
'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import type { CartItem } from '@/lib/types'

// Generate a readable transaction number: TXN-YYYYMMDD-XXXX
function generateTransactionNumber(): string {
  const date = new Date()
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `TXN-${datePart}-${rand}`
}

export async function completeSale(cartItems: CartItem[]) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  if (!cartItems || cartItems.length === 0) {
    return { error: 'Cart is empty.' }
  }

  // Calculate total
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.selling_price * item.quantity,
    0
  )

  const transactionNumber = generateTransactionNumber()

  // 1. Insert the sale record
  const { data: sale, error: saleError } = await supabaseAdmin
    .from('sales')
    .insert({
      transaction_number: transactionNumber,
      total_amount: totalAmount,
    })
    .select()
    .single()

  if (saleError || !sale) {
    return { error: 'Failed to create sale record.' }
  }

  // 2. Insert each sale item and deduct stock
  for (const item of cartItems) {
    // Insert sale item
    const { error: itemError } = await supabaseAdmin.from('sale_items').insert({
      sale_id: sale.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.selling_price,
      subtotal: item.product.selling_price * item.quantity,
    })

    if (itemError) {
      return { error: `Failed to save item "${item.product.name}".` }
    }

    // Deduct stock from inventory
    const { error: stockError } = await supabaseAdmin
      .from('products')
      .update({
        quantity: item.product.quantity - item.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.product.id)

    if (stockError) {
      return { error: `Failed to deduct stock for "${item.product.name}".` }
    }
  }

  // 3. Log the sale activity
  const itemNames = cartItems.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')
  await supabaseAdmin.from('activity_logs').insert({
    action: 'Sale Completed',
    description: `Transaction ${transactionNumber} — ₱${totalAmount.toFixed(2)} — Items: ${itemNames}`,
  })

  // Revalidate pages that show inventory/sales data
  revalidatePath('/')
  revalidatePath('/sales')
  revalidatePath('/inventory')

  return { success: true, transactionNumber, totalAmount }
}
