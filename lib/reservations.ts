import { prisma } from './prisma'

type StockRow = {
  id: string
  productId: string
  warehouseId: string
  totalUnits: number
  reservedUnits: number
}

export async function createReservation(
  productId: string,
  warehouseId: string,
  quantity: number,
  idempotencyKey?: string
) {
  if (idempotencyKey) {
    const existing = await prisma.reservation.findUnique({
      where: { idempotencyKey }
    })
    if (existing) return existing
  }

  return await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<StockRow[]>`
      SELECT * FROM "StockLevel"
      WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
      FOR UPDATE
    `

    const stock = rows[0]
    if (!stock) throw new Error('STOCK_NOT_FOUND')

    const available = stock.totalUnits - stock.reservedUnits
    if (available < quantity) throw new Error('INSUFFICIENT_STOCK')

    await tx.$executeRaw`
      UPDATE "StockLevel"
      SET "reservedUnits" = "reservedUnits" + ${quantity}
      WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
    `

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    return await tx.reservation.create({
      data: {
        productId,
        warehouseId,
        quantity,
        status: 'PENDING',
        expiresAt,
        idempotencyKey: idempotencyKey ?? null,
      },
      include: { product: true, warehouse: true }
    })
  })
}
