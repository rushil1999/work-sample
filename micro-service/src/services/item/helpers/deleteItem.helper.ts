import { ItemEntity, TransactionEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { ItemLocationService } from '../../itemLocation/itemLocation.service';

export const parseDeleteItemInput = async (
  { itemIds }: ItemEntity.DeleteItemsInput,
  userContext: UserContext,
): Promise<TransactionEntity.CreateRemoveTransactionsInput> => {
  const { itemLocations } = await ItemLocationService.getAllItemLocations(
    {
      filters: { itemIds, nonZeroTotalQuantity: true },
    },
    userContext,
  );
  const createRemoveTransactionsInput: TransactionEntity.CreateRemoveTransactionsInput = {
    entities: [],
    status: TransactionEntity.TransactionStatusEnum.COMPLETED,
    type: TransactionEntity.TransactionTypeEnum.REMOVE,
    subType: TransactionEntity.TransactionSubTypeEnum.DELETE,
  };

  itemLocations.forEach((itemLocation) => {
    createRemoveTransactionsInput.entities.push({
      entityId: itemLocation.itemId,
      entityType: itemLocation.itemType as unknown as TransactionEntity.TransactionEntityTypeEnum,
      meta: { reason: 'Item deleted' },
      quantity: itemLocation.totalQuantity,
      sourceLocationId: itemLocation.locationId,
      sourceSiteId: itemLocation.siteId,
    });
  });
  return createRemoveTransactionsInput;
};
