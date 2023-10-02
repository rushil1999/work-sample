import { AssetItemEntity, Entity, ItemEntity, MediaEntity, StringObjectID } from '@procurenetworks/inter-service-contracts';

/** Version 2. */

/* Queries inputs */

/* Mutation inputs */
export type CreateAssetItemRepositoryInput = Omit<
  Pick<AssetItemEntity.AssetItemSchema, Exclude<keyof AssetItemEntity.AssetItemSchema, keyof Entity.EntityBaseSchema>>,
  'attachments' | 'externalProductCodes' | 'protectedAttachments'
> &
  Partial<Entity.EntityBaseSchema> & {
    attachments?: MediaEntity.CreateMediaInput[];
    protectedAttachments?: MediaEntity.CreateMediaInput[];
    externalProductCodes?: ItemEntity.ItemExternalProductCodeSchema[];
    _id: string;
  };

export type UpdateAssetItemRepositoryInput = Partial<
  Omit<AssetItemEntity.AssetItemSchema, 'createdById' | 'createdAt' | 'sku' | 'type'>
> & {
  itemId: StringObjectID;
};

export interface UpdateAssetItemReminderRepositoryInput extends AssetItemEntity.UpdateAssetItemReminderInput {
  status?: AssetItemEntity.AssetItemReminderStatusEnum;
}

interface siteLocationQuantityFields {
  siteId?: string | StringObjectID;
  locationId?: string | StringObjectID;
  quantity?: number;
}

export type CreateBulkImportAssetRepositoryInput = CreateAssetItemRepositoryInput & siteLocationQuantityFields;
export interface UpdateAssetKitItemCostHelperInput {
  oldAssetItem: AssetItemEntity.AssetItemSchema;
  updatedAssetItem: AssetItemEntity.AssetItemSchema;
}

export interface UpdateAssetKitItemCostInput {
  itemId: string;
  unitCostDelta: number;
}

export type ToUpdateAssetKitRepoInput = Omit<AssetItemEntity.UpdateAssetKitItemInput, 'assetKitItemId'>;
