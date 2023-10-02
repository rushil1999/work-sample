import { Entity, TenantEntity } from '@procurenetworks/inter-service-contracts';

export type CreateTenantRepositoryInput = Omit<TenantEntity.TenantSchema, keyof Entity.EntityBaseSchema>;
