import { ErrorCodeEnum, logger, ResourceNotFoundError, StatusCodes, ValidationError } from '@procurenetworks/backend-utils';
import { ContactEntity, StringObjectID, UserContext } from '@procurenetworks/inter-service-contracts';
import { Types } from 'mongoose';
import { ContactService } from '../contact.service';

const validateObjectId = (field: string, value?: StringObjectID) => {
  if (!value || !Types.ObjectId.isValid(value)) {
    logger.error({ message: `${field} is invalid: ${value}` });
    throw new ValidationError({
      debugMessage: `Invalid ${field} ${value} provided!`,
      message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
      params: { field, value },
      where: `${__filename} - ${validateObjectId.name}`,
    }); // REVIEW: Ask @Scott
  }
};

const validateFirstName = (firstName: string) => {
  if (!firstName || typeof firstName !== 'string') {
    logger.error({ message: `Rejecting request due to invalid firstName: ${firstName}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid firstName: ${firstName}`,
      message: 'Please enter a valid firstName of the Contact.',
      params: { firstName },
      where: `${__filename} - validateFirstName`,
    }); // REVIEW: Ask @Scott
  }
};
const validateLastName = (lastName: string) => {
  if (!lastName || typeof lastName !== 'string') {
    logger.error({ message: `Rejecting request due to invalid lastName: ${lastName}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid lastName: ${lastName}`,
      message: 'Please enter a valid lastName of the Contact.',
      params: { lastName },
      where: `${__filename} - validateLastName`,
    }); // REVIEW: Ask @Scott
  }
};
const validateCompanySqlId = (companySqlId: number) => {
  if (!companySqlId || typeof companySqlId !== 'number') {
    logger.error({ message: `Rejecting request due to invalid companySqlId: ${companySqlId}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid companySqlId: ${companySqlId}`,
      message: 'Please enter a valid companySqlId of the Contact.',
      params: { companySqlId },
      where: `${__filename} - validateCompanySqlId`,
    }); // REVIEW: Ask @Scott
  }
};
const validateEmail = (email: string) => {
  if (!email || typeof email !== 'string') {
    logger.error({ message: `Rejecting request due to invalid email: ${email}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid email: ${email}`,
      message: 'Please enter a valid email of the Contact.',
      params: { email },
      where: `${__filename} - validateEmail`,
    }); // REVIEW: Ask @Scott
  }
};
const validateFax = (fax: string) => {
  if (!fax || typeof fax !== 'string') {
    logger.error({ message: `Rejecting request due to invalid fax: ${fax}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid fax: ${fax}`,
      message: 'Please enter a valid fax of the Contact.',
      params: { fax },
      where: `${__filename} - validateFax`,
    }); // REVIEW: Ask @Scott
  }
};
const validateHomeContactNumber = (homeContactNumber: string) => {
  if (!homeContactNumber || typeof homeContactNumber !== 'string') {
    logger.error({ message: `Rejecting request due to invalid homeContactNumber: ${homeContactNumber}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid homeContactNumber: ${homeContactNumber}`,
      message: 'Please enter a valid homeContactNumber of the Contact.',
      params: { homeContactNumber },
      where: `${__filename} - validateHomeContactNumber`,
    }); // REVIEW: Ask @Scott
  }
};
const validateMobileContactNumber = (mobileContactNumber: string) => {
  if (!mobileContactNumber || typeof mobileContactNumber !== 'string') {
    logger.error({ message: `Rejecting request due to invalid mobileContactNumber: ${mobileContactNumber}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid mobileContactNumber: ${mobileContactNumber}`,
      message: 'Please enter a valid mobileContactNumber of the Contact.',
      params: { mobileContactNumber },
      where: `${__filename} - validateMobileContactNumber`,
    }); // REVIEW: Ask @Scott
  }
};
const validateOfficeContactNumber = (officeContactNumber: string) => {
  if (!officeContactNumber || typeof officeContactNumber !== 'string') {
    logger.error({ message: `Rejecting request due to invalid officeContactNumber: ${officeContactNumber}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid officeContactNumber: ${officeContactNumber}`,
      message: 'Please enter a valid officeContactNumber of the Contact.',
      params: { officeContactNumber },
      where: `${__filename} - validateOfficeContactNumber`,
    }); // REVIEW: Ask @Scott
  }
};
const validateTitle = (title: string) => {
  if (!title || typeof title !== 'string') {
    logger.error({ message: `Rejecting request due to invalid title: ${title}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid title: ${title}`,
      message: 'Please enter a valid title of the Contact.',
      params: { title },
      where: `${__filename} - validateTitle`,
    }); // REVIEW: Ask @Scott
  }
};

