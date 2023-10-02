import { logger, ProcureError, ResourceNotFoundError, ValidationError } from '@procurenetworks/backend-utils';
import {
  AssetItemEntity,
  InventoryItemEntity,
  ItemEntity,
  ItemLocationEntity,
  MediaEntity,
  StringObjectID,
  TransactionEntity,
  UserContext,
} from '@procurenetworks/inter-service-contracts';
import { CompanyService } from '@services/company/company.service';
import { CategoryService, LocationService } from '@transport/__grpc/client/services';
import { Types } from 'mongoose';

export const validateAttachments = (attachments: MediaEntity.MediaSchema[]) => {
  if (!Array.isArray(attachments)) {
    logger.error({ message: `Rejecting request due to invalid attachments: ${attachments}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid attachments: ${attachments}`,
      message: 'Please enter a valid attachments of the item.',
      params: { attachments },
      where: `${__filename} - validateAttachments`,
    }); // REVIEW: Ask @Scott
  }
};

export const validateExternalProductCodes = (externalProductCodes: ItemEntity.ItemExternalProductCodeSchema[]) => {
  if (!Array.isArray(externalProductCodes)) {
    logger.error({ message: `Rejecting request due to invalid externalProductCodes: ${externalProductCodes}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid externalProductCodes: ${externalProductCodes}`,
      message: 'Please enter a valid externalProductCodes of the item.',
      params: { externalProductCodes },
      where: `${__filename} - validateExternalProductCodes`,
    }); // REVIEW: Ask @Scott
  }
};

export const validateVendorId = async (vendorId: StringObjectID, userContext: UserContext) => {
  if (!Types.ObjectId.isValid(vendorId)) {
    logger.error({ message: `Rejecting request due to invalid vendorId: ${vendorId}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid vendorId: ${vendorId}`,
      message: 'Please enter a valid vendorId of the item.',
      params: { vendorId },
      where: `${__filename} - validateVendorId`,
    }); // REVIEW: Ask @Scott
  }
  const { totalCount, edges } = await CompanyService.getPaginatedCompanies(
    { filters: { companyIds: [vendorId] }, paginationProps: { limit: 1 } },
    userContext,
  );
  if (!totalCount) {
    logger.error({ message: `Rejecting request due to vendor not found/accessible vendorId: ${vendorId}` });
    throw new ResourceNotFoundError({
      debugMessage: `Rejecting request due to vendor not found/accessible for vendorId: ${vendorId}`,
      message: 'Please select a valid vendorId of the item.',
      params: { vendorId },
      where: `${__filename} - validateVendorId`,
    }); // REVIEW: Ask @Scott
  }
  const { node } = edges[0];
  const { isVendor } = node;
  if (isVendor === false) {
    logger.error({ message: `Rejecting request due to company not a vendor with vendorId: ${vendorId}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to company not being a vendor with vendorId: ${vendorId}`,
      message:
        'This company is not a vendor. Please select the vendor check box under the Company Name to classify this company as a vendor.',
      params: { vendorId },
      where: `${__filename} - validateVendorId`,
    });
  }
};

export const validateDescription = (description?: string) => {
  if (description && typeof description !== 'string') {
    logger.error({ message: `Rejecting request due to invalid description: ${description}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid description: ${description}`,
      message: 'Please select a valid description of the item to be created.',
      params: { description },
      where: `${__filename} - validateDescription`,
    }); // REVIEW: Ask @Scott
  }
};

export const validateTitle = (title: string) => {
  if (!title || typeof title !== 'string') {
    logger.error({ message: `Rejecting request due to invalid title: ${title}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid title: ${title}`,
      message: 'Please enter a valid title of the item to be created.',
      params: { title },
      where: `${__filename} - validateTitle`,
    }); // REVIEW: Ask @Scott
  }
};

export const validateCategoryId = async (categoryId: StringObjectID, userContext: UserContext) => {
  if (!Types.ObjectId.isValid(categoryId)) {
    logger.error({ message: `Rejecting request due to invalid categoryId: ${categoryId}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid categoryId: ${categoryId}`,
      message: 'Please enter a valid categoryId of the item.',
      params: { categoryId },
      where: `${__filename} - validateCategoryId`,
    }); // REVIEW: Ask @Scott
  }
  const { totalCount } = await CategoryService.getPaginatedCategories(
    { filters: { categoryIds: [categoryId] }, paginationProps: { limit: 1 } },
    userContext,
  );
  if (!totalCount) {
    logger.error({ message: `Rejecting request due to category not found/accessible for categoryId: ${categoryId}` });
    throw new ResourceNotFoundError({
      debugMessage: `Category not found/accessible for categoryId: ${categoryId}`,
      message: 'Please select a valid category of the item.',
      params: { categoryId },
      where: `${__filename} - validateCategoryId`,
    }); // REVIEW: Ask @Scott
  }
};

