'use client'
import { useState, useEffect, use } from 'react'
import { useCountdown } from '@/hooks/useCountdown'

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

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!reservation) return <div className="p-8 text-center">Reservation not found.</div>

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      <div className="border border-gray-200 rounded-xl p-5 mb-4">
        <p className="font-medium text-lg">{reservation.product.name}</p>
        <p className="text-gray-500 text-sm mb-1">{reservation.warehouse.name}</p>
        <p className="text-sm text-gray-500">Qty: {reservation.quantity}</p>
        <p className="font-semibold text-xl mt-2">₹{reservation.product.price.toLocaleString()}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <br />
          <a href="/" className="underline mt-1 inline-block">← Back to products</a>
        </div>
      )}

      {reservation.status === 'PENDING' && !isExpired && (
        <>
          <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-amber-700 font-mono text-lg font-bold">{display}</span>
            <span className="text-amber-600 text-sm">remaining to complete purchase</span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={actionLoading}
            className="w-full py-3 bg-black text-white rounded-xl font-medium mb-3 disabled:opacity-50 hover:bg-gray-800 transition-colors"
          >
            {actionLoading ? 'Processing...' : 'Confirm Purchase'}
          </button>
          <button
            onClick={handleCancel}
            disabled={actionLoading}
            className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </>
      )}

      {reservation.status === 'PENDING' && isExpired && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <p className="font-medium">Reservation expired</p>
          <p className="text-sm mt-1">The 10-minute window has passed.</p>
          <a href="/" className="text-sm underline mt-2 inline-block">← Back to products</a>
        </div>
      )}

      {reservation.status === 'CONFIRMED' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <p className="font-medium text-lg">✓ Purchase confirmed!</p>
          <p className="text-sm mt-1">Your order has been placed successfully.</p>
          <a href="/" className="text-sm underline mt-2 inline-block">← Back to products</a>
        </div>
      )}

      {reservation.status === 'RELEASED' && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
          <p className="font-medium">Reservation cancelled</p>
          <p className="text-sm mt-1">The stock has been released back.</p>
          <a href="/" className="text-sm underline mt-2 inline-block">← Back to products</a>
        </div>
      )}
    </main>
  )
}
