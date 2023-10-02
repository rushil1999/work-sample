import { UserContext } from '@procurenetworks/inter-service-contracts';

// this declaration must be in scope of the typescript interpreter to work
declare module 'fastify' {
  interface FastifyRequest {
    reqId: string;
    Headers: { 'x-request-id': string };
    userContext?: UserContext;
  }
}

declare namespace NodeJS {
  export interface ProcessEnv {
    APP_ROOT_DIRECTORY: string;
    AUTH_COOKIE_NAME: string;
    AUTH_JWT_TOKEN: string;
    AWS_S3_BUCKET: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_S3_REGION: string;
    PROCURE_BASE_UI_DOMAIN: string;
    PROCURE_BASE_API_DOMAIN: string;
    DEPLOYMENT_ENVIRONMENT: string;
    EMAIL_SERVICE_BASE_URL: string;
    GRPC_PORT: string;
    HTTP_PORT: string;
    MONGODB_URI: string;
    NODE_ENV: string;
    SENTRY_DSN: string;
  }
}
