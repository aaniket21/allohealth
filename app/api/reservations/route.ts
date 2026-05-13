import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createReservation } from '@/lib/reservations'

const Schema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive()
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const idempotencyKey = req.headers.get('idempotency-key') ?? undefined

  try {
    const reservation = await createReservation(
      parsed.data.productId,
      parsed.data.warehouseId,
      parsed.data.quantity,
      idempotencyKey
    )
    return NextResponse.json(reservation, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json({ error: 'Not enough stock available' }, { status: 409 })
    }
    if (message === 'STOCK_NOT_FOUND') {
      return NextResponse.json({ error: 'Product not found in this warehouse' }, { status: 404 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
