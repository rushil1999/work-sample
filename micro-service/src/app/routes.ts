import { InternalServerError, logger, ProcureError } from '@procurenetworks/backend-utils';
import { StringObjectID } from '@procurenetworks/inter-service-contracts';
import { FastifyReply, FastifyRequest } from 'fastify';
import { rollupQuantitiesFromLocationsOfItemLocationsScript } from '../scripts';
import { pingServices } from '../transport/rest/routes/pingServices';
import { FastifyServer } from './interface';

export default class Routes {
  static initializeRoutes(app: FastifyServer, opts: any, done: any): void {
    app.get('/', (_req, res) => {
      res.send('Welcome to Procure API');
    });

    app.get('/pingServices', pingServices);
    app.get('/metrics', pingServices);
    app.post('/temp/rollup', async (req: FastifyRequest<{ Querystring: { service: string } }>, res: FastifyReply) => {
      try {
        const loginUserPayload = await rollupQuantitiesFromLocationsOfItemLocationsScript(
          (req.body as any)?.tenantIds as StringObjectID[],
        );

        /* return response as per the service call */
        // eslint-disable-next-line no-param-reassign
        res.statusCode = 200;
        return res.send(loginUserPayload);
      } catch (error: any) {
        if (error instanceof ProcureError) {
          throw error;
        }
        logger.error({ error, message: `Error in rollup quantity.` });
        throw new InternalServerError({
          debugMessage: `Failed to rollup quantity ${error.message}`,
          error,
          message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
          params: { input: req.body },
          where: `${__filename} - /temp/rollup`,
        });
      }
    });
    done();
  }
}
