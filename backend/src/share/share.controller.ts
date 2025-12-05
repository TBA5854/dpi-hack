import { Hono } from 'hono'
import { shareService } from './share.service'
import { authService } from '../auth/auth.service'
import { z } from 'zod'
import { validator } from 'hono/validator'

type Variables = {
  userId: string
}

const share = new Hono<{ Variables: Variables }>()

// Middleware to extract userId from JWT
share.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401)
  
  const token = authHeader.split(' ')[1]
  if (!token) return c.json({ error: 'Invalid token format' }, 401)
  
  const payload = authService.verifyToken(token)
  if (!payload) return c.json({ error: 'Invalid token' }, 401)
  
  c.set('userId', payload.userId)
  await next()
})

const createRequestSchema = z.object({
  targetIdentifier: z.string(),
  type: z.enum(['REQUEST_DPI', 'SHARE_DPI']),
  validForHours: z.number().min(1).max(24),
})

const respondSchema = z.object({
  action: z.enum(['APPROVE', 'DENY']),
  pin: z.string().optional(),
})

share.post('/request', validator('json', (value, c) => {
  const parsed = createRequestSchema.safeParse(value)
  if (!parsed.success) return c.json(parsed.error, 400)
  return parsed.data
}), async (c) => {
  const { targetIdentifier, type, validForHours } = c.req.valid('json')
  const userId = c.get('userId')
  
  const req = await shareService.createRequest(userId, targetIdentifier, type, validForHours)
  return c.json(req)
})

share.post('/:id/respond', validator('json', (value, c) => {
  const parsed = respondSchema.safeParse(value)
  if (!parsed.success) return c.json(parsed.error, 400)
  return parsed.data
}), async (c) => {
  const { action, pin } = c.req.valid('json')
  const requestId = c.req.param('id')
  const userId = c.get('userId')
  
  const result = await shareService.respondToRequest(requestId, userId, action, pin)
  return c.json(result)
})

share.post('/:id/revoke', async (c) => {
  const requestId = c.req.param('id')
  const userId = c.get('userId')
  await shareService.revokeShare(requestId, userId)
  return c.json({ message: 'Share revoked' })
})

share.get('/incoming', async (c) => {
  const userId = c.get('userId')
  const reqs = await shareService.getIncomingRequests(userId)
  return c.json(reqs)
})

share.get('/outgoing', async (c) => {
  const userId = c.get('userId')
  const reqs = await shareService.getOutgoingRequests(userId)
  return c.json(reqs)
})

share.get('/active-sent', async (c) => {
  const userId = c.get('userId')
  const shares = await shareService.getActiveSentShares(userId)
  return c.json(shares)
})

share.get('/active-received', async (c) => {
  const userId = c.get('userId')
  const shares = await shareService.getActiveReceivedShares(userId)
  return c.json(shares)
})

share.get('/:id/details', async (c) => {
  const requestId = c.req.param('id')
  const userId = c.get('userId')
  
  const details = await shareService.getShareDetails(requestId, userId)
  return c.json(details)
})

export default share
