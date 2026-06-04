/**
 * Inventory Management Page
 * Shows a table of all products with Add/Edit/Delete functionality
 */
'use client'

import { useState, useEffect, useTransition } from 'react'
import type { Product } from '@/lib/types'
import { addProduct, updateProduct, deleteProduct } from '@/app/actions/inventory'
import BarcodeScanner from '@/components/BarcodeScanner'

// Determine stock status from quantity
function getStockStatus(qty: number): { label: string; color: string } {
  if (qty <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' }
  if (qty <= 5) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' }
  return { label: 'In Stock', color: 'bg-green-100 text-green-700' }
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-xl max-h-screen overflow-y-auto border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Barcode with scanner button */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Barcode</label>
              <div className="flex gap-2">
                <input
                  name="barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan or type barcode..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
                  title="Scan barcode"
                >
                  📷
                </button>
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Product Name *</label>
              <input
                name="name"
                defaultValue={product?.name || nameLookup || ''}
                required
                placeholder={isFetchingInfo ? 'Fetching online info...' : 'e.g. Coke 1.5L'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Category</label>
              <input
                name="category"
                list="category-suggestions"
                defaultValue={product?.category || ''}
                placeholder="e.g. Beverages, Snacks"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-white"
              />
              <datalist id="category-suggestions">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Quantity *</label>
              <input
                name="quantity"
                type="number"
                min="0"
                defaultValue={product?.quantity ?? ''}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-white"
              />
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Cost Price (₱) *</label>
                <input
                  name="cost_price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product?.cost_price ?? ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Selling Price (₱) *</label>
                <input
                  name="selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product?.selling_price ?? ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {isPending ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl w-full max-w-sm shadow-xl p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Delete Product?</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Are you sure you want to delete <strong className="dark:text-white">{product.name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Inventory Page ─────────────────────────────────────────────────────
export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
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
    loadProducts()
  }, [])

  // Filter when search changes
  useEffect(() => {
    const q = search.trim().toLowerCase()
    if (!q) {
      setFilteredProducts(products)
      return
    }
    setFilteredProducts(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      )
    )
  }, [search, products])

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{products.length} products</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, barcode, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 table-container">
        {loading ? (
          <p className="p-8 text-center text-gray-400 text-sm">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">
            {search ? 'No products match your search.' : 'No products yet. Add your first product!'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs">Barcode</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs">Product Name</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs">Qty</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs">Cost (₱)</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs">Price (₱)</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs">Status</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product.quantity)
                return (
                  <tr key={product.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {product.barcode || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      {product.category && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{product.category}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-gray-800 dark:text-gray-200">
                      {product.quantity}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-600 dark:text-gray-300">
                      {product.cost_price.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {product.selling_price.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => setEditProduct(product)}
                          className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteModal(product)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-medium"
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
