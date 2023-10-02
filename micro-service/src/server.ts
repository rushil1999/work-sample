import 'module-alias/register';
import 'reflect-metadata';
import Server from './app';

/**
 * Start fastify server
 */
async function startServer(): Promise<void> {
  await Server.initializeApp();
  Server.listen();
}

startServer().catch();
