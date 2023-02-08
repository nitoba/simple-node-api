import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import { env } from './lib/env'
import { transactionRoutes } from './routes/transactions'

const app = Fastify()

app.register(cookie)

app.addHook('preHandler', async (req, res) => {
  console.log(`[${req.method}] - [${res.statusCode}] => ${req.url}`)
})

app.register(transactionRoutes, { prefix: 'transactions' })

const PORT = env.PORT

app
  .listen({ port: PORT })
  .then(() => console.log(`Server running and listening on ${PORT}`))
