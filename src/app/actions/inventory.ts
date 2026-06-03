/**
 * Server Actions for Inventory (CRUD operations on products)
 */
'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'

// Helper: ensure user is authenticated before any mutation
async function requireAuth() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

// Add a new product to inventory
export async function addProduct(formData: FormData) {
  await requireAuth()

  const barcode = formData.get('barcode') as string
  const name = formData.get('name') as string
  const quantity = parseInt(formData.get('quantity') as string, 10)
  const cost_price = parseFloat(formData.get('cost_price') as string)
  const selling_price = parseFloat(formData.get('selling_price') as string)
  const category = formData.get('category') as string

  // Validate required fields
  if (!name || isNaN(quantity) || isNaN(cost_price) || isNaN(selling_price)) {
    return { error: 'Please fill in all required fields with valid values.' }
  }

  const { error } = await supabaseAdmin.from('products').insert({
    barcode: barcode || null,
    name: name.trim(),
    quantity,
    cost_price,
    selling_price,
    category: category || null,
  })

  if (error) {
    // Handle duplicate barcode
    if (error.code === '23505') {
      return { error: 'A product with this barcode already exists.' }
    }
    return { error: 'Failed to add product. Please try again.' }
  }

  // Log the action
  await supabaseAdmin.from('activity_logs').insert({
    action: 'Product Added',
    description: `Product "${name}" was added to inventory.`,
  })

  revalidatePath('/inventory')
  return { success: true }
}

// Update an existing product
export async function updateProduct(id: string, formData: FormData) {
  await requireAuth()

  const barcode = formData.get('barcode') as string
  const name = formData.get('name') as string
  const quantity = parseInt(formData.get('quantity') as string, 10)
  const cost_price = parseFloat(formData.get('cost_price') as string)
  const selling_price = parseFloat(formData.get('selling_price') as string)
  const category = formData.get('category') as string

  if (!name || isNaN(quantity) || isNaN(cost_price) || isNaN(selling_price)) {
    return { error: 'Please fill in all required fields with valid values.' }
  }

  const { error } = await supabaseAdmin
    .from('products')
    .update({
      barcode: barcode || null,
      name: name.trim(),
      quantity,
      cost_price,
      selling_price,
      category: category || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: 'Failed to update product. Please try again.' }
  }

  await supabaseAdmin.from('activity_logs').insert({
    action: 'Product Updated',
    description: `Product "${name}" was updated.`,
  })

  revalidatePath('/inventory')
  return { success: true }
}

// Delete a product by ID
export async function deleteProduct(id: string, name: string) {
  await requireAuth()

  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: 'Failed to delete product.' }
  }

  await supabaseAdmin.from('activity_logs').insert({
    action: 'Product Deleted',
    description: `Product "${name}" was deleted from inventory.`,
  })

  revalidatePath('/inventory')
  return { success: true }
}
