import bcrypt from 'bcryptjs'
import { encryptValue, decryptValue } from '../utils/crypto.js'

const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'AUD']
const DEFAULT_CURRENCY = 'EUR'

export default async function userRoutes(fastify: any) {
  async function requireAuth(req, reply) {
    try {
      await req.jwtVerify()
    } catch (error) {
      return reply.code(401).send({ error: 'Non autorisé.', code: 'UNAUTHORIZED' })
    }
  }

  fastify.get('/api/user', {
    schema: {
      summary: 'Récupérer les données du compte connecté',
      tags: ['user'],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            settings: { type: 'object', additionalProperties: { type: 'string' } },
          },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req) => {
    const userId = req.user.userId
    const params = await fastify.prisma.userParam.findMany({ where: { userId } })

    const settings: Record<string, string> = {}
    params.forEach((param) => {
      try {
        settings[param.key] = decryptValue(param.valueEncrypted, 'user-settings')
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        fastify.log.warn({ userId, key: param.key, error: message }, 'Failed to decrypt user setting')
      }
    })

    return { id: userId, settings }
  })

  fastify.put('/api/user', {
    schema: {
      summary: 'Mettre à jour les paramètres du compte',
      tags: ['user'],
      body: {
        type: 'object',
        properties: {
          currency: { type: 'string', enum: SUPPORTED_CURRENCIES },
          device:   { type: 'string', nullable: true },
        },
        additionalProperties: false,
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            settings: { type: 'object', additionalProperties: { type: 'string' } },
          },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req) => {
    const userId = req.user.userId
    const currency = req.body.currency ?? DEFAULT_CURRENCY
    const device = req.body.device ?? null

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return req.reply.code(422).send({
        error: 'Devise non prise en charge.',
        code: 'UNSUPPORTED_CURRENCY',
      })
    }

    const encryptedValue = encryptValue(currency, 'user-settings')

    await fastify.prisma.userParam.upsert({
      where: { userId_key: { userId, key: 'currency' } },
      update: { valueEncrypted: encryptedValue, device },
      create: { userId, key: 'currency', valueEncrypted: encryptedValue, device },
    })

    const settings = { currency }
    return { id: userId, settings }
  })

  fastify.delete('/api/user', {
    schema: {
      summary: 'Supprimer le compte utilisateur et toutes les données associées',
      tags: ['user'],
      response: {
        200: {
          type: 'object',
          properties: { deleted: { type: 'boolean' } },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req) => {
    const userId = req.user.userId
    await fastify.prisma.user.delete({ where: { id: userId } })
    return { deleted: true }
  })

  fastify.get('/api/user/export', {
    schema: {
      summary: 'Exporter les données de l’utilisateur',
      tags: ['user'],
      response: {
        200: {
          type: 'object',
          properties: {
            params: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  value: { type: 'string' },
                },
              },
            },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req) => {
    const userId = req.user.userId
    const params = await fastify.prisma.userParam.findMany({ where: { userId } })
    const categories = await fastify.prisma.category.findMany({
      where: { userId },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    return {
      params: params.map((param) => ({
        key: param.key,
        value: decryptValue(param.valueEncrypted, 'user-settings'),
      })),
      categories: categories.map((category) => ({
        id: category.id,
        name: decryptValue(category.nameEncrypted, 'category-name'),
        parentId: category.parentId,
        position: category.position,
      })),
    }
  })

  fastify.post('/api/user/import', {
    schema: {
      summary: 'Importer les données de l’utilisateur',
      tags: ['user'],
      body: {
        type: 'object',
        properties: {
          params: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                value: { type: 'string' },
              },
            },
          },
          categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                parentId: { type: ['string', 'null'], format: 'uuid' },
                position: { type: 'integer' },
              },
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: { imported: { type: 'boolean' } },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req) => {
    const userId = req.user.userId
    const { params = [], categories = [] } = req.body

    // Delete existing
    await fastify.prisma.category.deleteMany({ where: { userId } })
    await fastify.prisma.userParam.deleteMany({ where: { userId } })

    // Create new
    for (const param of params) {
      await fastify.prisma.userParam.create({
        data: {
          userId,
          key: param.key,
          valueEncrypted: encryptValue(param.value, 'user-settings'),
        },
      })
    }

    for (const category of categories) {
      await fastify.prisma.category.create({
        data: {
          id: category.id,
          userId,
          parentId: category.parentId ?? null,
          position: category.position ?? null,
          nameEncrypted: encryptValue(category.name, 'category-name'),
        },
      })
    }

    return { imported: true }
  })

  fastify.get('/api/categories', {
    schema: {
      summary: 'Lister les catégories de dépenses d’un utilisateur',
      tags: ['categories'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id:        { type: 'string', format: 'uuid' },
              name:      { type: 'string' },
              color:     { type: ['string', 'null'] },
              parentId:  { type: ['string', 'null'] },
              position:  { type: ['integer', 'null'] },
              itemCount: { type: 'integer' },
            },
          },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req) => {
    const userId = req.user.userId
    const categories = await fastify.prisma.category.findMany({
      where: { userId },
      include: { _count: { select: { operations: true } } },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    return categories.map((category) => ({
      id:        category.id,
      name:      decryptValue(category.nameEncrypted, 'category-name'),
      color:     category.color || null,
      parentId:  category.parentId,
      position:  category.position,
      itemCount: category._count.operations,
    }))
  })

  fastify.post('/api/categories', {
    schema: {
      summary: 'Créer une catégorie de dépenses',
      tags: ['categories'],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name:     { type: 'string', minLength: 1 },
          color:    { type: ['string', 'null'] },
          parentId: { type: ['string', 'null'] },
          position: { type: 'integer', minimum: 0 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id:       { type: 'string', format: 'uuid' },
            name:     { type: 'string' },
            color:    { type: ['string', 'null'] },
            parentId: { type: ['string', 'null'] },
            position: { type: ['integer', 'null'] },
          },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req, reply) => {
    const userId = req.user.userId
    const name = req.body.name.trim()
    if (!name) {
      return reply.code(422).send({ error: 'Le nom de catégorie est obligatoire.', code: 'INVALID_CATEGORY_NAME' })
    }

    const category = await fastify.prisma.category.create({
      data: {
        userId,
        parentId: req.body.parentId ?? null,
        position: req.body.position ?? null,
        nameEncrypted: encryptValue(name, 'category-name'),
        color: req.body.color ?? '#6366f1', // Couleur par défaut si non spécifiée
      },
    })

    return reply.code(201).send({ 
      id: category.id, 
      name, 
      color: req.body.color ?? null,
      parentId: category.parentId, 
      position: category.position 
    })
  })

  fastify.put('/api/categories/:id', {
    schema: {
      summary: 'Mettre à jour une catégorie de dépenses',
      tags: ['categories'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name:     { type: 'string', minLength: 1 },
          color:    { type: ['string', 'null'] },
          parentId: { type: ['string', 'null'] },
          position: { type: ['integer', 'null'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: { updated: { type: 'boolean' } },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req, reply) => {
    const userId = req.user.userId
    const { id } = req.params
    const { name, color, parentId, position } = req.body

    const category = await fastify.prisma.category.findFirst({ where: { id, userId } })
    if (!category) {
      return reply.code(404).send({ error: 'Catégorie introuvable.', code: 'CATEGORY_NOT_FOUND' })
    }

    // Valider le nom si fourni
    if (name !== undefined) {
      const trimmedName = name.trim()
      if (!trimmedName) {
        return reply.code(422).send({ error: 'Le nom de catégorie est obligatoire.', code: 'INVALID_CATEGORY_NAME' })
      }
    }

    // Valider la profondeur max = 1 niveau
    if (parentId !== undefined && parentId !== null) {
      const parent = await fastify.prisma.category.findFirst({ where: { id: parentId, userId } })
      if (!parent) {
        return reply.code(404).send({ error: 'Catégorie parent introuvable.', code: 'PARENT_NOT_FOUND' })
      }
      if (parent.parentId) {
        return reply.code(422).send({ error: 'Profondeur max 1 niveau atteinte.', code: 'MAX_DEPTH_REACHED' })
      }
      // La catégorie ne peut pas devenir enfant si elle a elle-même des enfants
      const childrenCount = await fastify.prisma.category.count({ where: { parentId: id, userId } })
      if (childrenCount > 0) {
        return reply.code(422).send({ error: 'Cette catégorie a des sous-catégories.', code: 'HAS_CHILDREN' })
      }
    }

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.nameEncrypted = encryptValue(name.trim(), 'category-name')
    if (color !== undefined) updateData.color = color ?? null
    if (parentId !== undefined) updateData.parentId = parentId
    if (position !== undefined) updateData.position = position

    await fastify.prisma.category.update({
      where: { id },
      data: updateData,
    })

    return { updated: true }
  })

  fastify.delete('/api/categories/:id', {
    schema: {
      summary: 'Supprimer une catégorie de dépenses',
      tags: ['categories'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: { deleted: { type: 'boolean' } },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req, reply) => {
    const userId = req.user.userId
    const { id } = req.params

    const category = await fastify.prisma.category.findFirst({ where: { id, userId } })
    if (!category) {
      return reply.code(404).send({ error: 'Catégorie introuvable.', code: 'CATEGORY_NOT_FOUND' })
    }

    // Détacher les enfants (les remonter à la racine) avant de supprimer
    await fastify.prisma.category.updateMany({ where: { parentId: id, userId }, data: { parentId: null } })
    // Les dépenses liées perdent leur catégorie automatiquement (onDelete: SetNull)
    await fastify.prisma.category.delete({ where: { id } })

    return { deleted: true }
  })

  fastify.post('/api/account/export', {
    schema: {
      summary: "Exporter les données de l'utilisateur avec confirmation",
      tags: ['user'],
      body: {
        type: 'object',
        properties: {
          password: { type: 'string' },
        },
        required: ['password'],
      },
    },
    preHandler: requireAuth,
  }, async (req, reply) => {
    const userId = req.user.userId
    const { password } = req.body

    // Vérifier le mot de passe
    const user = await fastify.prisma.user.findUnique({ where: { id: userId } })
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return reply.code(401).send({ error: 'Mot de passe incorrect.', code: 'INVALID_PASSWORD' })
    }

    // Récupérer les données
    const categories = await fastify.prisma.category.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
    const items = await fastify.prisma.operation.findMany({ where: { userId }, include: { category: true }, orderBy: { createdAt: 'asc' } })
    const params = await fastify.prisma.userParam.findMany({ where: { userId } })

    // Formatter les paramètres
    const formattedParams = params.map((param) => ({
      key: param.key,
      value: decryptValue(param.valueEncrypted, 'user-settings'),
    }))

    // Formatter les catégories
    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: decryptValue(category.nameEncrypted, 'category-name'),
      color: category.color || null,
      parentId: category.parentId,
      position: category.position,
    }))

    // Formatter les items avec catégories
    const formattedItems = items.map((item) => ({
      id: item.id,
      title: decryptValue(item.titleEncrypted, 'operation-title'),
      amount: parseFloat(decryptValue(item.amountEncrypted, 'operation-amount')),
      date: item.date.toISOString().split('T')[0],
      type: item.type || 'expense',
      isRecurring: item.isRecurring,
      recurrence: item.recurrence || null,
      description: item.description || null,
      categoryId: item.categoryId,
      categoryName: item.category ? decryptValue(item.category.nameEncrypted, 'category-name') : null,
    }))

    return {
      accountId: userId,
      exportDate: new Date().toISOString(),
      params: formattedParams,
      categories: formattedCategories,
      items: formattedItems,
    }
  })

  fastify.post('/api/account/import', {
    schema: {
      summary: 'Importer des données de compte et des catégories',
      tags: ['user'],
      body: {
        type: 'object',
        properties: {
          categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' } },
              required: ['name'],
            },
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: ['string', 'null'] },
                categoryName: { type: 'string' },
              },
              required: ['title'],
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            imported: {
              type: 'object',
              properties: {
                categories: { type: 'number' },
                items: { type: 'number' },
              },
            },
          },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req) => {
    const userId = req.user.userId
    const categoriesInput = Array.isArray(req.body.categories) ? req.body.categories : []
    const itemsInput = Array.isArray(req.body.items) ? req.body.items : []

    const createdCategories: Array<{ id: string, name: string }> = []
    const categoryMap = new Map<string, string>()

    for (const category of categoriesInput) {
      const name = category.name?.trim()
      if (!name) continue
      const created = await fastify.prisma.category.create({
        data: {
          userId,
          nameEncrypted: encryptValue(name, 'category-name'),
        },
      })
      const normalized = name.toLowerCase()
      categoryMap.set(normalized, created.id)
      createdCategories.push({ id: created.id, name })
    }

    let createdItems = 0
    for (const item of itemsInput) {
      const title = item.title?.trim()
      if (!title) continue
      const payload: Record<string, any> = {
        userId,
        titleEncrypted: encryptValue(item.title?.trim(), 'operation-title'),
        amountEncrypted: encryptValue((item.amount ?? 0).toString(), 'operation-amount'),
        date: item.date ? new Date(item.date) : new Date(),
        type: item.type || 'expense',
        isRecurring: item.isRecurring || false,
        recurrence: item.recurrence || null,
        description: item.description?.trim() ?? null,
      }

      if (typeof item.categoryName === 'string' && item.categoryName.trim()) {
        const categoryId = categoryMap.get(item.categoryName.trim().toLowerCase())
        if (categoryId) payload.categoryId = categoryId
      }

      await fastify.prisma.operation.create({ data: payload })
      createdItems += 1
    }

    return { imported: { categories: createdCategories.length, items: createdItems } }
  })

  // Helper: formater une dépense enrichie
  const RECURRENCE_LABELS = {
    daily:    'Quotidienne',
    weekly:   'Hebdomadaire',
    biweekly: 'Une semaine sur deux',
    monthly:  'Mensuelle',
    bimonthly:'Un mois sur deux',
    yearly:   'Annuelle',
  }

  function formatExpense(expense) {
    return {
      id: expense.id,
      title: decryptValue(expense.titleEncrypted, 'operation-title'),
      amount: parseFloat(decryptValue(expense.amountEncrypted, 'operation-amount')),
      type: expense.type || 'expense',
      date: expense.date.toISOString().split('T')[0],
      isRecurring: expense.isRecurring,
      recurrence: expense.recurrence || null,
      recurrenceLabel: expense.recurrence ? (RECURRENCE_LABELS[expense.recurrence] ?? expense.recurrence) : null,
      description: expense.description || null,
      category: expense.category ? {
        id: expense.category.id,
        name: decryptValue(expense.category.nameEncrypted, 'category-name'),
        color: expense.category.color || null,
        parentId: expense.category.parentId || null,
      } : null,
    }
  }

  async function createOperation(data) {
    return fastify.prisma.operation.create({
      data: {
        userId: data.userId,
        titleEncrypted: encryptValue(data.title.trim(), 'operation-title'),
        amountEncrypted: encryptValue(data.amount.toString(), 'operation-amount'),
        date: new Date(data.date),
        type: data.type || 'expense',
        isRecurring: data.isRecurring || false,
        recurrence: data.recurrence ?? null,
        categoryId: data.categoryId || null,
        description: data.description?.trim() || null,
        recurrenceRuleId: data.recurrenceRuleId || null,
      },
      include: { category: { select: { id: true, nameEncrypted: true, color: true, parentId: true } } },
    })
  }

  async function createRecurrenceRule(data) {
    return fastify.prisma.recurrenceRule.create({
      data: {
        userId: data.userId,
        titleEncrypted: encryptValue(data.title.trim(), 'operation-title'),
        amountEncrypted: encryptValue(data.amount.toString(), 'operation-amount'),
        startDate: new Date(data.date),
        recurrence: data.recurrence,
        type: data.type || 'expense',
        categoryId: data.categoryId || null,
        description: data.description?.trim() || null,
      },
    })
  }

  // ── GET /api/user/expenses/recent ───────────────────────
  fastify.get('/api/user/expenses/recent', {
    schema: {
      summary: 'Récupérer les 3 dernières dépenses',
      tags: ['expenses'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 10, default: 3 },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req) => {
    const userId = req.user.userId
    const limit = req.query.limit ?? 3

    const expenses = await fastify.prisma.operation.findMany({
      where: { userId },
      include: { category: { select: { id: true, nameEncrypted: true, color: true, parentId: true } } },
      orderBy: { date: 'desc' },
      take: limit,
    })

    return expenses.map(formatExpense)
  })

  // ── GET /api/user/expenses ──────────────────────────────
  fastify.get('/api/user/expenses', {
    schema: {
      summary: 'Récupérer les dépenses de l\'utilisateur (paginées)',
      tags: ['expenses'],
      querystring: {
        type: 'object',
        properties: {
          limit:  { type: 'integer', minimum: 1, maximum: 100, default: 15 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
              },
            },
            total:  { type: 'integer' },
            hasMore:{ type: 'boolean' },
          },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req) => {
    const userId = req.user.userId
    const limit  = req.query.limit  ?? 15
    const offset = req.query.offset ?? 0

    const [expenses, total] = await Promise.all([
      fastify.prisma.operation.findMany({
        where: { userId },
        include: { category: { select: { id: true, nameEncrypted: true, color: true, parentId: true } } },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      fastify.prisma.operation.count({ where: { userId } }),
    ])

    return {
      data: expenses.map(formatExpense),
      total,
      hasMore: offset + limit < total,
    }
  })

  // ── POST /api/user/expenses ─────────────────────────────
  fastify.post('/api/user/expenses', {
    schema: {
      summary: 'Créer une nouvelle dépense',
      tags: ['expenses'],
      body: {
        type: 'object',
        required: ['title', 'amount', 'date', 'type'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          amount: { type: 'number', minimum: 0.01 },
          date: { type: 'string', format: 'date' },
          type: { type: 'string', enum: ['expense', 'credit'], default: 'expense' },
          categoryId: { type: 'string', format: 'uuid' },
          isRecurring: { type: 'boolean' },
          recurrence: { type: ['string', 'null'], enum: ['daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'yearly'] },
          description: { type: 'string', maxLength: 1000 },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req, reply) => {
    const userId = req.user.userId
    let { title, amount, date, type, categoryId, isRecurring, recurrence, description } = req.body

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      return reply.code(400).send({ error: 'Le titre ne peut pas être vide.', code: 'EMPTY_TITLE' })
    }

    if (categoryId) {
      const category = await fastify.prisma.category.findFirst({ where: { id: categoryId, userId } })
      if (!category) {
        return reply.code(400).send({ error: 'Catégorie invalide.', code: 'INVALID_CATEGORY' })
      }
    }

    let expense
    if (isRecurring && recurrence) {
      const recurrenceRule = await createRecurrenceRule({
        userId,
        title: trimmedTitle,
        amount,
        date,
        type,
        categoryId,
        recurrence,
        description,
      })

      expense = await createOperation({
        userId,
        title: trimmedTitle,
        amount,
        date,
        type,
        isRecurring: true,
        recurrence,
        categoryId,
        description,
        recurrenceRuleId: recurrenceRule.id,
      })
    } else {
      expense = await createOperation({
        userId,
        title: trimmedTitle,
        amount,
        date,
        type,
        isRecurring: false,
        recurrence: null,
        categoryId,
        description,
      })
    }

    return reply.code(201).send(formatExpense(expense))
  })

  // ── PUT /api/user/expenses/:id ──────────────────────────
  fastify.put('/api/user/expenses/:id', {
    schema: {
      summary: 'Modifier une dépense existante',
      tags: ['expenses'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          amount: { type: 'number', minimum: 0.01 },
          date: { type: 'string', format: 'date' },
          type: { type: 'string', enum: ['expense', 'credit'] },
          categoryId: { type: 'string', format: 'uuid' },
          isRecurring: { type: 'boolean' },
          recurrence: { type: 'string', enum: ['daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'yearly'] },
          description: { type: 'string', maxLength: 1000 },
        },
      },
    },
    preHandler: requireAuth,
  }, async (req, reply) => {
    const userId = req.user.userId
    const { id } = req.params
    const { title, amount, date, type, categoryId, isRecurring, recurrence, description } = req.body

    const expense = await fastify.prisma.operation.findFirst({ where: { id, userId } })

    if (!expense) {
      return reply.code(404).send({ error: 'Dépense non trouvée.', code: 'EXPENSE_NOT_FOUND' })
    }

    if (title !== undefined) {
      const trimmedTitle = title.trim()
      if (!trimmedTitle) {
        return reply.code(400).send({ error: 'Le titre ne peut pas être vide.', code: 'EMPTY_TITLE' })
      }
    }

    if (categoryId) {
      const category = await fastify.prisma.category.findFirst({ where: { id: categoryId, userId } })
      if (!category) {
        return reply.code(400).send({ error: 'Catégorie invalide.', code: 'INVALID_CATEGORY' })
      }
    }

    const updated = await fastify.prisma.operation.update({
      where: { id },
      data: {
        titleEncrypted: title !== undefined ? encryptValue(title.trim(), 'operation-title') : expense.titleEncrypted,
        amountEncrypted: amount !== undefined ? encryptValue(amount.toString(), 'operation-amount') : expense.amountEncrypted,
        date: date ? new Date(date) : expense.date,
        type: type ?? expense.type,
        isRecurring: isRecurring ?? expense.isRecurring,
        recurrence: isRecurring ? (recurrence ?? expense.recurrence) : (recurrence !== undefined ? null : expense.recurrence),
        categoryId: categoryId ?? expense.categoryId,
        description: description?.trim() ?? expense.description,
      },
      include: { category: { select: { id: true, nameEncrypted: true, color: true, parentId: true } } },
    })

    if (expense.recurrenceRuleId) {
      const ruleData: Record<string, any> = {}
      if (title !== undefined) ruleData.titleEncrypted = encryptValue(title.trim(), 'operation-title')
      if (amount !== undefined) ruleData.amountEncrypted = encryptValue(amount.toString(), 'operation-amount')
      if (date !== undefined) ruleData.startDate = new Date(date)
      if (recurrence !== undefined) ruleData.recurrence = recurrence
      if (type !== undefined) ruleData.type = type
      if (categoryId !== undefined) ruleData.categoryId = categoryId || null
      if (description !== undefined) ruleData.description = description?.trim() ?? null

      if (Object.keys(ruleData).length > 0) {
        await fastify.prisma.recurrenceRule.update({
          where: { id: expense.recurrenceRuleId },
          data: ruleData,
        })
      }
    }

    return reply.code(200).send(formatExpense(updated))
  })

  // ── DELETE /api/user/expenses/:id ───────────────────────
  fastify.delete('/api/user/expenses/:id', {
    schema: {
      summary: 'Supprimer une dépense',
      tags: ['expenses'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
    preHandler: requireAuth,
  }, async (req, reply) => {
    const userId = req.user.userId
    const { id } = req.params

    const expense = await fastify.prisma.operation.findFirst({ where: { id, userId } })

    if (!expense) {
      return reply.code(404).send({ error: 'Dépense non trouvée.', code: 'EXPENSE_NOT_FOUND' })
    }

    if (expense.recurrenceRuleId) {
      const recurrenceRule = await fastify.prisma.recurrenceRule.findUnique({ where: { id: expense.recurrenceRuleId } })
      if (recurrenceRule && expense.date.toISOString().split('T')[0] === recurrenceRule.startDate.toISOString().split('T')[0]) {
        await fastify.prisma.recurrenceRule.delete({ where: { id: recurrenceRule.id } })
      }
    }

    await fastify.prisma.operation.delete({ where: { id } })

    return reply.code(200).send({ success: true })
  })
}
