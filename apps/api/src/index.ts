import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { openApiSpec } from './openapi.js';
import { stopsRoute } from './routes/stops.js';
import { routesRoute } from './routes/routes.js';
import { planRoute } from './routes/plan.js';
import { metaRoute } from './routes/meta.js';
import { vehiclesRoute } from './routes/vehicles.js';

export const app = new Hono();

// Global Middlewares
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Root & Health
app.get('/', (c) => c.json({
  service: 'Laku Transit API',
  version: '1.0.0',
  author: 'Zaki Tri Pamungkas',
  docs: '/openapi.json',
  endpoints: {
    stops_search: '/stops/search?q={query}',
    stop_detail: '/stops/{id}',
    routes_list: '/routes?mode={mode}',
    route_detail: '/routes/{id}',
    plan_journey: '/plan?from={lat,lon}&to={lat,lon}&time={time}',
    vehicles_live: '/vehicles?mode={mode}',
    metadata: '/meta'
  }
}));

app.get('/openapi.json', (c) => c.json(openApiSpec));

// Mount Subrouters
app.route('/stops', stopsRoute);
app.route('/routes', routesRoute);
app.route('/plan', planRoute);
app.route('/meta', metaRoute);
app.route('/vehicles', vehiclesRoute);

const PORT = parseInt(process.env.PORT || '3000', 10);

if (process.env.NODE_ENV !== 'test') {
  console.log(`[Laku API] Starting server on http://localhost:${PORT}`);
  serve({
    fetch: app.fetch,
    port: PORT
  });
}
