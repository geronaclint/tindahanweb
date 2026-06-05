/**
 * Inventory Management Page
 * Shows a table of all products with Add/Edit/Delete functionality
 */
'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import type { Product } from '@/lib/types'
import { addProduct, updateProduct, deleteProduct } from '@/app/actions/inventory'
import BarcodeScanner from '@/components/BarcodeScanner'

// Determine stock status from quantity
function getStockStatus(qty: number): { label: string; pill: 'pill-success' | 'pill-warn' | 'pill-danger' } {
  if (qty <= 0) return { label: 'Out of stock', pill: 'pill-danger' }
  if (qty <= 5) return { label: 'Low stock', pill: 'pill-warn' }
  return { label: 'In stock', pill: 'pill-success' }
}

function IconPlus({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function IconScan({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  )
}
function IconSearch({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

function ProductForm({
  product,
  existingCategories,
  onClose,
  onSaved,
}: {
  product?: Product | null
  existingCategories: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [barcode, setBarcode] = useState(product?.barcode || '')

  const [nameLookup, setNameLookup] = useState('')
  const [isFetchingInfo, setIsFetchingInfo] = useState(false)

  // Try to autofill name using external APIs if it's a new product
  useEffect(() => {
    async function fetchName() {
      // Don't autofetch if editing an existing product or barcode is empty
      if (product || !barcode || barcode.length < 4) return

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
  }, [barcode, product])

  const isEditing = !!product

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    // Inject current barcode state (may have been filled by scanner)
    formData.set('barcode', barcode)

    startTransition(async () => {
      const result = isEditing
        ? await updateProduct(product!.id, formData)
        : await addProduct(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        onSaved()
        onClose()
      }
    })
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
              {isEditing ? 'Edit product' : 'Add product'}
            </h3>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {isEditing ? 'Update the details for this product.' : 'Add a new product to your inventory.'}
            </p>
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

            {/* Barcode with scanner button */}
            <div>
              <label className="field-label">Barcode</label>
              <div className="flex gap-2">
                <input
                  name="barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan or type barcode…"
                  className="input mono flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="btn btn-secondary"
                  title="Scan barcode"
                  style={{ flexShrink: 0 }}
                >
                  <IconScan />
                </button>
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="field-label">Product name</label>
              <input
                name="name"
                defaultValue={product?.name || nameLookup || ''}
                required
                placeholder={isFetchingInfo ? 'Looking up online…' : 'e.g. Coke 1.5L'}
                className="input"
              />
            </div>

            {/* Category */}
            <div>
              <label className="field-label">Category</label>
              <input
                name="category"
                list="category-suggestions"
                defaultValue={product?.category || ''}
                placeholder="e.g. Beverages, Snacks"
                className="input"
              />
              <datalist id="category-suggestions">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Quantity */}
            <div>
              <label className="field-label">Quantity</label>
              <input
                name="quantity"
                type="number"
                min="0"
                defaultValue={product?.quantity ?? ''}
                required
                className="input tabular"
              />
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Cost price ₱</label>
                <input
                  name="cost_price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product?.cost_price ?? ''}
                  required
                  className="input tabular"
                />
              </div>
              <div>
                <label className="field-label">Selling price ₱</label>
                <input
                  name="selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product?.selling_price ?? ''}
                  required
                  className="input tabular"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} disabled={isPending} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="btn btn-primary" style={{ flex: 1 }}>
                {isPending ? 'Saving…' : isEditing ? 'Update product' : 'Add product'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setBarcode(code)
            setShowScanner(false)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  )
}

// ─── Delete Confirmation Modal ───────────────────────────────────────────────
function DeleteModal({
  product,
  onClose,
  onDeleted,
}: {
  product: Product
  onClose: () => void
  onDeleted: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteProduct(product.id, product.name)
      onDeleted()
      onClose()
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="p-5">
          <h3 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Delete product?</h3>
          <p className="text-[13px] mt-2" style={{ color: 'var(--text-muted)' }}>
            Are you sure you want to delete <span className="font-medium" style={{ color: 'var(--text)' }}>{product.name}</span>? This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button onClick={handleDelete} disabled={isPending} className="btn btn-danger-solid" style={{ flex: 1 }}>
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Inventory Page ─────────────────────────────────────────────────────
export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteModal, setDeleteModal] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  // Compute unique categories for suggestion
  const existingCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]

  async function loadProducts() {
    setLoading(true)
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data.products || [])
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts()
  }, [])

  // Derived: filter products when search changes
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    )
  }, [search, products])

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="page-header flex-row md:items-end md:justify-between flex flex-col md:flex-row gap-3">
        <div>
          <h1 className="page-title text-[22px]">Inventory</h1>
          <p className="page-subtitle">{products.length} {products.length === 1 ? 'product' : 'products'} in your store</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start' }}
        >
          <IconPlus /> Add product
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-subtle)' }}
        >
          <IconSearch />
        </div>
        <input
          type="text"
          placeholder="Search by name, barcode, or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Products Table */}
      <div className="surface overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-[13px]" style={{ color: 'var(--text-subtle)' }}>Loading products…</p>
        ) : filteredProducts.length === 0 ? (
          <div className="p-10 text-center" style={{ color: 'var(--text-subtle)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {search ? `No products match "${search}"` : 'No products yet'}
            </p>
            <p className="text-[12px] mt-1">Add your first product to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Barcode</th>
                  <th>Product</th>
                  <th className="is-num">Qty</th>
                  <th className="is-num">Cost</th>
                  <th className="is-num">Price</th>
                  <th>Status</th>
                  <th className="is-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product.quantity)
                  return (
                    <tr key={product.id}>
                      <td className="mono" style={{ color: 'var(--text-muted)' }}>
                        {product.barcode || '—'}
                      </td>
                      <td>
                        <p className="font-medium" style={{ color: 'var(--text)' }}>{product.name}</p>
                        {product.category && (
                          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>{product.category}</p>
                        )}
                      </td>
                      <td className="is-num tabular font-medium">{product.quantity}</td>
                      <td className="is-num tabular" style={{ color: 'var(--text-muted)' }}>
                        {product.cost_price.toFixed(2)}
                      </td>
                      <td className="is-num tabular font-medium">{product.selling_price.toFixed(2)}</td>
                      <td>
                        <span className={`pill ${status.pill}`}>{status.label}</span>
                      </td>
                      <td className="is-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => setEditProduct(product)}
                            className="btn btn-ghost btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteModal(product)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddForm && (
        <ProductForm
          existingCategories={existingCategories}
          onClose={() => setShowAddForm(false)}
          onSaved={loadProducts}
        />
      )}
      {editProduct && (
        <ProductForm
          product={editProduct}
          existingCategories={existingCategories}
          onClose={() => setEditProduct(null)}
          onSaved={loadProducts}
        />
      )}
      {deleteModal && (
        <DeleteModal
          product={deleteModal}
          onClose={() => setDeleteModal(null)}
          onDeleted={loadProducts}
        />
      )}
    </div>
  )
}
