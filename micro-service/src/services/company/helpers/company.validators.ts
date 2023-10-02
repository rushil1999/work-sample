import { CreateCompanyRepositoryInput } from '@custom-types/Company';
import { ErrorCodeEnum, logger, ResourceNotFoundError, StatusCodes, ValidationError } from '@procurenetworks/backend-utils';
import { CompanyEntity, StringObjectID, UserContext } from '@procurenetworks/inter-service-contracts';
import { Types } from 'mongoose';
import { ItemService } from '../../item/item.service';
import { CompanyService } from '../company.service';
import { parseCreateCompanyInputs } from './createCompany.helper';

const validateObjectId = (field: string, value?: StringObjectID) => {
  if (!value || !Types.ObjectId.isValid(value)) {
    logger.error({ message: `${field} is invalid: ${value}` });
    throw new ValidationError({
      debugMessage: `Invalid field ${field} provided!`,
      errorCode: ErrorCodeEnum.INVALID_REQUEST_INPUT,
      httpStatus: StatusCodes.BAD_REQUEST,
      message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
      params: { field, value },
      where: `${__filename} - ${validateObjectId.name}`,
    });
  }
};
const validateCompanyName = (companyName: string) => {
  if (!companyName || typeof companyName !== 'string') {
    logger.error({ message: `Rejecting request due to invalid companyName: ${companyName}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid companyName: ${companyName}`,
      message: 'Please enter a valid companyName of the Company.',
      params: { companyName },
      where: `${__filename} - validateCompanyName`,
    }); // REVIEW: Ask @Scott
  }
};
const validateCompanyContactNumber = (companyContactNumber?: string) => {
  if (!companyContactNumber || typeof companyContactNumber !== 'string') {
    logger.error({ message: `Rejecting request due to invalid companyContactNumber: ${companyContactNumber}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid companyContactNumber: ${companyContactNumber}`,
      message: 'Please enter a valid companyContactNumber of the Company.',
      params: { companyContactNumber },
      where: `${__filename} - validateCompanyContactNumber`,
    }); // REVIEW: Ask @Scott
  }
};
const validateCompanyEmail = (companyEmail?: string) => {
  if (!companyEmail || typeof companyEmail !== 'string') {
    logger.error({ message: `Rejecting request due to invalid companyEmail: ${companyEmail}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid companyEmail: ${companyEmail}`,
      message: 'Please enter a valid companyEmail of the Company.',
      params: { companyEmail },
      where: `${__filename} - validateCompanyEmail`,
    }); // REVIEW: Ask @Scott
  }
};
const validateCompanyFax = (companyFax?: string) => {
  if (!companyFax || typeof companyFax !== 'string') {
    logger.error({ message: `Rejecting request due to invalid companyFax: ${companyFax}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid companyFax: ${companyFax}`,
      message: 'Please enter a valid companyFax of the Company.',
      params: { companyFax },
      where: `${__filename} - validateCompanyFax`,
    }); // REVIEW: Ask @Scott
  }
};
const validateCompanyWebsite = (companyWebsite?: string) => {
  if (!companyWebsite || typeof companyWebsite !== 'string') {
    logger.error({ message: `Rejecting request due to invalid companyWebsite: ${companyWebsite}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid companyWebsite: ${companyWebsite}`,
      message: 'Please enter a valid companyWebsite of the Company.',
      params: { companyWebsite },
      where: `${__filename} - validateCompanyWebsite`,
    }); // REVIEW: Ask @Scott
  }
};
const validateIsVendor = (isVendor?: boolean) => {
  if (typeof isVendor !== 'boolean') {
    logger.error({ message: `Rejecting request due to invalid isVendor: ${isVendor}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid isVendor: ${isVendor}`,
      message: 'Please enter a valid isVendor of the Company.',
      params: { isVendor },
      where: `${__filename} - validateIsVendor`,
    }); // REVIEW: Ask @Scott
  }
};

const isValidCompanyName = (companyName: string) => {
  if (!companyName || typeof companyName !== 'string') {
    logger.error({ message: `Rejecting request due to invalid companyName: ${companyName}` });
    return false;
  }
  return true;
};

const isValidCompanyContactNumber = (companyContactNumber?: string) => {
  if (companyContactNumber && typeof companyContactNumber !== 'string') {
    logger.error({ message: `Rejecting request due to invalid companyContactNumber: ${companyContactNumber}` });
    return false;
  }
  return true;
};

const isValidCompanyEmail = (companyEmail?: string) => {
  if (companyEmail && typeof companyEmail !== 'string') {
    logger.error({ message: `Rejecting request due to invalid companyEmail: ${companyEmail}` });
    return false;
  }
  return true;
};

const isValidCompanyFax = (companyFax?: string) => {
  if (companyFax && typeof companyFax !== 'string') {
    logger.error({ message: `Rejecting request due to invalid companyFax: ${companyFax}` });
    return false;
  }
  return true;
};

