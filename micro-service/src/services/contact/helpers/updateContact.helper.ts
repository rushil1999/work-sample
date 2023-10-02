import { ContactEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { omit } from 'lodash';
import { UpdateContactRepositoryInput } from '../../../types/Contact';

export function parseUpdateContactInput(
  updateContactInput: ContactEntity.UpdateContactInput,
  existingContact: ContactEntity.ContactSchema,
  userContext: UserContext,
): UpdateContactRepositoryInput {
  const updatedContactDetails: UpdateContactRepositoryInput = omit(updateContactInput, ['contactId']);
  updatedContactDetails.updatedById = userContext.currentUserInfo._id;
  if (updateContactInput.email === '') {
    updatedContactDetails.email = undefined;
  }

  if (updateContactInput.homeContactNumber === '') {
    updatedContactDetails.homeContactNumber = undefined;
  }

  if (updateContactInput.officeContactNumber === '') {
    updatedContactDetails.officeContactNumber = undefined;
  }

  if (updateContactInput.mobileContactNumber === '') {
    updatedContactDetails.mobileContactNumber = undefined;
  }

  if (updateContactInput.title === '') {
    updatedContactDetails.title = undefined;
  }

  if (updateContactInput.firstName || updateContactInput.lastName) {
    updatedContactDetails.fullName = `${updateContactInput.firstName || existingContact.firstName || ''} ${
      updateContactInput.lastName || existingContact.lastName || ''
    }`;
  }

  return updatedContactDetails;
}
