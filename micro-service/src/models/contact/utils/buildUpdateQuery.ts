/* eslint-disable prefer-destructuring */
import { ContactEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import mongoose, { UpdateQuery } from 'mongoose';
import { UpdateContactRepositoryInput } from '../../../types/Contact';

export function buildUpdateContactQuery(
  updatedContactDetails: UpdateContactRepositoryInput,
  userContext: UserContext,
): UpdateQuery<ContactEntity.ContactSchema> {
  let toSetField: UpdateQuery<ContactEntity.ContactSchema> = {};
  const toUnsetField: UpdateQuery<ContactEntity.ContactSchema> = {};
  for (const key in updatedContactDetails) {
    switch (key as keyof ContactEntity.ContactSchema) {
      case 'status':
      case 'firstName':
      case 'fullName':
      case 'lastName': {
        // eslint-disable-next-line prefer-destructuring
        const value = updatedContactDetails[key as keyof UpdateContactRepositoryInput];
        if (value) {
          toSetField[key] = value;
        }
        break;
      }
      case 'addressId':
      case 'companyId': {
        const value = updatedContactDetails[key as keyof UpdateContactRepositoryInput];
        if (value && mongoose.Types.ObjectId.isValid(value)) {
          toSetField[key] = new mongoose.Types.ObjectId(value);
        }
        break;
      }
      case 'email':
      case 'fax':
      case 'homeContactNumber':
      case 'officeContactNumber':
      case 'mobileContactNumber':
      case 'title':
      case 'deletedAt':
      case 'deletedById': {
        // eslint-disable-next-line prefer-destructuring
        const value = updatedContactDetails[key as keyof UpdateContactRepositoryInput];
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
