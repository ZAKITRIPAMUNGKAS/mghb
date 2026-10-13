import { Hono } from 'hono';
import { z } from 'zod';
import { planJourney } from '../otp/client.js';

export const planRoute = new Hono();

const planQuerySchema = z.object({
  from: z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, 'Format "from" harus "latitude,longitude"'),
  to: z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, 'Format "to" harus "latitude,longitude"'),
  time: z.string().optional(),
  sortBy: z.enum(['fastest', 'least_transfers', 'least_walking', 'cheapest']).optional()
});

// GET /plan?from=lat,lon&to=lat,lon&time=
planRoute.get('/', async (c) => {
  const from = c.req.query('from');
  const to = c.req.query('to');
  const time = c.req.query('time');
  const sortBy = c.req.query('sortBy') as any;

  const validation = planQuerySchema.safeParse({ from, to, time, sortBy });
  if (!validation.success) {
    return c.json({ error: validation.error.errors[0].message }, 400);
  }

  const [fromLat, fromLon] = validation.data.from.split(',').map(Number);
  const [toLat, toLon] = validation.data.to.split(',').map(Number);

  const itineraries = await planJourney({
    fromLat,
    fromLon,
    toLat,
    toLon,
    time: validation.data.time,
    sortBy: validation.data.sortBy
  });

  return c.json({
    origin: { latitude: fromLat, longitude: fromLon },
    destination: { latitude: toLat, longitude: toLon },
    departure_time: validation.data.time || 'Sekarang',
    total_itineraries: itineraries.length,
    itineraries
  });
});
