import { Entity, ItemLocationEntity, StringObjectID } from '@procurenetworks/inter-service-contracts';

/** Version 2. */

/* Queries inputs */

/* Mutation inputs */
export type CreateItemLocationRepositoryInput = Omit<
  Pick<
    ItemLocationEntity.ItemLocationSchema,
    Exclude<keyof ItemLocationEntity.ItemLocationSchema, keyof Entity.EntityBaseSchema>
  >,
  'deletedAt' | 'deletedById' | 'updatedAt' | 'createdAt'
>;

export type BuildUpdateItemLocationQueryInput = Partial<
  Omit<ItemLocationEntity.ItemLocationSchema, 'createdById' | 'itemType' | 'siteId' | 'createdAt' | 'tenantId'>
>;

export type UpdateItemLocationRepositoryInput = Required<
  Pick<ItemLocationEntity.ItemLocationSchema, '__v' | 'itemId' | 'locationId'>
> &
  BuildUpdateItemLocationQueryInput;

export type RestockItemAtItemLocationRepositoryInput = Array<
  Omit<ItemLocationEntity.UpdateQuantityAtItemLocationInput, 'quantity'> &
    Required<Pick<Entity.EntityBaseSchema, '__v'>> &
    Pick<ItemLocationEntity.ItemLocationSchema, 'availableQuantity' | 'totalQuantity'>
>;

export type ReduceItemAtItemLocationRepositoryInput = Array<
  Omit<ItemLocationEntity.UpdateQuantityAtItemLocationInput, 'quantity'> &
    Required<Pick<Entity.EntityBaseSchema, '__v'>> &
    Pick<ItemLocationEntity.ItemLocationSchema, 'availableQuantity' | 'outOfStockAt' | 'totalQuantity'>
>;

/** Intermediate types */
interface ItemAndLocationId {
  itemId: StringObjectID;
  locationId: StringObjectID;
}
export interface BuildRollupQuantitiesFromLocationsOfItemLocationInput {
  itemAndLocationIds: ItemAndLocationId[];
  existingItemLocations: ItemLocationEntity.ItemLocationSchema[];
}

export type UpdateLocationTypeItemLocationsOfSiteRepositoryInput = Required<
  Pick<ItemLocationEntity.ItemLocationSchema, 'itemId' | 'siteId' | 'locationType'>
> &
  BuildUpdateItemLocationQueryInput;
