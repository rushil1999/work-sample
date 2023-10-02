import { Entity, ItemLocationConfigEntity } from '@procurenetworks/inter-service-contracts';

/** Version 2. */

/* Queries inputs */

/* Mutation inputs */
export type CreateItemLocationConfigRepositoryInput = Omit<
  Pick<
    ItemLocationConfigEntity.ItemLocationConfigSchema,
    Exclude<keyof ItemLocationConfigEntity.ItemLocationConfigSchema, keyof Entity.EntityBaseSchema>
  >,
  'deletedAt' | 'deletedById'
>;
