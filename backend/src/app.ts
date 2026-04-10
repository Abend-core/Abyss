/**
 * app.js — Factory Fastify pour Abyss API
 *
 * Exporte buildApp(opts) utilisé à la fois par server.js (production)
 * et par les tests (avec Prisma mocké, logger désactivé).
 *
 * Usage production :
 *   const app = await buildApp()
 *
 * Usage test :
 *   const app = await buildApp({ testing: true, prisma: mockPrisma })
 */

import Fastify     from 'fastify'
import type { FastifyInstance } from 'fastify'
import cors        from '@fastify/cors'
import helmet      from '@fastify/helmet'
import jwt         from '@fastify/jwt'
import swagger     from '@fastify/swagger'
import swaggerUi   from '@fastify/swagger-ui'
import { formatDate, getRecurrenceDatesUpTo } from './utils/recurrence.js'

async function createMissingRecurringOperations(fastify: any) {
  const today = formatDate(new Date())

  const rules = await fastify.prisma.recurrenceRule.findMany({
    where: { startDate: { lte: new Date(today) } },
  })

  for (const rule of rules) {
    const dueDates = getRecurrenceDatesUpTo(rule.startDate, rule.recurrence, today)
    if (dueDates.length === 0) continue

    const existingOperations = await fastify.prisma.operation.findMany({
      where: {
        recurrenceRuleId: rule.id,
        date: { in: dueDates.map((date) => new Date(date)) },
      },
      select: { date: true },
    })

    const existingDates = new Set(existingOperations.map((operation: any) => formatDate(operation.date)))
    const missingDates = dueDates.filter((date) => !existingDates.has(date))

    for (const date of missingDates) {
      await fastify.prisma.operation.create({
        data: {
          userId: rule.userId,
          categoryId: rule.categoryId,
          recurrenceRuleId: rule.id,
          titleEncrypted: rule.titleEncrypted,
          amountEncrypted: rule.amountEncrypted,
          date: new Date(date),
          type: rule.type,
          isRecurring: true,
          recurrence: rule.recurrence,
          description: rule.description,
        },
      })
    }
  }
}

function startRecurringOperationScheduler(fastify: any) {
  async function runTask() {
    try {
      await createMissingRecurringOperations(fastify)
      fastify.log.info('Récurrence : vérification des règles terminée')
    } catch (error) {
      fastify.log.error(error, 'Erreur lors de la génération des opérations récurrentes')
    }
  }

  runTask()
  setInterval(runTask, 24 * 60 * 60 * 1000)
}

