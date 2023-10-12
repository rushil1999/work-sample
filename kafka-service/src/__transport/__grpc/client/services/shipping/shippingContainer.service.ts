import { logger } from '@procurenetworks/backend-utils';
import { Entity, ShippingContainerEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { ShippingServiceRPCClient } from './rpcClient';

export class ShippingContainerService extends ShippingServiceRPCClient {
  /* Queries */
  public static async getAllShippingContainers(
    inputProps: ShippingContainerEntity.GetAllShippingContainersInput,
    context: UserContext,
  ): Promise<ShippingContainerEntity.GetAllShippingContainersPayload> {
    const allShippingContainerResponse = await this.rpcCall<
      ShippingContainerEntity.GetAllShippingContainersInput,
      ShippingContainerEntity.GetAllShippingContainersPayload
    >('getAllShippingContainers')(inputProps, context);
    return allShippingContainerResponse;
  }

  /** Mutations */
  static async bulkUpdateExpandedSortFields(
    input: ShippingContainerEntity.BulkUpdateExpandedSortFieldsInItemLocationInput,
    userContext: UserContext,
  ): Promise<Entity.MutationResponse> {
    logger.debug({
      message: 'ShippingContainer Service: bulkUpdateItemLocations',
      payload: { input },
    });
    const payload = await this.rpcCall<
      ShippingContainerEntity.BulkUpdateExpandedSortFieldsInItemLocationInput,
      Entity.MutationResponse
    >('bulkUpdateExpandedSortFields')(input, userContext);
    return payload;
  }
}
