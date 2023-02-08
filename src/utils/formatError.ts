import { FastifyReply } from 'fastify'

export function serverError(res: FastifyReply): FastifyReply {
  return res.status(500).send({ error: 'Internal server error' })
}
