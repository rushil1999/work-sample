import { UserContext } from '@procurenetworks/inter-service-contracts';
import * as Fastify from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';

export type FastifyServer = Fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>;

export interface ValidateAccessTokenResponse {
  isValid: boolean;
  userContext?: UserContext;
  errorCode?: string;
}

// NOTE: shift this to rpc-contract
export type BatchRequestType<I> = I & { keyId: string };
