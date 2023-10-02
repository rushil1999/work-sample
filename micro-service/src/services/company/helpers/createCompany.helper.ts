import { CompanyEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { CreateCompanyRepositoryInput } from '../../../types/Company';

export const parseCreateCompanyInputs = (
  createCompanyInput: CompanyEntity.CreateCompanyInput,
  userContext: UserContext,
): CreateCompanyRepositoryInput => {
  const parsedCompanyInput: CreateCompanyRepositoryInput = {
    ...createCompanyInput,
    status: CompanyEntity.CompanyStatusEnum.ACTIVE,
    updatedById: userContext.currentUserInfo._id,
    createdById: userContext.currentUserInfo._id,
    tenantId: userContext.tenantId,
  };
  return parsedCompanyInput;
};
