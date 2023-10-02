import { ContactEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { CreateContactRepositoryInput } from '../../../types/Contact';

export const parseCreateContactInputs = (
  createContactInput: ContactEntity.CreateContactInput,
  userContext: UserContext,
): CreateContactRepositoryInput => {
  const parsedContactInput: CreateContactRepositoryInput = {
    ...createContactInput,
    fullName: `${createContactInput.firstName} ${createContactInput.lastName}`.trim(),
    status: ContactEntity.ContactStatusEnum.ACTIVE,
    updatedById: userContext.currentUserInfo._id,
    createdById: userContext.currentUserInfo._id,
    tenantId: userContext.tenantId,
  };
  return parsedContactInput;
};
