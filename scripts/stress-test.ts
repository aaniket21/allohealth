import 'dotenv/config'

const API_URL = process.env.API_URL || 'http://localhost:3000'

async function main() {
  console.log(`🚀 Starting Concurrency Stress Test against ${API_URL}`)
  const res = await fetch(`${API_URL}/api/products`)
  if (!res.ok) {
    throw new Error('Failed to fetch products. Is the server running?')
  }
  const products = await res.json()
  let targetProduct = null
  let targetWarehouse = null

  for (const product of products) {
    const stockLevel = product.stockLevels.find((s: any) => s.availableUnits === 1)
    if (stockLevel) {
      targetProduct = product
      targetWarehouse = stockLevel.warehouse
      break
    }
  }

  if (!targetProduct || !targetWarehouse) {
    console.log('⚠️ Could not find a product with exactly 1 unit available.')
    console.log('Please reset the database or use a different target.')
    return
  }

  console.log(`🎯 Target acquired: ${targetProduct.name} at ${targetWarehouse.name}`)
  console.log(`📦 Available stock: 1 unit`)
  console.log(`💥 Firing 100 simultaneous reservation requests...`)

  const numRequests = 100
  const promises = []

  for (let i = 0; i < numRequests; i++) {
    promises.push(
      fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: targetProduct.id,
          warehouseId: targetWarehouse.id,
          quantity: 1
        })
      })
    )
  }

  const startTime = Date.now()
  const results = await Promise.all(promises)
  const endTime = Date.now()
  let successCount = 0
  let conflictCount = 0
  let otherErrorCount = 0

  for (const r of results) {
    if (r.status === 201) successCount++
    else if (r.status === 409) conflictCount++
    else otherErrorCount++
  }

  console.log(`\n📊 Results (completed in ${endTime - startTime}ms):`)
  console.log(`✅ Success (201 Created): ${successCount}`)
  console.log(`⛔ Conflict (409 Out of Stock): ${conflictCount}`)
  
  if (otherErrorCount > 0) {
    console.log(`⚠️ Other Errors (likely DB transaction timeouts due to connection pool queueing): ${otherErrorCount}`)
  }

  if (successCount === 1) {
    console.log(`\n🎉 STRESS TEST PASSED: Concurrency controls successfully prevented overselling!`)
  } else {
    console.log(`\n❌ STRESS TEST FAILED: Expected exactly 1 success, got ${successCount}.`)
  }
}

main().catch(console.error)
