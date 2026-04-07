/**
 * Seed script — Abyss
 * Crée un utilisateur alice@example.com avec des données de test.
 * Usage : node prisma/seed.js
 */

import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { hashEmail, encryptEmail, encryptValue } from '../src/utils/crypto.js'

dotenv.config()

const prisma = new PrismaClient()

const ALICE_ID   = '550e8400-e29b-41d4-a716-446655440001'
const EMAIL      = 'alice@example.com'
const PASSWORD   = 'password123'

const CATEGORIES = [
  { id: '650e8400-e29b-41d4-a716-446655440011', name: 'Alimentation',  position: 0, color: '#FF6B6B' },
  { id: '650e8400-e29b-41d4-a716-446655440012', name: 'Transport',     position: 1, color: '#4ECDC4' },
  { id: '650e8400-e29b-41d4-a716-446655440013', name: 'Logement',      position: 2, color: '#45B7D1' },
  { id: '650e8400-e29b-41d4-a716-446655440014', name: 'Santé',         position: 3, color: '#96CEB4' },
  { id: '650e8400-e29b-41d4-a716-446655440015', name: 'Loisirs',       position: 4, color: '#FFEAA7' },
  { id: '650e8400-e29b-41d4-a716-446655440016', name: 'Abonnements',   position: 5, color: '#DDA0DD' },
]

const ITEMS = [
  { id: '750e8400-e29b-41d4-a716-446655440001', categoryIdx: 0, title: 'Courses Lidl',       amount: 78.40,   date: '2026-04-05', type: 'expense',  isRecurring: false },
  { id: '750e8400-e29b-41d4-a716-446655440002', categoryIdx: 0, title: 'Restaurant midi',    amount: 14.50,   date: '2026-04-03', type: 'expense',  isRecurring: false },
  { id: '750e8400-e29b-41d4-a716-446655440003', categoryIdx: 1, title: 'Essence voiture',    amount: 52.00,   date: '2026-04-02', type: 'expense',  isRecurring: false },
  { id: '750e8400-e29b-41d4-a716-446655440004', categoryIdx: 1, title: 'Pass Navigo',        amount: 86.40,   date: '2026-04-01', type: 'expense',  isRecurring: true,  recurrence: 'monthly' },
  { id: '750e8400-e29b-41d4-a716-446655440005', categoryIdx: 2, title: 'Loyer',              amount: 850.00,  date: '2026-04-01', type: 'expense',  isRecurring: true,  recurrence: 'monthly' },
  { id: '750e8400-e29b-41d4-a716-446655440006', categoryIdx: 2, title: 'Électricité',        amount: 43.20,   date: '2026-04-03', type: 'expense',  isRecurring: false },
  { id: '750e8400-e29b-41d4-a716-446655440007', categoryIdx: 4, title: 'Netflix',            amount: 15.99,   date: '2026-04-01', type: 'expense',  isRecurring: true,  recurrence: 'monthly' },
  { id: '750e8400-e29b-41d4-a716-446655440008', categoryIdx: 4, title: 'Cinéma',             amount: 11.50,   date: '2026-04-04', type: 'expense',  isRecurring: false },
  { id: '750e8400-e29b-41d4-a716-446655440009', categoryIdx: null, title: 'Salaire',         amount: 2500.00, date: '2026-04-01', type: 'credit',   isRecurring: true,  recurrence: 'monthly' },
  { id: '750e8400-e29b-41d4-a716-446655440010', categoryIdx: null, title: 'Remboursement',   amount: 25.00,   date: '2026-04-02', type: 'credit',   isRecurring: false },
]

async function seed() {
  console.log('🌱 Seed Abyss...')

  // ── Supprimer les données existantes pour Alice ──────────────
  await prisma.item.deleteMany({ where: { userId: ALICE_ID } })
  await prisma.category.deleteMany({ where: { userId: ALICE_ID } })
  await prisma.userParam.deleteMany({ where: { userId: ALICE_ID } })
  await prisma.user.deleteMany({ where: { id: ALICE_ID } })
  console.log('  ✓ Données précédentes supprimées')

  // ── Créer l'utilisateur ──────────────────────────────────────
  const authSalt    = 'a1b2c3d4e5f6a7b8a1b2c3d4e5f6a7b8'
  const keySalt     = 'b2c3d4e5f6a7b8c9b2c3d4e5f6a7b8c9'
  const keyFragment = 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8'
  const passwordHash = await bcrypt.hash(PASSWORD, 12)

  await prisma.user.create({
    data: {
      id:             ALICE_ID,
      emailHash:      hashEmail(EMAIL),
      emailEncrypted: encryptEmail(EMAIL),
      passwordHash,
      authSalt,
      keySalt,
      keyFragment,
    },
  })
  console.log(`  ✓ Utilisateur alice@example.com créé (id: ${ALICE_ID})`)

  // ── UserParam : devise ───────────────────────────────────────
  await prisma.userParam.create({
    data: {
      userId:         ALICE_ID,
      key:            'currency',
      valueEncrypted: encryptValue('EUR', 'user-settings'),
    },
  })

  // ── Catégories ───────────────────────────────────────────────
  for (const cat of CATEGORIES) {
    await prisma.category.create({
      data: {
        id:            cat.id,
        userId:        ALICE_ID,
        nameEncrypted: encryptValue(cat.name, 'category-name'),
        colorEncrypted: cat.color ? encryptValue(cat.color, 'category-color') : null,
        position:      cat.position,
      },
    })
  }
  console.log(`  ✓ ${CATEGORIES.length} catégories créées`)

  // ── Items (dépenses / crédits) ────────────────────────────────
  for (const item of ITEMS) {
    const categoryId = item.categoryIdx !== null
      ? CATEGORIES[item.categoryIdx].id
      : null

    await prisma.item.create({
      data: {
        id:          item.id,
        userId:      ALICE_ID,
        categoryId,
        title:       item.title,
        amount:      item.amount,
        date:        new Date(item.date),
        type:        item.type,
        isRecurring: item.isRecurring || false,
        recurrence:  item.recurrence || null,
      },
    })
  }
  console.log(`  ✓ ${ITEMS.length} opérations créées`)

  console.log('\n✅  Seed terminé !')
  console.log('   Email    : alice@example.com')
  console.log('   Password : password123')
}

seed()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