export const validateUndeleteItemsInput = (
  undeleteAssetItemsInput: ItemEntity.UndeleteItemsInput,
): { validItemIds: StringObjectID[]; errors: ProcureError[] } => {
  const { itemIds } = undeleteAssetItemsInput;

  const errors: ProcureError[] = [];
  const validItemIds: StringObjectID[] = [];
  itemIds.forEach((itemId) => {
    if (Types.ObjectId.isValid(itemId)) {
      validItemIds.push(itemId);
    } else {
      logger.error({
        message: `item id ${itemId} is not a valid ObjectId`,
      });
    }
  });
  return { validItemIds, errors };
};

export const validateEligibleUndeleteItemTransactions = async (
  eligibleTransactions: TransactionEntity.TransactionSchema[],
  validItemIds: StringObjectID[],
  userContext: UserContext,
): Promise<{
  validEligibleTransactions: TransactionEntity.TransactionSchema[];
  validItemIds: StringObjectID[] | string[];
}> => {
  const validEligibleTransactions: TransactionEntity.TransactionSchema[] = [];
  const invalidItemIds: StringObjectID[] = [];
  const transactionsSourceSiteIds = eligibleTransactions.map((transaction) => transaction.sourceSiteId as StringObjectID);
  const { locations } = await LocationService.getAllLocations(
    { filters: { siteIds: transactionsSourceSiteIds } },
    userContext,
  );
  for (const transaction of eligibleTransactions) {
    const restockSitesForTransaction = locations.filter(
      (location) => location._id.toString() === transaction.sourceSiteId?.toString(),
    );
    if (restockSitesForTransaction.length === 0) {
      logger.error({
        message: `Site with id ${transaction.sourceSiteId
          } does not exist or isn't active for transaction with id ${transaction._id.toString()}`,
      });
      invalidItemIds.push(transaction.entityId.toString());
    } else {
      validEligibleTransactions.push(transaction);
    }
  }
  let filteredValidItemIds = validItemIds.filter((itemId) => !invalidItemIds.includes(itemId.toString()));
  filteredValidItemIds = filteredValidItemIds.map((filteredValidItemId) => filteredValidItemId.toString());
  const validElgibleTransactionWithValidItemIds = validEligibleTransactions.filter((transaction) =>
    filteredValidItemIds.includes(transaction.entityId.toString()),
  );
  return {
    validEligibleTransactions: validElgibleTransactionWithValidItemIds,
    validItemIds: filteredValidItemIds,
  };
};
export function validateKitConfig(
  createKitItemInput: AssetItemEntity.CreateAssetKitItemInput | InventoryItemEntity.CreateInventoryKitItemInput,
  itemLocations: Array<ItemLocationEntity.ItemLocationSchema>,
): void {
  const { kitConfigs, quantity, } = createKitItemInput;

  const itemLocationByItemIdLocationId: Record<string, ItemLocationEntity.ItemLocationSchema> = {};
  for (const itemLocation of itemLocations) {
    const { itemId, locationId } = itemLocation;
    itemLocationByItemIdLocationId[`${itemId.toString()}:${locationId.toString()}`] = itemLocation;
  }

  // TODO: If item has serialNumber attached to it, then quantity should not be more than 1

  for (const kitConfig of kitConfigs) {
    const { count, itemId, locationId } = kitConfig;
    const totalQuantityRequired = count * quantity;

    // no validation required as it is 0
    if (totalQuantityRequired === 0) {
      continue;
    }

    // eslint-disable-next-line prefer-destructuring
    const requiredItemLocation = itemLocationByItemIdLocationId[`${itemId.toString()}:${locationId.toString()}`];
    if (!requiredItemLocation) {
      throw new ResourceNotFoundError({
        debugMessage: `ItemLocation not found while creating kit`,
        where: 'validateKitConfig',
        message:
          'Insufficient items exist to build this quantity of kits. Please reduce the quantity of kits or restock (quantity) of (inventory code) to inventory.',
        params: { itemId, locationId },
      });
    }

    const { availableQuantity } = requiredItemLocation;
    if (availableQuantity < count * quantity) {
      throw new ValidationError({
        debugMessage: `Rejecting request due to invalid input quantity`,
        message:
          'Insufficient items exist to build this quantity of kits. Please reduce the quantity of kits or restock (quantity) of (inventory code) to inventory',
        params: { ...kitConfig, quantity },
        where: `${__filename} - validateKitConfig`,
      });
    }
  }
}
