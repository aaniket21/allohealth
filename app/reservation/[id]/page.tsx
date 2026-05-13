'use client'
import { useState, useEffect, use } from 'react'
import { useCountdown } from '@/hooks/useCountdown'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Reservation = {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED'
  quantity: number
  expiresAt: string
  product: { name: string; price: number }
  warehouse: { name: string; location: string }
}

export default function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { display, isExpired } = useCountdown(reservation?.expiresAt ?? '')

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then(r => r.json())
      .then(data => { setReservation(data); setLoading(false) })
  }, [id])

  async function handleConfirm() {
    setActionLoading(true)
    setError(null)

    const res = await fetch(`/api/reservations/${id}/confirm`, {
      method: 'POST'
    })

    if (res.status === 410) {
      setError('Your reservation has expired. Please go back and try again.')
      setActionLoading(false)
      return
    }

    const updated = await res.json()
    setReservation(updated)
    setActionLoading(false)
  }

  async function handleCancel() {
    setActionLoading(true)
    const res = await fetch(`/api/reservations/${id}/release`, { method: 'POST' })
    const updated = await res.json()
    setReservation(updated)
    setActionLoading(false)
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  if (!reservation) return <div className="p-8 text-center text-muted-foreground">Reservation not found.</div>

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">{reservation.product.name}</CardTitle>
          <CardDescription>{reservation.warehouse.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Qty: {reservation.quantity}</p>
          <p className="font-semibold text-xl mt-2">₹{reservation.product.price.toLocaleString()}</p>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {error}
            <br />
            <a href="/" className="underline mt-1 inline-block">← Back to products</a>
          </AlertDescription>
        </Alert>
      )}

      {reservation.status === 'PENDING' && !isExpired && (
        <>
          <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-amber-700 font-mono text-lg font-bold">{display}</span>
            <span className="text-amber-600 text-sm">remaining to complete purchase</span>
          </div>
          <Button
            className="w-full mb-3"
            size="lg"
            onClick={handleConfirm}
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : 'Confirm Purchase'}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleCancel}
            disabled={actionLoading}
          >
            Cancel
          </Button>
        </>
      )}

      {reservation.status === 'PENDING' && isExpired && (
        <Alert variant="destructive">
          <AlertDescription>
            <p className="font-medium">Reservation expired</p>
            <p className="text-sm mt-1">The 10-minute window has passed.</p>
            <a href="/" className="text-sm underline mt-2 inline-block">← Back to products</a>
          </AlertDescription>
        </Alert>
      )}

      {reservation.status === 'CONFIRMED' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <p className="font-medium text-lg">✓ Purchase confirmed!</p>
          <p className="text-sm mt-1">Your order has been placed successfully.</p>
          <a href="/" className="text-sm underline mt-2 inline-block">← Back to products</a>
        </div>
      )}

      {reservation.status === 'RELEASED' && (
        <div className="p-4 bg-muted border border-border rounded-xl text-muted-foreground">
          <p className="font-medium">Reservation cancelled</p>
          <p className="text-sm mt-1">The stock has been released back.</p>
          <a href="/" className="text-sm underline mt-2 inline-block">← Back to products</a>
        </div>
      )}
    </main>
  )
}
