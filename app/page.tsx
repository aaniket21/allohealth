'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
import { supabase } from '@/lib/supabase'

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
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'StockLevel',
        },
        (payload) => {
          setProducts((currentProducts) => {
            return currentProducts.map(product => {
              if (product.id === payload.new.productId) {
                return {
                  ...product,
                  stockLevels: product.stockLevels.map(stock => {
                    if (stock.id === payload.new.id) {
                      return { ...stock, availableUnits: payload.new.availableUnits }
                    }
                    return stock
                  })
                }
              }
              return product
            })
          })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
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

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading products...</div>

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Products</h1>
      <p className="text-muted-foreground text-sm mb-6">Reserve an item to hold it for 10 minutes during checkout.</p>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {products.map(product => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </div>
                <Badge variant="secondary" className="text-base font-semibold">
                  ₹{product.price.toLocaleString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {product.stockLevels.map(stock => (
                <div key={stock.id} className="flex items-center justify-between bg-muted rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">{stock.warehouse.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {stock.availableUnits > 0
                        ? `${stock.availableUnits} unit${stock.availableUnits > 1 ? 's' : ''} available`
                        : 'Out of stock'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleReserve(product.id, stock.warehouseId)}
                    disabled={stock.availableUnits === 0 || reserving === `${product.id}-${stock.warehouseId}`}
                  >
                    {reserving === `${product.id}-${stock.warehouseId}` ? 'Reserving...' : 'Reserve'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
