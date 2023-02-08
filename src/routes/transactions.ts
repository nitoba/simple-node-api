import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../lib/database'
import { serverError } from '../utils/formatError'
import { isZodError } from '../utils/isZodError'
import { checkSessionIdExists } from '../middleware/check-session-id-exists'

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (req, res) => {
    try {
      const { sessionId } = req.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select('id')
        .select('title')
        .select('amount')
        .select('created_at')

      return res.send({ transactions })
    } catch (error) {
      return serverError(res)
    }
  })

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (req, res) => {
      try {
        const { sessionId } = req.cookies
        const summary = await knex('transactions')
          .where('session_id', sessionId)
          .sum('amount', { as: 'amount' })
          .first()

        return res.send({ summary })
      } catch (error) {
        if (isZodError(error)) {
          return res.status(400).send({ errors: error.formErrors.fieldErrors })
        }
        return serverError(res)
      }
    },
  )

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (req, res) => {
    try {
      const { sessionId } = req.cookies

      const paramsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = paramsSchema.parse(req.params)

      const transaction = await knex('transactions')
        .where({
          id,
          session_id: sessionId,
        })
        .first()
        .select('id')
        .select('title')
        .select('amount')
        .select('created_at')

      if (!transaction)
        return res.status(404).send({ error: 'Transaction not found' })

      return res.send(transaction)
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).send({ errors: error.formErrors.fieldErrors })
      }
      return serverError(res)
    }
  })

  app.post('/', async (req, res) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['debit', 'credit'], {
        required_error: 'inform credit of debit type for this operation',
      }),
    })

    try {
      const { title, amount, type } = createTransactionBodySchema.parse(
        req.body,
      )

      let sessionId = req.cookies.sessionId

      if (!sessionId) {
        sessionId = randomUUID()
        res.cookie('sessionId', sessionId, {
          path: '/',
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        })
      }

      await knex('transactions').insert({
        id: randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
        session_id: sessionId,
      })

      return res.status(204).send()
    } catch (error) {
      if (isZodError(error)) {
        return res.status(400).send({ errors: error.formErrors.fieldErrors })
      }

      return serverError(res)
    }
  })
}
