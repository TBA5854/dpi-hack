import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'

import auth from './auth/auth.controller'
import location from './location/location.controller'
import share from './share/share.controller'

import { rateLimiter } from './middleware/rate-limiter'
import { auditService } from './audit/audit.service'
import { errorHandler } from './middleware/error-handler'

const app = new Hono()

app.use('*', logger())
app.use('*', cors())
app.use('*', rateLimiter)

app.onError(errorHandler)

app.get('/', (c) => {
  return c.json({ message: 'Arch DPI Backend is running' })
})

app.route('/auth', auth)
app.route('/location', location)
app.route('/share', share)

export default {
  port: 3000,
  fetch: app.fetch,
}
