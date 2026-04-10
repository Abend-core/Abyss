import { PrismaClient } from '@prisma/client'
import { decryptValue } from './src/utils/crypto.js'

const prisma = new PrismaClient()

async function checkDuplicateNames() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        userId: true,
        nameEncrypted: true,
        color: true
      }
    })

    const userCategories = {}

    // Grouper par utilisateur
    categories.forEach(cat => {
      if (!userCategories[cat.userId]) {
        userCategories[cat.userId] = []
      }
      userCategories[cat.userId].push(cat)
    })

    let hasDuplicates = false

    // Pour chaque utilisateur, vérifier les doublons de noms déchiffrés
    for (const [userId, cats] of Object.entries(userCategories)) {
      const nameMap = new Map()

      for (const cat of cats) {
        try {
          const decryptedName = decryptValue(cat.nameEncrypted, 'category-name')
          if (nameMap.has(decryptedName)) {
            console.log(`DUPLICATE FOUND for user ${userId}:`)
            console.log(`  Name: "${decryptedName}"`)
            console.log(`  Category 1: ${nameMap.get(decryptedName)}`)
            console.log(`  Category 2: ${cat.id}`)
            console.log(`  Encrypted names: "${nameMap.get(decryptedName + '_encrypted')}" vs "${cat.nameEncrypted}"`)
            hasDuplicates = true
          } else {
            nameMap.set(decryptedName, cat.id)
            nameMap.set(decryptedName + '_encrypted', cat.nameEncrypted)
          }
        } catch (error) {
          console.log(`Error decrypting category ${cat.id}:`, error.message)
        }
      }
    }

    if (!hasDuplicates) {
      console.log('No duplicate category names found!')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicateNames()