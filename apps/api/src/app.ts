import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db';
import { errorHandler, notFoundHandler } from './errors';
import { authRouter } from './routes/auth';
import { cartRouter } from './routes/cart';
import { ordersRouter } from './routes/orders';
import { productsRouter } from './routes/products';
import { testRoutes } from './test-routes';

const storefrontDist = join(dirname(fileURLToPath(import.meta.url)), '../../storefront/dist');
const storefrontIndex = join(storefrontDist, 'index.html');

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    cors({
      origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_request, response) => {
    db.prepare('SELECT 1').get();
    response.json({ status: 'ok', service: 'wardaya-api', database: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', ordersRouter);

  if (process.env.ALLOW_TEST_ROUTES === '1') {
    app.use('/api/test', testRoutes);
  }

  // Single-service deployment: when a production build exists, the API serves
  // the storefront and falls back to index.html for client-side routes.
  if (existsSync(storefrontIndex)) {
    app.use(express.static(storefrontDist));
    app.use((request, response, next) => {
      if (request.method !== 'GET' || request.path.startsWith('/api')) {
        next();
        return;
      }
      response.sendFile(storefrontIndex);
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
