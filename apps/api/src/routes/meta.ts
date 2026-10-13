import { Hono } from 'hono';
import { dataStore } from '../db/db.js';

export const metaRoute = new Hono();

// GET /meta
metaRoute.get('/', async (c) => {
  const meta = await dataStore.getMetadata();
  return c.json(meta);
});
