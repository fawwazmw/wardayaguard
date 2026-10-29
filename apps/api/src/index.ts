import { createApp } from './app';
import { db, databasePath } from './db';
import { seedIfEmpty } from './seed';

const port = Number(process.env.PORT ?? 4000);

seedIfEmpty();

const server = createApp().listen(port, () => {
  console.log(`[api] listening on http://127.0.0.1:${port}`);
  console.log(`[api] database: ${databasePath}`);
  if (process.env.ALLOW_TEST_ROUTES === '1') {
    console.warn('[api] test routes are enabled (/api/test/*)');
  }
});

function shutdown(signal: string): void {
  console.log(`[api] ${signal} received, closing server`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
