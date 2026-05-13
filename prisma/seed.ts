import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const delhi = await prisma.warehouse.create({
    data: { name: 'Delhi Warehouse', location: 'New Delhi, India' }
  })
  const mumbai = await prisma.warehouse.create({
    data: { name: 'Mumbai Warehouse', location: 'Mumbai, India' }
  })

  const earbuds = await prisma.product.create({
    data: { name: 'Wireless Earbuds Pro', description: 'Premium sound, 30hr battery', price: 2999 }
  })
  const watch = await prisma.product.create({
    data: { name: 'Smart Health Watch', description: 'Track vitals and sleep', price: 4999 }
  })
  const bottle = await prisma.product.create({
    data: { name: 'Smart Water Bottle', description: 'Temperature tracking', price: 799 }
  })

  await prisma.stockLevel.createMany({
    data: [
      { productId: earbuds.id, warehouseId: delhi.id, totalUnits: 10, reservedUnits: 0 },
      { productId: earbuds.id, warehouseId: mumbai.id, totalUnits: 1, reservedUnits: 0 },
      { productId: watch.id, warehouseId: delhi.id, totalUnits: 8, reservedUnits: 0 },
      { productId: watch.id, warehouseId: mumbai.id, totalUnits: 3, reservedUnits: 0 },
      { productId: bottle.id, warehouseId: delhi.id, totalUnits: 25, reservedUnits: 0 },
      { productId: bottle.id, warehouseId: mumbai.id, totalUnits: 2, reservedUnits: 0 },
    ]
  })

  console.log('✅ Seed complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())
