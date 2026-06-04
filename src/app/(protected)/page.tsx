/**
 * POS (Point of Sale) Page — the main cashier screen
 * Handles product search, barcode scanning, cart management, and completing sales
 * This is a Client Component because it needs real-time state (cart, scanner)
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Product, CartItem, DashboardStats } from '@/lib/types'
import { completeSale } from '@/app/actions/sales'
import BarcodeScanner from '@/components/BarcodeScanner'

// ─── Dashboard Stats Card ───────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`bg-white rounded-lg p-3 border-l-4 ${color} shadow-sm`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}

// ─── Product Search Result Row ───────────────────────────────────────────────
function ProductRow({
  product,
  onAdd,
}: {
  product: Product
  onAdd: (product: Product) => void
}) {
  const isOutOfStock = product.quantity <= 0
  const isLowStock = product.quantity > 0 && product.quantity <= 5

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
        <p className="text-xs text-gray-500">
          ₱{product.selling_price.toFixed(2)} &bull;{' '}
          <span className={isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'}>
            {isOutOfStock ? 'Out of Stock' : `${product.quantity} in stock`}
          </span>
        </p>
      </div>
      <button
        onClick={() => onAdd(product)}
        disabled={isOutOfStock}
        className="ml-3 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 flex-shrink-0"
      >
        Add
      </button>
    </div>
  )
}

// ─── Cart Item Row ───────────────────────────────────────────────────────────
function CartRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: CartItem
  onIncrease: () => void
  onDecrease: () => void
  onRemove: () => void
}) {
  const subtotal = item.product.selling_price * item.quantity

  return (
    <div className="flex items-center py-2 border-b border-gray-100 gap-2">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
        <p className="text-xs text-gray-500">₱{item.product.selling_price.toFixed(2)} each</p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onDecrease}
          className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded text-gray-700 font-bold hover:bg-gray-300"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
        <button
          onClick={onIncrease}
          disabled={item.quantity >= item.product.quantity}
          className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded text-gray-700 font-bold hover:bg-gray-300 disabled:opacity-40"
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right flex-shrink-0 w-20">
        <p className="text-sm font-semibold text-gray-900">₱{subtotal.toFixed(2)}</p>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="text-red-400 hover:text-red-600 flex-shrink-0 px-1"
        aria-label="Remove item"
      >
        ✕
      </button>
    </div>
  )
}

// ─── Add Product from Barcode Modal ─────────────────────────────────────────
function AddFromBarcodeModal({
  barcode,
  onClose,
  onSaved,
}: {
  barcode: string
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nameLookup, setNameLookup] = useState('')
  const [isFetchingInfo, setIsFetchingInfo] = useState(true)

  // Try to autofill name using external APIs
  useEffect(() => {
    async function fetchName() {
      if (!barcode || barcode.length < 4) return
      
      setIsFetchingInfo(true)
      let foundName = ''

      // 1. Try OpenFoodFacts (good for global food)
      try {
        const res1 = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
        const data1 = await res1.json()
        if (data1?.status === 1 && data1?.product?.product_name) {
          foundName = data1.product.product_name
        }
      } catch (e) { /* ignore */ }

      // 2. Try UPCItemDB Fallback (good for general retail/hardware/local)
      if (!foundName) {
        try {
          const res2 = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`)
          const data2 = await res2.json()
          if (data2?.code === 'OK' && data2?.items?.length > 0) {
            foundName = data2.items[0].title
          }
        } catch (e) { /* ignore */ }
      }

      if (foundName) setNameLookup(foundName)
      setIsFetchingInfo(false)
    }
    fetchName()
  }, [barcode])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)

    const res = await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        barcode: formData.get('barcode'),
        name: formData.get('name'),
        quantity: Number(formData.get('quantity')),
        cost_price: Number(formData.get('cost_price')),
        selling_price: Number(formData.get('selling_price')),
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await res.json()
    setLoading(false)

    if (data.error) {
      setError(data.error)
    } else {
      onSaved()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Product Not Found</h3>
          <p className="text-sm text-gray-500 mt-0.5">Add this product to inventory?</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Barcode</label>
            <input
              name="barcode"
              defaultValue={barcode}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
            <input
              name="name"
              required
              autoFocus
              defaultValue={nameLookup}
              placeholder={isFetchingInfo ? 'Fetching online info...' : 'e.g. Coca-Cola 1.5L'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Qty *</label>
              <input
                name="quantity"
                type="number"
                min="0"
                required
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cost (₱) *</label>
              <input
                name="cost_price"
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price (₱) *</label>
              <input
                name="selling_price"
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Sale Complete Modal ─────────────────────────────────────────────────────
function SaleSuccessModal({
  transactionNumber,
  totalAmount,
  onClose,
}: {
  transactionNumber: string
  totalAmount: number
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl text-center p-6">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-xl font-bold text-gray-900">Sale Complete!</h3>
        <p className="text-gray-500 text-sm mt-1">{transactionNumber}</p>
        <p className="text-3xl font-bold text-green-600 mt-4">₱{totalAmount.toFixed(2)}</p>
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          New Sale
        </button>
      </div>
    </div>
  )
}

// ─── Main POS Page ──────────────────────────────────────────────────────────
export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [saleLoading, setSaleLoading] = useState(false)
  const [saleSuccess, setSaleSuccess] = useState<{ transactionNumber: string; totalAmount: number } | null>(null)
  const [addFromBarcodeModal, setAddFromBarcodeModal] = useState<string | null>(null)

  // Load all products and stats on mount
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [productsRes, statsRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/stats'),
    ])
    const productsData = await productsRes.json()
    const statsData = await statsRes.json()
    setProducts(productsData.products || [])
    setStats(statsData)
  }

  // Filter products as user types
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      setSearchResults([])
      return
    }
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    )
    setSearchResults(filtered.slice(0, 10))
  }, [searchQuery, products])

  // Add product to cart or increase quantity
  const addToCart = useCallback((product: Product) => {
    if (product.quantity <= 0) return

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        // Check stock limit
        if (existing.quantity >= product.quantity) return prev
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })

    // Clear search after adding
    setSearchQuery('')
    setSearchResults([])
  }, [])

  // Increase quantity in cart
  function increaseQty(productId: string) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i
        if (i.quantity >= i.product.quantity) return i
        return { ...i, quantity: i.quantity + 1 }
      })
    )
  }

  // Decrease quantity or remove from cart
  function decreaseQty(productId: string) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    )
  }

  // Remove item from cart
  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  // Handle barcode scan result
  async function handleBarcodeScan(barcode: string) {
    setShowScanner(false)
    const found = products.find((p) => p.barcode === barcode)
    if (found) {
      addToCart(found)
    } else {
      // Show modal to add new product with this barcode
      setAddFromBarcodeModal(barcode)
    }
  }

  // Complete the sale
  async function handleCompleteSale() {
    if (cart.length === 0) return
    setSaleLoading(true)

    const result = await completeSale(cart)
    setSaleLoading(false)

    if (result.error) {
      alert(`Error: ${result.error}`)
      return
    }

    // Show success modal
    setSaleSuccess({
      transactionNumber: result.transactionNumber!,
      totalAmount: result.totalAmount!,
    })

    // Clear cart and reload data
    setCart([])
    await loadData()
  }

  // Calculate cart total
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.selling_price * item.quantity,
    0
  )

  return (
    <div className="p-4">
      {/* Page Title */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Point of Sale</h1>
        <p className="text-xs text-gray-500">Search products, scan barcodes, complete sales</p>
      </div>

      {/* Dashboard Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          <StatCard label="Total Products" value={stats.totalProducts.toString()} color="border-blue-500" />
          <StatCard label="Inventory Value" value={`₱${stats.totalInventoryValue.toFixed(0)}`} color="border-purple-500" />
          <StatCard label="Sales Today" value={`₱${stats.totalSalesToday.toFixed(0)}`} color="border-green-500" />
          <StatCard label="Sales This Month" value={`₱${stats.totalSalesMonth.toFixed(0)}`} color="border-yellow-500" />
          <StatCard
            label="Low Stock Items"
            value={stats.lowStockCount.toString()}
            color={stats.lowStockCount > 0 ? 'border-red-500' : 'border-gray-300'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Left: Product Search ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex gap-2">
            <input
              type="text"
              placeholder="Search by name or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowScanner(true)}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex-shrink-0"
              title="Scan Barcode"
            >
              📷 Scan
            </button>
          </div>

          {/* Search Results */}
          <div className="max-h-80 overflow-y-auto">
            {searchQuery && searchResults.length === 0 && (
              <p className="p-4 text-gray-400 text-sm text-center">No products found</p>
            )}
            {searchResults.map((product) => (
              <ProductRow key={product.id} product={product} onAdd={addToCart} />
            ))}
            {!searchQuery && (
              <p className="p-4 text-gray-400 text-sm text-center">
                Type a product name or barcode to search
              </p>
            )}
          </div>
        </div>

        {/* ── Right: Shopping Cart ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              🛒 Cart {cart.length > 0 && <span className="text-blue-600">({cart.length} items)</span>}
            </h2>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto max-h-72 px-3">
            {cart.length === 0 ? (
              <p className="py-8 text-gray-400 text-sm text-center">Cart is empty</p>
            ) : (
              cart.map((item) => (
                <CartRow
                  key={item.product.id}
                  item={item}
                  onIncrease={() => increaseQty(item.product.id)}
                  onDecrease={() => decreaseQty(item.product.id)}
                  onRemove={() => removeFromCart(item.product.id)}
                />
              ))
            )}
          </div>

          {/* Total and Actions */}
          <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-gray-700">TOTAL</span>
              <span className="text-2xl font-bold text-gray-900">₱{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCart([])}
                disabled={cart.length === 0}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-100"
              >
                Clear Cart
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={cart.length === 0 || saleLoading}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-green-700"
              >
                {saleLoading ? 'Processing...' : '✅ Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Add Product from Barcode Modal */}
      {addFromBarcodeModal && (
        <AddFromBarcodeModal
          barcode={addFromBarcodeModal}
          onClose={() => setAddFromBarcodeModal(null)}
          onSaved={loadData}
        />
      )}

      {/* Sale Success Modal */}
      {saleSuccess && (
        <SaleSuccessModal
          transactionNumber={saleSuccess.transactionNumber}
          totalAmount={saleSuccess.totalAmount}
          onClose={() => setSaleSuccess(null)}
        />
      )}
    </div>
  )
}
