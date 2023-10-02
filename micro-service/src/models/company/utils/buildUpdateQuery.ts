/* eslint-disable prefer-destructuring */
import { CompanyEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { UpdateQuery } from 'mongoose';
import { UpdateCompanyRepositoryInput } from '../../../types/Company';

export function buildUpdateCompanyQuery(
  updatedCompanyDetails: UpdateCompanyRepositoryInput,
  userContext: UserContext,
): UpdateQuery<CompanyEntity.CompanySchema> {
  let toSetField: UpdateQuery<CompanyEntity.CompanySchema> = {};
  const toUnsetField: UpdateQuery<CompanyEntity.CompanySchema> = {};
  for (const key in updatedCompanyDetails) {
    switch (key as keyof CompanyEntity.CompanySchema) {
      case 'status':
      case 'isVendor':
      case 'companyName': {
        // eslint-disable-next-line prefer-destructuring
        const value = updatedCompanyDetails[key as keyof UpdateCompanyRepositoryInput];
        if (value || value === false) {
          toSetField[key] = value;
        }
        break;
      }
      case 'companyEmail':
      case 'companyFax':
      case 'companyContactNumber':
      case 'companyWebsite':
      case 'deletedAt':
      case 'deletedById': {
        // eslint-disable-next-line prefer-destructuring
        const value = updatedCompanyDetails[key as keyof UpdateCompanyRepositoryInput];
        if (value) {
          toSetField[key] = value;
        }
        if (value === undefined || value === null || value === 'null' || value === '') {
          toUnsetField[key] = 1;
        }
        break;
      }
    }
  }

  /* set default fields */
  toSetField = { ...toSetField, updatedAt: userContext.requestTimestamp, updatedById: userContext.currentUserInfo._id };
  return { $set: toSetField, $unset: toUnsetField };
}
