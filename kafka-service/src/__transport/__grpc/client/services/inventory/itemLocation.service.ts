import { logger } from '@procurenetworks/backend-utils';
import { Entity, ItemLocationEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { InventoryServiceRPCClient } from './rpcClient';

export class ItemLocationService extends InventoryServiceRPCClient {
  /** Queries */
  static async getAllItemLocations(
    input: ItemLocationEntity.GetAllItemLocationsInput,
    userContext: UserContext,
  ): Promise<ItemLocationEntity.GetAllItemLocationsPayload> {
    logger.debug({ message: 'ItemLocation Service: getAllItemLocations', payload: { input } });
    const payload = await this.rpcCall<
      ItemLocationEntity.GetAllItemLocationsInput,
      ItemLocationEntity.GetAllItemLocationsPayload
    >('getAllItemLocations')(input, userContext);
    return payload;
  }
  static async getDistinctValuesForAllItemLocation(
    input: ItemLocationEntity.GetDistinctValuesForAllItemLocationInput,
    userContext: UserContext,
  ): Promise<Entity.GetDistinctValuesForAllEntityPayload> {
    logger.debug({
      message: 'ItemLocation Service: getDistinctValuesForAllItemLocation',
      payload: { input },
    });
    const payload = await this.rpcCall<
      ItemLocationEntity.GetDistinctValuesForAllItemLocationInput,
      Entity.GetDistinctValuesForAllEntityPayload
    >('getDistinctValuesForAllItemLocation')(input, userContext);
    return payload;
  }

  /** Mutations */
  static async bulkUpdateExpandedSortFields(
    input: ItemLocationEntity.BulkUpdateExpandedSortFieldsInItemLocationInput,
    userContext: UserContext,
  ): Promise<Entity.MutationResponse> {
    logger.debug({
      message: 'ItemLocation Service: bulkUpdateItemLocations',
      payload: { input },
    });
    const payload = await this.rpcCall<
      ItemLocationEntity.BulkUpdateExpandedSortFieldsInItemLocationInput,
      Entity.MutationResponse
    >('bulkUpdateExpandedSortFields')(input, userContext);
    return payload;
  }
}
