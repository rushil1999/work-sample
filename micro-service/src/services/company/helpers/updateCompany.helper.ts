import { CompanyEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { omit } from 'lodash';
import { UpdateCompanyRepositoryInput } from '../../../types/Company';

export function parseUpdateCompanyInput(
  updateCompanyInput: CompanyEntity.UpdateCompanyInput,
  userContext: UserContext,
): UpdateCompanyRepositoryInput {
  const updatedCompanyDetails: UpdateCompanyRepositoryInput = omit(updateCompanyInput, ['companyId']);
  updatedCompanyDetails.updatedById = userContext.currentUserInfo._id;

  if (updateCompanyInput.companyContactNumber === '') {
    updatedCompanyDetails.companyContactNumber = undefined;
  }

  if (updateCompanyInput.companyEmail === '') {
    updatedCompanyDetails.companyEmail = undefined;
  }

  if (updateCompanyInput.companyFax === '') {
    updatedCompanyDetails.companyFax = undefined;
  }

  if (updateCompanyInput.companyWebsite === '') {
    updatedCompanyDetails.companyWebsite = undefined;
  }
  return updatedCompanyDetails;
}
