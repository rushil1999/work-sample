import { CompanyEntity, Entity } from '@procurenetworks/inter-service-contracts';

/** Version 2. */

/* Queries inputs */

/* Mutation inputs */
export type CreateCompanyRepositoryInput = Pick<
  CompanyEntity.CompanySchema,
  Exclude<keyof CompanyEntity.CompanySchema, keyof Entity.EntityBaseSchema>
>;

export type UpdateCompanyRepositoryInput = Partial<
  Omit<
    CompanyEntity.CompanySchema,
    'sqlId' | 'tenantId' | 'createdById' | 'deletedById' | 'deletedAt' | keyof Entity.EntityBaseSchema
  >
>;

export interface CreateCompaniesInput {
  CreateCompaniesInput: Array<CompanyEntity.CreateCompanyInput>;
}
