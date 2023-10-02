import {
  AssetItemEntity,
  InventoryItemEntity,
  ItemEntity,
  TransactionEntity,
} from '@procurenetworks/inter-service-contracts';

export function parseCreateKitRestockTransactionInput(
  kitItem: AssetItemEntity.AssetKitItemSchema | InventoryItemEntity.InventoryKitItemSchema,
  createKitItemInput: AssetItemEntity.CreateAssetKitItemInput | InventoryItemEntity.CreateInventoryKitItemInput,
): TransactionEntity.CreateRestockTransactionsInput {
  const { _id: kitItemId, type } = kitItem;
  const { locationId, siteId, quantity } = createKitItemInput;

  const kitType =
    type === ItemEntity.ItemTypeEnum.ASSET_KIT
      ? TransactionEntity.TransactionEntityTypeEnum.ASSET_KIT
      : TransactionEntity.TransactionEntityTypeEnum.INVENTORY_KIT;

  const parsedCreateRestockTransactionInput: TransactionEntity.CreateRestockTransactionsInput = {
    entities: [
      {
        destinationLocationId: locationId || siteId,
        destinationSiteId: siteId,
        entityId: kitItemId,
        entityType: kitType,
        quantity,
      },
    ],
    status: TransactionEntity.TransactionStatusEnum.COMPLETED,
    subType: TransactionEntity.TransactionSubTypeEnum.KIT,
    type: TransactionEntity.TransactionTypeEnum.RESTOCK,
  };

  return parsedCreateRestockTransactionInput;
}

export function parseCreateKitChildItemsRemoveTransactionInput(
  kitItem: AssetItemEntity.AssetKitItemSchema | InventoryItemEntity.InventoryKitItemSchema,
  kitSiteId: string,
  kitQuantity: number,
): TransactionEntity.CreateRemoveTransactionsInput {
  const { kitConfigs, type } = kitItem;

  const entities: TransactionEntity.RemoveTransactionEntityInput[] = [];
  const itemType =
    type === ItemEntity.ItemTypeEnum.ASSET_KIT
      ? TransactionEntity.TransactionEntityTypeEnum.ASSET
      : TransactionEntity.TransactionEntityTypeEnum.INVENTORY;

  for (const kitConfig of kitConfigs) {
    const { count, itemId, locationId } = kitConfig;

    entities.push({
      entityId: itemId,
      entityType: itemType,
      meta: { reason: 'Creating kit item' },
      quantity: kitQuantity * count,
      sourceLocationId: locationId,
      sourceSiteId: kitSiteId,
    });
  }

  const parsedCreateRemoveTransactionInput: TransactionEntity.CreateRemoveTransactionsInput = {
    entities,
    status: TransactionEntity.TransactionStatusEnum.COMPLETED,
    subType: TransactionEntity.TransactionSubTypeEnum.KIT,
    type: TransactionEntity.TransactionTypeEnum.REMOVE,
  };

  return parsedCreateRemoveTransactionInput;
}
