import cookie, { FastifyCookieOptions } from '@fastify/cookie';
import assert from 'assert';
import { EventEmitter } from 'events';
import fastify from 'fastify';
import { appConfigs } from '../appConfigs';
import { kafkaConnection } from '../connection/kafka/kafka.connection';
import { DenormalizeEventsHandler } from '../services/entityExpander/denormalizeEvents.service';
import { FastifyServer } from './interface';

assert.ok(process.env.HTTP_PORT, 'HTTP_PORT is not provided in the environment variable');

class App {
  public app: FastifyServer;
  public processEvent: EventEmitter;

  constructor() {
    this.app = fastify({
      logger: {
        prettyPrint: true,
      },
      bodyLimit: 10485760,
      requestIdHeader: 'x-request-id',
    });
    this.processEvent = new EventEmitter();
  }

  loadMiddleware(): void {
    this.app.register(cookie, {
      parseOptions: { httpOnly: true },
    } as FastifyCookieOptions);
  }

  initialiseProcessListener(denoramalizeEventsService: DenormalizeEventsHandler): void {
    this.processEvent.on('INIT_SHUTDOWN', () => {
      logger.info({ message: 'Received INIT_SHUTDOWN signal.' });
      denoramalizeEventsService.deInit();
    });
    this.processEvent.on('SHUTDOWN', () => {
      logger.info({ message: 'Received Shutdown signal.' });
      process.emit('SIGINT', 'SIGINT');
    });
  }

  async initializeApp(): Promise<void> {
    this.loadMiddleware();
    const denoramalizeEventsService = new DenormalizeEventsHandler({
      connection: kafkaConnection,
      consumerConfig: {
        groupId: appConfigs.KafkaConsumerConfigs.consumerGroupId,
        heartbeatInterval: appConfigs.KafkaConsumerConfigs.consumerGroupHeartbeatInterval,
      },
    });
    this.listen();
    this.initialiseProcessListener(denoramalizeEventsService);
    await denoramalizeEventsService.init();
  }

  async listen(): Promise<void> {
    this.app.listen(appConfigs.node.port || parseInt('6001'), '0.0.0.0', (error: Error | null) => {
      if (error) {
        throw error;
      }
      logger.info(`Server is running on node version: ${process.version}`);
      logger.info(`Server connected to port: ${process.env.HTTP_PORT}`);
    });
  }
}

export default new App();
