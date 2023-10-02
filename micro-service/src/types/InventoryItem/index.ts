import {
  Entity,
  InventoryItemEntity,
  ItemEntity,
  MediaEntity,
  StringObjectID,
} from '@procurenetworks/inter-service-contracts';

/** Version 2. */

/* Queries inputs */

/* Mutation inputs */
export type CreateInventoryItemRepositoryInput = Omit<
  Pick<
    InventoryItemEntity.InventoryItemSchema,
    Exclude<keyof InventoryItemEntity.InventoryItemSchema, keyof Entity.EntityBaseSchema>
  >,
  'attachments' | 'externalProductCodes'
> &
  Partial<Entity.EntityBaseSchema> & {
    attachments?: MediaEntity.CreateMediaInput[];
    externalProductCodes?: ItemEntity.ItemExternalProductCodeSchema[];
  };

export type UpdateInventoryItemRepositoryInput = Partial<
  Omit<InventoryItemEntity.InventoryItemSchema, 'createdById' | 'createdAt' | 'sku' | 'type'>
>;

interface siteLocationQuantityFields {
  siteId?: string | StringObjectID;
  locationId?: string | StringObjectID;
  quantity?: number;
}

export type CreateBulkImportInventoryRepositoryInput = CreateInventoryItemRepositoryInput & siteLocationQuantityFields;
export type CreateInventoryKitItemRepositoryInput = Omit<
  Pick<
    InventoryItemEntity.InventoryKitItemSchema,
    Exclude<keyof InventoryItemEntity.InventoryKitItemSchema, keyof Entity.EntityBaseSchema>
  >,
  'attachments' | 'externalProductCodes'
> &
  Partial<Entity.EntityBaseSchema> & {
    attachments?: MediaEntity.CreateMediaInput[];
    externalProductCodes?: ItemEntity.ItemExternalProductCodeSchema[];
  };

export type CreateAssetKitItemRepositoryInput = CreateInventoryKitItemRepositoryInput;

export interface UpdateInventoryKitItemCostInput {
  itemId: string;
  unitCostDelta: number;
}

export type ToUpdateInventoryKitRepoInput = Omit<InventoryItemEntity.UpdateInventoryKitItemInput, 'inventoryKitItemId'>;

export interface UpdateInventoryKitItemCostHelperInput {
  oldInventoryItem: InventoryItemEntity.InventoryItemSchema;
  updatedInventoryItem: InventoryItemEntity.InventoryItemSchema;
}