export const validateCreateContactInput = (createContactInput: ContactEntity.CreateContactInput): void => {
  const {
    addressId,
    companyId,
    firstName,
    lastName,
    companySqlId,
    email,
    fax,
    homeContactNumber,
    mobileContactNumber,
    officeContactNumber,
    title,
  } = createContactInput;

  validateObjectId('Address Id', addressId);
  validateObjectId('Company Id', companyId);
  validateFirstName(firstName);
  validateLastName(lastName);
  companySqlId && validateCompanySqlId(companySqlId);
  email && validateEmail(email);
  fax && validateFax(fax);
  homeContactNumber && validateHomeContactNumber(homeContactNumber);
  mobileContactNumber && validateMobileContactNumber(mobileContactNumber);
  officeContactNumber && validateOfficeContactNumber(officeContactNumber);
  title && validateTitle(title);
};

export const validateUpdateContactInput = async (
  updateContactInput: ContactEntity.UpdateContactInput,
  existingContact: ContactEntity.ContactSchema,
): Promise<void> => {
  const {
    contactId,
    addressId,
    companyId,
    companySqlId,
    email,
    fax,
    firstName,
    homeContactNumber,
    lastName,
    mobileContactNumber,
    officeContactNumber,
    title,
  } = updateContactInput;

  validateObjectId('Contact Id', contactId);
  addressId && validateObjectId('Address Id', addressId);
  companyId && validateObjectId('Company Id', companyId);
  firstName && validateFirstName(firstName);
  lastName && validateLastName(lastName);
  companySqlId && validateCompanySqlId(companySqlId);
  email && validateEmail(email);
  fax && validateFax(fax);
  homeContactNumber && validateHomeContactNumber(homeContactNumber);
  mobileContactNumber && validateMobileContactNumber(mobileContactNumber);
  officeContactNumber && validateOfficeContactNumber(officeContactNumber);
  title && validateTitle(title);

  if (!existingContact) {
    throw new ResourceNotFoundError({
      debugMessage: `Contact not found!`,
      errorCode: ErrorCodeEnum.RESOURCE_NOT_FOUND,
      httpStatus: StatusCodes.NOT_FOUND,
      message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
      params: { contactId, companyId },
      where: `${__filename} - ${validateUpdateContactInput.name}`,
    }); // REVIEW: Ask @scott
  }
};

export const validateDeleteContactsInput = (
  deleteContactsInput: ContactEntity.DeleteContactsInput,
  userContext: UserContext,
): void => {
  const { contactIds } = deleteContactsInput;

  const invalidContactIds = contactIds.filter((contactId) => !Types.ObjectId.isValid(contactId));

  if (invalidContactIds.length !== 0) {
    logger.error({ message: `Request contains invalid contact ids to be deleted: ${invalidContactIds}` });
    throw new ValidationError({
      debugMessage: `Invalid contactIds ${invalidContactIds} provided!`,
      errorCode: ErrorCodeEnum.INVALID_REQUEST_INPUT,
      httpStatus: StatusCodes.BAD_REQUEST,
      message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
      params: { deleteContactsInput },
      where: `${__filename} - ${validateDeleteContactsInput.name}`,
    });
  }
};

export const validateDeleteContactsByCompanyIdInput = (companyIds: StringObjectID[], userContext: UserContext): void => {
  companyIds.forEach((companyId) => validateObjectId('Company Id', companyId));
};
