import { InternalServerError, logger, ProcureError } from '@procurenetworks/backend-utils';
import {
  Entity,
  getDistinctValuesForAllEntityPayload,
  ItemEntity,
  UserContext,
} from '@procurenetworks/inter-service-contracts';
import { ClientSession } from 'mongoose';
import { ItemRepository } from '../../models/item/item.repository';
import { PaginationUtils } from '../../utils/pagination.util';
class ItemServiceClass {
  /* Queries */
  async getAllItems(
    getAllItemInput: ItemEntity.GetAllItemsInput,
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<ItemEntity.GetAllItemsPayload> {
    const items = await ItemRepository.getAllItems(getAllItemInput, userContext, session);
    return { items };
  }

  async getPaginatedItems(
    getPaginatedItemsInput: ItemEntity.GetPaginatedItemsInput,
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<ItemEntity.PaginatedItemsPayload> {
    try {
      return ItemRepository.getPaginatedItems(getPaginatedItemsInput, userContext, session);
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in getPaginatedItems.` });
      throw new InternalServerError({
        debugMessage: `Failed to getPaginatedItems ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { getPaginatedItemsInput },
        where: `${__filename} - ${this.getPaginatedItems.name}`,
      });
    }
  }

  async getItemsByIdsAcrossTenants(
    input: ItemEntity.GetItemsByIdsAcrossTenantsInput,
    userContext: UserContext,
  ): Promise<ItemEntity.GetItemsByIdsAcrossTenantsPayload> {
    try {
      logger.debug({ message: 'Item Service. getItemsByIdsAcrossTenants', payload: { input } });
      if (input.filters.itemIds.length === 0) {
        return { items: [] };
      }

      const items = await ItemRepository.getItemsByIdsAcrossTenants(input, userContext);

      return { items };
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in getItemsByIdsAcrossTenants.` });
      throw new InternalServerError({
        debugMessage: `Failed to getItemsByIdsAcrossTenants ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { input },
        where: `Item service - ${this.getItemsByIdsAcrossTenants.name}`,
      });
    }
  }

  async getPaginatedItemsDeprecated(
    getPaginatedItemsInput: ItemEntity.GetPaginatedItemsInput,
    userContext: UserContext,
  ): Promise<Entity.GetPaginatedEntitiesPayload<ItemEntity.ItemSchema>> {
    try {
      const [items, itemsCount] = await Promise.all([
        ItemRepository.getPaginatedItemsDeprecated(getPaginatedItemsInput, userContext),
        ItemRepository.getItemsCount(getPaginatedItemsInput, userContext),
      ]);

      return PaginationUtils.getPaginatedEntitiesPayload(items, itemsCount, getPaginatedItemsInput.paginationProps);
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in getPaginatedItemsDeprecated.` });
      throw new InternalServerError({
        debugMessage: `Failed to getPaginatedItemsDeprecated ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { getPaginatedItemsInput },
        where: `${__filename} - ${this.getPaginatedItemsDeprecated.name}`,
      });
    }
  }

  async getDistinctValuesForAllItem(
    getDistinctValuesInput: ItemEntity.GetDistinctValuesForAllItemInput,
    userContext: UserContext,
  ): Promise<Entity.GetDistinctValuesForAllEntityPayload> {
    const { filters, field } = getDistinctValuesInput;
    const distinctValues = await ItemRepository.getDistinctValuesForAllItem<typeof field>({ filters }, field, userContext);
    return getDistinctValuesForAllEntityPayload(distinctValues);
  }
}

export const ItemService = new ItemServiceClass();
