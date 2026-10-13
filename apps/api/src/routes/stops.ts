import { Hono } from 'hono';
import { z } from 'zod';
import { dataStore } from '../db/db.js';
import { cache } from '../cache/redis.js';

export const stopsRoute = new Hono();

const searchSchema = z.object({
  q: z.string().min(1)
});

// GET /stops/search?q=
stopsRoute.get('/search', async (c) => {
  const q = c.req.query('q');
  const parsed = searchSchema.safeParse({ q });
  if (!parsed.success) {
    return c.json({ error: 'Parameter pencarian "q" wajib diisi' }, 400);
  }

  const query = parsed.data.q;
  const results = await dataStore.searchStops(query, 20);

  return c.json({
    query,
    total: results.length,
    stops: results
  });
});

// GET /stops/:id
stopsRoute.get('/:id', async (c) => {
  const id = c.req.param('id');
  const cacheKey = `stop:${id}`;

  const cached = await cache.get(cacheKey);
  if (cached) return c.json(cached);

  const stop = await dataStore.getStopById(id);
  if (!stop) {
    return c.json({ error: `Halte/Stasiun '${id}' tidak ditemukan` }, 404);
  }

  await cache.set(cacheKey, stop, 1800);
  return c.json(stop);
});
