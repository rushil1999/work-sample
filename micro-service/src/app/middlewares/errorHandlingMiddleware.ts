import { BugReporterService, logger, ProcureError } from '@procurenetworks/backend-utils';
import { FastifyReply, FastifyRequest } from 'fastify';
import { appConfigs } from '../../appConfigs';

export async function errorHandlingMiddleware(error: Error, request: FastifyRequest, response: FastifyReply): Promise<void> {
  try {
    if (error instanceof ProcureError) {
      response.code(error.httpStatus);
      response.send({
        message: `${error.message}`,
        extensions: error.extensions,
      });
    } else {
      response.code(500);
      response.send();
    }
  } catch (internalError) {
    logger.error({ message: 'Error in responding with formatter error', error: internalError });
  } finally {
    if (!(error instanceof ProcureError && error.report === false)) {
      await BugReporterService.reportServerException(error, request.raw, {
        serviceName: appConfigs.node.service,
        currentUserInfo: request.userContext?.currentUserInfo,
        requestId: request.userContext?.requestId,
        tenantId: request.userContext?.tenantId,
      });
    }
  }
}
