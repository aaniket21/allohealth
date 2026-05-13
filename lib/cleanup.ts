import { prisma } from './prisma'

export async function releaseExpiredReservations() {
  const expired = await prisma.reservation.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() }
    }
  })

  for (const r of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "StockLevel"
        SET "reservedUnits" = "reservedUnits" - ${r.quantity}
        WHERE "productId" = ${r.productId}
          AND "warehouseId" = ${r.warehouseId}
      `
      await tx.reservation.update({
        where: { id: r.id },
        data: { status: 'RELEASED' }
      })
    })
  }
}
