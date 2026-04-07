import { PrismaClient } from '@prisma/client'
import { decryptValue } from './src/utils/crypto.js'

const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.category.findMany({
    where: {
      colorEncrypted: { not: null }
    }
  })

  console.log(`Found ${categories.length} categories with encrypted colors`)

  for (const cat of categories) {
    try {
      const decrypted = decryptValue(cat.colorEncrypted, 'category-color')
      await prisma.category.update({
        where: { id: cat.id },
        data: { color: decrypted }
      })
      console.log(`✓ Migrated ${cat.id}: ${decrypted}`)
    } catch (e) {
      console.error(`✗ Failed to decrypt ${cat.id}:`, e.message)
    }
  }

  await prisma.$disconnect()
  console.log('Migration complete!')
}

main().catch(console.error)
