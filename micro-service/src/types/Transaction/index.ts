import { Entity, TransactionEntity } from '@procurenetworks/inter-service-contracts';

/* Queries inputs */

/* Mutation inputs */
export type CreateTransactionRepositoryInput = Omit<
  Pick<
    TransactionEntity.TransactionSchema,
    Exclude<keyof TransactionEntity.TransactionSchema, keyof Entity.EntityBaseSchema>
  > & {
    createdAt: string;
    updatedAt: string;
    _id?: string;
  },
  'deletedAt' | 'deletedById'
>;

export type UpdateTransactionRepositoryInput = Required<Pick<TransactionEntity.TransactionSchema, '_id'>> &
  Partial<Omit<TransactionEntity.TransactionSchema, 'createdById' | 'type' | 'subType'>>;
