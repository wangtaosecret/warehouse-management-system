import { cors as honoCors } from 'hono/cors';

export const cors = honoCors({
  origin: '*',  // In production, specify exact origins
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
});
