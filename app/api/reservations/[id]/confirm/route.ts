import { NextRequest, NextResponse } from 'next/server'
import { confirmReservation } from '@/lib/reservations'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const reservation = await confirmReservation(id)
    return NextResponse.json(reservation)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'EXPIRED') {
      return NextResponse.json({ error: 'Reservation has expired' }, { status: 410 })
    }
    if (message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
