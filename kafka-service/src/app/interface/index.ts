import * as Fastify from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';

export type FastifyServer = Fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>;
