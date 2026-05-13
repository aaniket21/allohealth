import { NextRequest, NextResponse } from 'next/server'
import { releaseReservation } from '@/lib/reservations'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const reservation = await releaseReservation(id)
    return NextResponse.json(reservation)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Cannot release this reservation' }, { status: 400 })
  }
}
