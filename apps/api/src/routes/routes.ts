import { Hono } from 'hono';
import { dataStore } from '../db/db.js';
import { cache } from '../cache/redis.js';

export const routesRoute = new Hono();

// GET /routes
routesRoute.get('/', async (c) => {
  const mode = c.req.query('mode') || 'all';
  const cacheKey = `routes:list:${mode}`;

  const cached = await cache.get(cacheKey);
  if (cached) return c.json(cached);

  const routes = await dataStore.getRoutes(mode);
  const response = {
    mode,
    total: routes.length,
    routes
  };

  await cache.set(cacheKey, response, 3600);
  return c.json(response);
});

// GET /routes/:id
routesRoute.get('/:id', async (c) => {
  const id = c.req.param('id');
  const cacheKey = `route:detail:${id}`;

  const cached = await cache.get(cacheKey);
  if (cached) return c.json(cached);

  const route = await dataStore.getRouteById(id);
  if (!route) {
    return c.json({ error: `Rute/Koridor '${id}' tidak ditemukan` }, 404);
  }

  await cache.set(cacheKey, route, 3600);
  return c.json(route);
});