const isValidCompanyWebsite = (companyWebsite?: string) => {
  if (companyWebsite && typeof companyWebsite !== 'string') {
    logger.error({ message: `Rejecting request due to invalid companyWebsite: ${companyWebsite}` });
    return false;
  }
  return true;
};

const isValidIsVendor = (isVendor?: boolean) => {
  if (isVendor && typeof isVendor !== 'boolean') {
    logger.error({ message: `Rejecting request due to invalid isVendor: ${isVendor}` });
    return false;
  }
  return true;
};

export const isValidCreateCompanyInput = (createCompanyInput: CompanyEntity.CreateCompanyInput): boolean => {
  const { companyName, companyContactNumber, companyEmail, companyFax, companyWebsite, isVendor } = createCompanyInput;
  return (
    isValidCompanyName(companyName) &&
    isValidCompanyContactNumber(companyContactNumber) &&
    isValidCompanyEmail(companyEmail) &&
    isValidCompanyFax(companyFax) &&
    isValidCompanyWebsite(companyWebsite) &&
    isValidIsVendor(isVendor)
  );
};

export const filterValidCreateCompanyInput = (
  createCompaniesInput: CompanyEntity.CreateCompaniesInput,
  userContext: UserContext,
): Array<CreateCompanyRepositoryInput> => {
  const createCompaniesRepositoryInput: CreateCompanyRepositoryInput[] = [];
  for (const createCompanyInput of createCompaniesInput.createCompanyInputs) {
    if (isValidCreateCompanyInput(createCompanyInput)) {
      createCompaniesRepositoryInput.push(parseCreateCompanyInputs(createCompanyInput, userContext));
    }
  }
  return createCompaniesRepositoryInput;
};

export const validateCreateCompanyInput = (createCompanyInput: CompanyEntity.CreateCompanyInput): void => {
  const { companyName, companyContactNumber, companyEmail, companyFax, companyWebsite, isVendor } = createCompanyInput;

  validateCompanyName(companyName);
  companyContactNumber && validateCompanyContactNumber(companyContactNumber);
  companyEmail && validateCompanyEmail(companyEmail);
  companyFax && validateCompanyFax(companyFax);
  companyWebsite && validateCompanyWebsite(companyWebsite);
  typeof isVendor === 'boolean' && validateIsVendor(isVendor);
};

export const validateUpdateCompanyInput = async (
  updateCompanyInput: CompanyEntity.UpdateCompanyInput,
  userContext: UserContext,
): Promise<void> => {
  const { companyId, companyContactNumber, companyEmail, companyFax, companyName, companyWebsite, isVendor } =
    updateCompanyInput;
  validateObjectId('Company Id', companyId);
  companyName && validateCompanyName(companyName);
  companyContactNumber && validateCompanyContactNumber(companyContactNumber);
  companyEmail && validateCompanyEmail(companyEmail);
  companyFax && validateCompanyFax(companyFax);
  companyWebsite && validateCompanyWebsite(companyWebsite);
  typeof isVendor === 'boolean' && validateIsVendor(isVendor);

  const { companies } = await CompanyService.getAllCompanies({ filters: { companyIds: [companyId] } }, userContext);
  if (companies.length === 0) {
    throw new ResourceNotFoundError({
      debugMessage: `Company not found!`,
      message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
      params: { companyId, tenantId: userContext.tenantId },
      where: `${__filename} - ${validateUpdateCompanyInput.name}`,
    }); // REVIEW: Ask @scott
  }
};

export const validateDeleteCompaniesInput = async (
  deleteCompaniesInput: CompanyEntity.DeleteCompaniesInput,
  userContext: UserContext,
): Promise<void> => {
  const { companyIds } = deleteCompaniesInput;

  const invalidCompanyIds = companyIds.filter((companyId) => !Types.ObjectId.isValid(companyId));

  if (invalidCompanyIds.length !== 0) {
    logger.error({ message: `Request contains invalid company ids to be deleted: ${invalidCompanyIds}` });
    throw new ValidationError({
      debugMessage: `Invalid companyIds ${invalidCompanyIds} provided!`,
      message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
      params: { deleteCompaniesInput },
      where: `${__filename} - ${validateDeleteCompaniesInput.name}`,
    });
  }

  const { stringObjectIDFieldValues: stringFieldItemIds } = await ItemService.getDistinctValuesForAllItem(
    { filters: { vendorIds: companyIds }, field: '_id' },
    userContext,
  );
  if (stringFieldItemIds && stringFieldItemIds.length > 0) {
    logger.error({ message: `Request contains vendors associated to atleast one item` });
    throw new ValidationError({
      debugMessage: `Rejecting as vendor is associated to atleast one item`,
      message: `This Vendor is associated with at least one item and cannot be deleted.`,
      params: { deleteCompaniesInput },
      where: `${__filename} - ${validateDeleteCompaniesInput.name}`,
    });
  }
};
