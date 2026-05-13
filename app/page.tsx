'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type StockLevel = {
  id: string
  warehouseId: string
  availableUnits: number
  warehouse: { id: string; name: string; location: string }
}

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  stockLevels: StockLevel[]
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
  }, [])

  async function handleReserve(productId: string, warehouseId: string) {
    setReserving(`${productId}-${warehouseId}`)
    setError(null)

    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, warehouseId, quantity: 1 })
    })

    if (res.status === 409) {
      setError('Sorry, that item just went out of stock. Please try another warehouse.')
      setReserving(null)
      return
    }

    const reservation = await res.json()
    router.push(`/reservation/${reservation.id}`)
  }

  if (loading) return <div className="p-8 text-center">Loading products...</div>

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Products</h1>
      <p className="text-gray-500 text-sm mb-6">Reserve an item to hold it for 10 minutes during checkout.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {products.map(product => (
          <div key={product.id} className="border border-gray-200 rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-medium text-lg">{product.name}</h2>
                <p className="text-gray-500 text-sm">{product.description}</p>
              </div>
              <span className="font-semibold text-lg">₹{product.price.toLocaleString()}</span>
            </div>

            <div className="space-y-2">
              {product.stockLevels.map(stock => (
                <div key={stock.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">{stock.warehouse.name}</p>
                    <p className="text-xs text-gray-500">
                      {stock.availableUnits > 0
                        ? `${stock.availableUnits} unit${stock.availableUnits > 1 ? 's' : ''} available`
                        : 'Out of stock'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleReserve(product.id, stock.warehouseId)}
                    disabled={stock.availableUnits === 0 || reserving === `${product.id}-${stock.warehouseId}`}
                    className="px-4 py-1.5 bg-black text-white text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    {reserving === `${product.id}-${stock.warehouseId}` ? 'Reserving...' : 'Reserve'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
