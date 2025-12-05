import type { Context, Next } from 'hono'

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

interface ClientRecord {
  count: number;
  resetTime: number;
}

const clients = new Map<string, ClientRecord>();

export const rateLimiter = async (c: Context, next: Next) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  const now = Date.now();

  let record = clients.get(ip);

  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + WINDOW_MS };
    clients.set(ip, record);
  }

  record.count++;

  if (record.count > MAX_REQUESTS) {
    return c.json({ error: 'Too many requests' }, 429);
  }

  await next();
}
