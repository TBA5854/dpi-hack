import { Hono } from 'hono'
import { authService } from './auth.service'
import { z } from 'zod'
import { validator } from 'hono/validator'

const auth = new Hono()

const registerSchema = z.object({
  username: z.string().min(3),
  phoneNumber: z.string().min(10),
  password: z.string().min(6),
})

const loginSchema = z.object({
  identifier: z.string(),
  password: z.string(),
})

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/),
})

auth.post('/register', validator('json', (value, c) => {
  const parsed = registerSchema.safeParse(value)
  if (!parsed.success) return c.json(parsed.error, 400)
  return parsed.data
}), async (c) => {
  const { username, phoneNumber, password } = c.req.valid('json')
  const token = await authService.register(username, phoneNumber, password)
  return c.json({ token })
})

auth.post('/login', validator('json', (value, c) => {
  const parsed = loginSchema.safeParse(value)
  if (!parsed.success) return c.json(parsed.error, 400)
  return parsed.data
}), async (c) => {
  const { identifier, password } = c.req.valid('json')
  const token = await authService.login(identifier, password)
  return c.json({ token })
})

// Middleware to extract user from token would be needed here for protected routes
// For MVP, let's assume the client sends userId in body for this setup step or we add middleware later
// Actually, let's add a simple middleware in the main index.ts or here.
// For now, let's just implement the logic assuming we have the user.

export default auth
