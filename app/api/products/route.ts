import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { releaseExpiredReservations } from '@/lib/cleanup'

export async function GET() {
  await releaseExpiredReservations()

  const products = await prisma.product.findMany({
    include: {
      stockLevels: {
        include: { warehouse: true }
      }
    }
  })

  const result = products.map(p => ({
    ...p,
    stockLevels: p.stockLevels.map(s => ({
      ...s,
      availableUnits: s.totalUnits - s.reservedUnits
    }))
  }))

  return NextResponse.json(result)
}
