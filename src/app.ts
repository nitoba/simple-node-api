import Fastify from 'fastify'
import cookie from '@fastify/cookie'

import { transactionRoutes } from './routes/transactions'

export const app = Fastify()

app.register(cookie)

app.addHook('preHandler', async (req, res) => {
  console.log(`[${req.method}] - [${res.statusCode}] => ${req.url}`)
})

app.register(transactionRoutes, { prefix: 'transactions' })
