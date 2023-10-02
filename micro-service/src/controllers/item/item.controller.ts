import { Entity, ItemEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { ItemService } from '../../services/item/item.service';

export class ItemController {
  /* Queries */

  static async getAllItems(
    getItemsInput: ItemEntity.GetAllItemsInput,
    userContext: UserContext,
  ): Promise<ItemEntity.GetAllItemsPayload> {
    return ItemService.getAllItems(getItemsInput, userContext);
  }

  static async getItemsByIdsAcrossTenants(
    getItemsIdsAcrossTenantsInput: ItemEntity.GetItemsByIdsAcrossTenantsInput,
    userContext: UserContext,
  ): Promise<ItemEntity.GetItemsByIdsAcrossTenantsPayload> {
    return ItemService.getItemsByIdsAcrossTenants(getItemsIdsAcrossTenantsInput, userContext);
  }

  static async getPaginatedItems(
    getPaginatedItemsInput: ItemEntity.GetPaginatedItemsInput,
    userContext: UserContext,
  ): Promise<ItemEntity.PaginatedItemsPayload> {
    return ItemService.getPaginatedItems(getPaginatedItemsInput, userContext);
  }

  static async getPaginatedItemsDeprecated(
    getPaginatedItemsInput: ItemEntity.GetPaginatedItemsInput,
    userContext: UserContext,
  ): Promise<Entity.GetPaginatedEntitiesPayload<ItemEntity.ItemSchema>> {
    return ItemService.getPaginatedItemsDeprecated(getPaginatedItemsInput, userContext);
  }

  static async getDistinctValuesForAllItem(
    getDistinctValuesInput: ItemEntity.GetDistinctValuesForAllItemInput,
    userContext: UserContext,
  ): Promise<Entity.GetDistinctValuesForAllEntityPayload> {
    return ItemService.getDistinctValuesForAllItem(getDistinctValuesInput, userContext);
  }
}
