/**
 * POS (Point of Sale) Page — the main cashier screen
 * Handles product search, barcode scanning, cart management, and completing sales
 * This is a Client Component because it needs real-time state (cart, scanner)
 */
'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import type { Product, CartItem, DashboardStats } from '@/lib/types'
import { completeSale } from '@/app/actions/sales'
import BarcodeScanner from '@/components/BarcodeScanner'

// ─── Small inline icons ─────────────────────────────────────────────────────
function IconSearch({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}
function IconScan({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  )
}
function IconPlus({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function IconMinus({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14" />
    </svg>
  )
}
function IconX({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
function IconBag({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  )
}
function IconCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

// ─── Dashboard Stats Card ───────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-3.5">
      <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>{label}</p>
      <p className="text-lg font-semibold tabular tracking-tight mt-0.5" style={{ color: 'var(--text)' }}>{value}</p>
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
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={isOutOfStock}
      className="w-full text-left flex items-center justify-between gap-3 px-4 py-3 border-b transition-colors"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium truncate" style={{ color: 'var(--text)' }}>{product.name}</p>
        <p className="text-[12px] mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <span className="tabular">₱{product.selling_price.toFixed(2)}</span>
          <span style={{ color: 'var(--text-subtle)' }}>·</span>
          {isOutOfStock ? (
            <span className="pill pill-danger" style={{ height: 18, fontSize: 10, padding: '0 6px' }}>Out of stock</span>
          ) : isLowStock ? (
            <span className="pill pill-warn" style={{ height: 18, fontSize: 10, padding: '0 6px' }}>{product.quantity} left</span>
          ) : (
            <span className="tabular">{product.quantity} in stock</span>
          )}
        </p>
      </div>
      <span
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] font-medium flex-shrink-0"
        style={{
          backgroundColor: isOutOfStock ? 'var(--bg-subtle)' : 'var(--text)',
          color: isOutOfStock ? 'var(--text-subtle)' : 'var(--bg)',
          opacity: isOutOfStock ? 0.6 : 1,
        }}
      >
        <IconPlus /> Add
      </span>
    </button>
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
    <div className="flex items-center py-3 border-b gap-3" style={{ borderColor: 'var(--border)' }}>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium truncate" style={{ color: 'var(--text)' }}>{item.product.name}</p>
        <p className="text-[12px] tabular mt-0.5" style={{ color: 'var(--text-muted)' }}>
          ₱{item.product.selling_price.toFixed(2)} each
        </p>
      </div>

      <div className="flex items-center gap-0.5 flex-shrink-0" style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 7, padding: 2 }}>
        <button
          onClick={onDecrease}
          className="w-7 h-7 flex items-center justify-center rounded transition-colors"
          style={{ color: 'var(--text)' }}
          aria-label="Decrease quantity"
        >
          <IconMinus />
        </button>
        <span className="w-7 text-center text-[13px] font-semibold tabular" style={{ color: 'var(--text)' }}>{item.quantity}</span>
        <button
          onClick={onIncrease}
          disabled={item.quantity >= item.product.quantity}
          className="w-7 h-7 flex items-center justify-center rounded transition-colors disabled:opacity-30"
          style={{ color: 'var(--text)' }}
          aria-label="Increase quantity"
        >
          <IconPlus />
        </button>
      </div>

      <div className="text-right flex-shrink-0 w-20">
        <p className="text-[13.5px] font-semibold tabular" style={{ color: 'var(--text)' }}>₱{subtotal.toFixed(2)}</p>
      </div>

      <button
        onClick={onRemove}
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-colors"
        style={{ color: 'var(--text-subtle)' }}
        aria-label="Remove item"
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--danger-soft)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-subtle)'; e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <IconX />
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

      if (foundName) {
        const casedName = foundName
          .split(' ')
          .map((w: string) => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')
          .join(' ')
        setNameLookup(casedName)
      }
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Product not found</h3>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Add this product to your inventory?</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div
              className="p-3 rounded-lg text-[13px]"
              style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="field-label">Barcode</label>
            <input
              name="barcode"
              defaultValue={barcode}
              readOnly
              className="input mono"
              style={{ backgroundColor: 'var(--bg-subtle)' }}
            />
          </div>
          <div>
            <label className="field-label">Product name</label>
            <input
              name="name"
              required
              autoFocus
              defaultValue={nameLookup}
              placeholder={isFetchingInfo ? 'Looking up online…' : 'e.g. Coca-Cola 1.5L'}
              className="input"
            />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="field-label">Qty</label>
              <input name="quantity" type="number" min="0" required className="input tabular" />
            </div>
            <div>
              <label className="field-label">Cost ₱</label>
              <input name="cost_price" type="number" min="0" step="0.01" required className="input tabular" />
            </div>
            <div>
              <label className="field-label">Price ₱</label>
              <input name="selling_price" type="number" min="0" step="0.01" required className="input tabular" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
              {loading ? 'Saving…' : 'Save product'}
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360, textAlign: 'center' }}>
        <div className="p-6">
          <div
            className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}
          >
            <IconCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            Sale complete
          </h3>
          <p className="mono mt-1" style={{ color: 'var(--text-muted)' }}>{transactionNumber}</p>
          <p className="text-3xl font-semibold tabular tracking-tight mt-3" style={{ color: 'var(--text)' }}>
            ₱{totalAmount.toFixed(2)}
          </p>
          <button onClick={onClose} className="btn btn-primary btn-block btn-lg mt-5">
            New sale
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main POS Page ──────────────────────────────────────────────────────────
export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [showDashboardStats, setShowDashboardStats] = useState(false)

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

  // Derived: filter products as the user types
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
      .slice(0, 10)
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
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-[1280px] mx-auto">
      {/* Page Header */}
      <div className="page-header flex-row md:items-end md:justify-between mb-6 flex flex-col md:flex-row gap-3">
        <div>
          <h1 className="page-title text-[22px]">Point of Sale</h1>
          <p className="page-subtitle">Search products, scan barcodes, complete sales.</p>
        </div>
        {stats && (
          <button
            type="button"
            onClick={() => setShowDashboardStats((v) => !v)}
            className="btn btn-secondary btn-sm"
            style={{ alignSelf: 'flex-start' }}
          >
            {showDashboardStats ? 'Hide stats' : 'Show stats'}
          </button>
        )}
      </div>

      {/* Dashboard Stats (collapsible) */}
      {stats && showDashboardStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-6">
          <StatCard label="Products" value={stats.totalProducts.toString()} />
          <StatCard label="Inventory value" value={`₱${stats.totalInventoryValue.toFixed(0)}`} />
          <StatCard label="Sales today" value={`₱${stats.totalSalesToday.toFixed(0)}`} />
          <StatCard label="This month" value={`₱${stats.totalSalesMonth.toFixed(0)}`} />
          <StatCard
            label="Low stock"
            value={stats.lowStockCount.toString()}
          />
        </div>
      )}

      {/* Main Grid: cart first on mobile, search second. On desktop, search left, cart right. */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ── Search (left on desktop) ── */}
        <div className="surface overflow-hidden flex flex-col order-2 lg:order-1 lg:col-span-3">
          <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  <IconSearch />
                </div>
                <input
                  type="text"
                  placeholder="Search products by name or barcode…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-9"
                  style={{ height: 42 }}
                />
              </div>
              <button
                onClick={() => setShowScanner(true)}
                className="btn btn-secondary"
                style={{ height: 42, flexShrink: 0 }}
                title="Scan barcode"
              >
                <IconScan /> <span className="hidden sm:inline">Scan</span>
              </button>
            </div>
          </div>

          {/* Search Results */}
          <div className="overflow-y-auto" style={{ maxHeight: '60vh', minHeight: 280 }}>
            {searchQuery && searchResults.length === 0 && (
              <p className="p-8 text-[13px] text-center" style={{ color: 'var(--text-subtle)' }}>
                No products match &ldquo;{searchQuery}&rdquo;
              </p>
            )}
            {searchResults.map((product) => (
              <ProductRow key={product.id} product={product} onAdd={addToCart} />
            ))}
            {!searchQuery && (
              <div className="p-10 text-center" style={{ color: 'var(--text-subtle)' }}>
                <div className="mx-auto w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <IconSearch className="w-5 h-5" />
                </div>
                <p className="text-[13px]">Start typing a product name or scan a barcode</p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                  {products.length} {products.length === 1 ? 'product' : 'products'} in your inventory
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Cart (right on desktop) ── */}
        <div className="surface flex flex-col overflow-hidden order-1 lg:order-2 lg:col-span-2">
          <div className="px-4 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-muted)' }}><IconBag /></span>
              <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
                Current sale
              </h2>
              {cartItemCount > 0 && (
                <span className="pill pill-accent" style={{ height: 20, fontSize: 11 }}>
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[12px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-4" style={{ maxHeight: '52vh', minHeight: 220 }}>
            {cart.length === 0 ? (
              <div className="py-12 text-center" style={{ color: 'var(--text-subtle)' }}>
                <p className="text-[13px]">Cart is empty</p>
                <p className="text-[12px] mt-1">Add a product to get started</p>
              </div>
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
          <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-[12px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total</span>
              <span className="text-2xl font-semibold tabular tracking-tight" style={{ color: 'var(--text)' }}>
                ₱{cartTotal.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || saleLoading}
              className="btn btn-primary btn-block btn-xl"
            >
              {saleLoading ? 'Processing…' : 'Complete sale'}
            </button>
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
