import cookie, { FastifyCookieOptions } from '@fastify/cookie';
import { logger } from '@procurenetworks/backend-utils';
import assert from 'assert';
import fastify from 'fastify';
import { mongoConnect } from '../connections/mongo';
// import * as Scripts from '../scripts';
import { InventoryServiceServer } from '../transport/__grpc/server';
import { FastifyHooks } from './hooks/fastify';
import { FastifyServer } from './interface';
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware';
import Routes from './routes';

assert.ok(process.env.HTTP_PORT, 'HTTP_PORT is not provided in the environment variable');

class App {
  public app: FastifyServer;

  constructor() {
    this.app = fastify({
      logger: {
        prettyPrint: true,
      },
      bodyLimit: 10485760,
      requestIdHeader: 'x-request-id',
    });
  }

  loadGRPC(): void {
    InventoryServiceServer.start();
  }

  async initializeErrorHandling(): Promise<void> {
    this.app.setErrorHandler(errorHandlingMiddleware);
  }

  loadMiddleware(): void {
    this.app.register(cookie, {
      parseOptions: { httpOnly: true },
    } as FastifyCookieOptions);
  }

  loadRoutes(): void {
    this.app.register(Routes.initializeRoutes, { prefix: '/api' });
  }

  async initializeMongo(): Promise<void> {
    await mongoConnect();
  }

  async initializeApp(): Promise<void> {
    FastifyHooks.initializeHook(this.app);
    this.initializeErrorHandling();
    this.loadMiddleware();
    this.loadRoutes();
    this.loadGRPC();
    await this.initializeMongo();
  }

  async listen(): Promise<void> {
    this.app.listen(parseInt(process.env.HTTP_PORT || '6001'), '0.0.0.0', (error: Error | null) => {
      if (error) {
        throw error;
      }
      logger.info(`Server is running on node version: ${process.version}`);
      logger.info(`Server connected to port: ${process.env.HTTP_PORT}`);
    });
  }
}

export default new App();
