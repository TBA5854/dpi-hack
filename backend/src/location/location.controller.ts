import { Hono } from 'hono'
import { locationService } from './location.service'
import { authService } from '../auth/auth.service'
import { z } from 'zod'
import { validator } from 'hono/validator'

type Variables = {
  userId: string
}

const location = new Hono<{ Variables: Variables }>()

// Middleware to extract userId from JWT
location.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401)
  
  const token = authHeader.split(' ')[1]
  if (!token) return c.json({ error: 'Invalid token format' }, 401)

  const payload = authService.verifyToken(token)
  if (!payload) return c.json({ error: 'Invalid token' }, 401)
  
  c.set('userId', payload.userId)
  await next()
})

const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
})

location.post('/initial', validator('json', (value, c) => {
  const parsed = locationSchema.safeParse(value)
  if (!parsed.success) return c.json(parsed.error, 400)
  return parsed.data
}), async (c) => {
  const { latitude, longitude } = c.req.valid('json')
  const userId = c.get('userId')
  
  const loc = await locationService.setInitialLocation(userId, latitude, longitude)
  return c.json(loc)
  return c.json(loc)
})

const addressSchema = z.object({
  address: z.string().min(3),
})

location.post('/from-address', validator('json', (value, c) => {
  const parsed = addressSchema.safeParse(value)
  if (!parsed.success) return c.json(parsed.error, 400)
  return parsed.data
}), async (c) => {
  const { address } = c.req.valid('json')
  const userId = c.get('userId')
  
  const loc = await locationService.createLocationFromAddress(userId, address)
  return c.json(loc)
})

location.get('/resolve/:dpi', async (c) => {
  const dpi = c.req.param('dpi')
  const result = await locationService.resolveDpi(dpi)
  return c.json(result)
})

location.get('/my-dpi', async (c) => {
  const userId = c.get('userId')
  const loc = await locationService.getLocation(userId)
  if (!loc) return c.json({ error: 'Location not set' }, 404)
  return c.json(loc)
})

export default location
