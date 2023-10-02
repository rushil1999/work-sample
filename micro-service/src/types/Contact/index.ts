import { ContactEntity, Entity } from '@procurenetworks/inter-service-contracts';

/** Version 2. */

/* Queries inputs */

/* Mutation inputs */
export type CreateContactRepositoryInput = Pick<
  ContactEntity.ContactSchema,
  Exclude<keyof ContactEntity.ContactSchema, keyof Entity.EntityBaseSchema>
>;

export type UpdateContactRepositoryInput = Partial<
  Omit<
    ContactEntity.ContactSchema,
    'companySqlId' | 'tenantId' | 'createdById' | 'deletedById' | 'deletedAt' | keyof Entity.EntityBaseSchema
  >
>;
