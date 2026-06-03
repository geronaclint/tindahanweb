/**
 * Shared TypeScript types for the entire application
 */

export type Product = {
  id: string
  barcode: string | null
  name: string
  quantity: number
  cost_price: number
  selling_price: number
  category: string | null
  created_at: string
  updated_at: string
}

export type Sale = {
  id: string
  transaction_number: string
  total_amount: number
  created_at: string
  item_count?: number // joined count
}

export type SaleItem = {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  products?: { name: string } // joined from products table
}

export type ActivityLog = {
  id: string
  action: string
  description: string
  created_at: string
}

// Cart item used in the POS page (client-side only, not stored in DB)
export type CartItem = {
  product: Product
  quantity: number
}

// Dashboard statistics
export type DashboardStats = {
  totalProducts: number
  totalInventoryValue: number
  totalSalesToday: number
  totalSalesMonth: number
  lowStockCount: number
}
