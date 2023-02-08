import { app } from './app'
import { env } from './lib/env'

const PORT = env.PORT

app
  .listen({ port: PORT })
  .then(() => console.log(`Server running and listening on ${PORT}`))