export async function buildApp(opts: { testing?: boolean; prisma?: any } = {}) {
  const { testing = false, prisma: injectedPrisma } = opts

  // ── Instance Fastify ─────────────────────────────────────
  const fastify = Fastify({
    logger: testing
      ? false
      : {
          level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
          transport: process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty' }
            : undefined,
        },
  })

  // ── Plugins ──────────────────────────────────────────────
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'test-secret-do-not-use-in-production',
    sign: { expiresIn: '7d' },
  })

  fastify.register(helmet, { contentSecurityPolicy: false })

  fastify.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })

  if (!testing) {
    fastify.register(swagger, {
      openapi: {
        info: {
          title: 'Abyss API',
          description: "Documentation complète de l'API Abyss.",
          version: '1.0.0',
        },
        servers: [{ url: 'http://localhost:3000', description: 'Local' }],
        tags: [
          { name: 'infra', description: 'Health, statut et monitoring' },
          { name: 'auth',  description: 'Inscription et authentification' },
        ],
      },
    })

    fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        displayRequestDuration: true,
      },
      staticCSP: false,
    })
  }

  // ── Prisma ───────────────────────────────────────────────
  const prismaInstance = injectedPrisma ?? (await import('./lib/prisma.js')).default
  fastify.decorate('prisma', prismaInstance)

  // ── Routes ───────────────────────────────────────────────
  fastify.register(import('./routes/auth.js'))
  fastify.register(import('./routes/user.js'))

  if (!testing) {
    startRecurringOperationScheduler(fastify)

    // Root HTML page (uniquement en production — inutile dans les tests)
    fastify.get('/', { schema: { hide: true } }, async (req: any, reply: any) => {
      const uptime     = process.uptime()
      const started    = new Date(Date.now() - uptime * 1000)
      const startedStr = started.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })

      return reply.type('text/html').send(rootHtml({ startedStr, started, uptime }))
    })
  }

  // Routes communes (présentes aussi en test pour les tester facilement)
  fastify.get('/health', {
    schema: {
      summary: 'Health check',
      tags: ['infra'],
      response: {
        200: {
          type: 'object',
          properties: {
            status:    { type: 'string' },
            service:   { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async () => ({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
  }))

  fastify.get('/api/db-status', {
    schema: {
      summary: 'Statut de la base de données PostgreSQL',
      tags: ['infra'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            schema: { type: 'string' },
          },
        },
      },
    },
  }, async (req: any, reply: any) => {
    try {
      await prismaInstance.$queryRaw`SELECT 1`
      return { status: 'connected', schema: 'dbo' }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return reply.code(503).send({ status: 'error', message })
    }
  })

  // ── Error handler ────────────────────────────────────────
  fastify.setErrorHandler((error: any, req, reply) => {
    if (!testing) fastify.log.error(error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    reply.code(error?.statusCode ?? 500).send({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : message,
      code: error?.code ?? 'INTERNAL_ERROR',
    })
  })

  return fastify
}

// ── Template HTML de la page racine ─────────────────────────
function rootHtml({ startedStr, started, uptime }: { startedStr: string, started: Date, uptime: number }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Abyss API</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #0d0d1a; color: #e2e8f0;
      font-family: 'Segoe UI', system-ui, sans-serif; padding: 2rem;
    }
    .card {
      width: 100%; max-width: 580px; background: #13132b;
      border: 1px solid #1e1e40; border-radius: 16px; padding: 2.5rem 2rem;
      box-shadow: 0 0 60px rgba(79,142,247,.08);
    }
    .brand { display: flex; align-items: center; gap: .75rem; margin-bottom: 2rem; }
    .brand-icon {
      width: 42px; height: 42px; background: #4f8ef7; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }
    .brand-name { font-size: 1.5rem; font-weight: 700; letter-spacing: .05em; color: #fff; }
    .brand-name span { color: #4f8ef7; }
    .badge {
      display: inline-block; font-size: .7rem; font-weight: 600; letter-spacing: .08em;
      text-transform: uppercase; padding: .2rem .6rem; border-radius: 999px;
      background: rgba(79,142,247,.15); color: #4f8ef7; margin-left: .5rem; vertical-align: middle;
    }
    .status-row {
      display: flex; align-items: center; gap: .5rem; margin-bottom: 2rem;
      font-size: .85rem; color: #94a3b8;
    }
    .dot {
      width: 8px; height: 8px; border-radius: 50%; background: #4ade80;
      box-shadow: 0 0 6px #4ade80; animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
    .section-title {
      font-size: .7rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase;
      color: #4a5568; margin-bottom: .75rem;
    }
    .endpoint-list { list-style: none; display: flex; flex-direction: column; gap: .5rem; margin-bottom: 2rem; }
    .endpoint-list li {
      display: flex; align-items: center; gap: .75rem; background: #0d0d1a;
      border: 1px solid #1e1e40; border-radius: 8px; padding: .65rem 1rem; font-size: .85rem;
    }
    .method {
      font-size: .65rem; font-weight: 700; letter-spacing: .06em; padding: .15rem .45rem;
      border-radius: 4px; background: rgba(79,142,247,.2); color: #4f8ef7; flex-shrink: 0;
    }
    .path { color: #c4cff8; font-family: monospace; }
    .desc { margin-left: auto; color: #4a5568; font-size: .75rem; }
    .swagger-link {
      display: flex; align-items: center; gap: 1rem;
      background: linear-gradient(135deg, rgba(79,142,247,.12), rgba(79,142,247,.04));
      border: 1px solid rgba(79,142,247,.3); border-radius: 10px; padding: 1rem 1.25rem;
      text-decoration: none; color: inherit; transition: border-color .2s, box-shadow .2s; margin-bottom: 2rem;
    }
    .swagger-link:hover { border-color: rgba(79,142,247,.6); box-shadow: 0 0 20px rgba(79,142,247,.1); }
    .swagger-icon {
      width: 38px; height: 38px; background: #4f8ef7; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;
    }
    .swagger-text strong { display: block; color: #fff; font-size: .9rem; margin-bottom: .15rem; }
    .swagger-text small { color: #4f8ef7; font-size: .75rem; font-family: monospace; }
    .swagger-arrow { margin-left: auto; color: #4a5568; font-size: 1.1rem; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
    .stat-item { background: #0d0d1a; border: 1px solid #1e1e40; border-radius: 8px; padding: .65rem 1rem; }
    .stat-label { font-size: .65rem; letter-spacing: .08em; text-transform: uppercase; color: #4a5568; margin-bottom: .2rem; }
    .stat-value { font-size: .88rem; font-weight: 600; color: #e2e8f0; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <div class="brand-icon">🌑</div>
      <div><div class="brand-name">ABYSS <span>API</span> <span class="badge">v1.0.0</span></div></div>
    </div>
    <div class="status-row">
      <div class="dot"></div>
      Opérationnel &mdash; uptime <span id="uptime">--:--:--</span>
    </div>
    <a href="/docs" class="swagger-link">
      <div class="swagger-icon">📖</div>
      <div class="swagger-text">
        <strong>Documentation Swagger</strong>
        <small>localhost:3000/docs</small>
      </div>
      <div class="swagger-arrow">→</div>
    </a>
    <div class="section-title">Endpoints</div>
    <ul class="endpoint-list">
      <li><span class="method">GET</span><span class="path">/health</span><span class="desc">Health check</span></li>
      <li><span class="method">GET</span><span class="path">/api/db-status</span><span class="desc">Statut PostgreSQL</span></li>
      <li><span class="method">POST</span><span class="path">/api/auth/register</span><span class="desc">Inscription</span></li>
      <li><span class="method">POST</span><span class="path">/api/auth/login</span><span class="desc">Connexion</span></li>
    </ul>
    <div class="section-title">Serveur</div>
    <div class="stats-grid">
      <div class="stat-item"><div class="stat-label">Démarré le</div><div class="stat-value">${startedStr}</div></div>
      <div class="stat-item"><div class="stat-label">Uptime</div><div class="stat-value" id="uptime-stat">--:--:--</div></div>
      <div class="stat-item"><div class="stat-label">Environnement</div><div class="stat-value">${process.env.NODE_ENV ?? 'development'}</div></div>
      <div class="stat-item"><div class="stat-label">CORS origin</div><div class="stat-value">${process.env.FRONTEND_URL ?? 'localhost:5173'}</div></div>
    </div>
  </div>
  <script>
    const startedAt = ${started.getTime()};
    function fmt(sec) {
      const h = String(Math.floor(sec / 3600)).padStart(2, '0')
      const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
      const s = String(sec % 60).padStart(2, '0')
      return h + ':' + m + ':' + s
    }
    function tick() {
      const sec = Math.floor((Date.now() - startedAt) / 1000)
      const str = fmt(sec)
      document.getElementById('uptime').textContent = str
      document.getElementById('uptime-stat').textContent = str
    }
    tick()
    setInterval(tick, 1000)
  </script>
</body>
</html>`
}
