import { logger, ResourceNotFoundError } from '@procurenetworks/backend-utils';
import { ItemLocationEntity, ShippingContainerEntity } from '@procurenetworks/inter-service-contracts';
import { DocumentNameEnum } from '../../enums/document.enum';
export const getListOfDocumentsWithExpandedSortFields = () => {
  return [DocumentNameEnum.ITEM_LOCATIONS, DocumentNameEnum.SHIPPING_CONTAINERS]; // Add documents that will have expandedSortedFields
};

export const getExpandedFieldsMapping = (documentToUpdateName: string): Record<string, string> | null => {
  // key will be fieldName in document that had the change
  // value will be the fieldName in the expanded Document
  switch (documentToUpdateName) {
    case DocumentNameEnum.ITEM_LOCATIONS: {
      return {
        name: 'siteName',
      };
    }
    case DocumentNameEnum.SHIPPING_CONTAINERS: {
      return {
        name: 'destinationSiteName',
      };
    }

    default: {
      return null;
    }
  }
};

const getExpandedFieldNameForItemLocations = (fieldNameInUpdatedDocument: string) => {
  switch (fieldNameInUpdatedDocument) {
    case 'name': {
      return 'siteName';
    }
    default: {
      return null;
    }
  }
};

const getExpandedFieldNameForShippingContainers = (fieldNameInUpdatedDocument: string) => {
  switch (fieldNameInUpdatedDocument) {
    case 'name': {
      return 'destinationSiteName';
    }
    default: {
      return null;
    }
  }
};
export const buildExpandedFieldsObjectForUpdateEvents = (
  event: any,
  documentToChange: ItemLocationEntity.ItemLocationSchema,
  documentToChangeName: string,
):
  | ItemLocationEntity.ItemLocationExpandedSortFieldsSchema
  | ShippingContainerEntity.ShippingContainerExpandedSortFieldsSchema
  | undefined => {
  try {
    const expandedFieldsObject: any = documentToChange.expandedSortFields || {};
    const {
      updateDescription: { removedFields, updatedFields },
    } = event;
    for (const updatedFieldName in updatedFields) {
      // eslint-disable-next-line prefer-destructuring
      const updatedValue = updatedFields[updatedFieldName];
      switch (documentToChangeName) {
        case DocumentNameEnum.ITEM_LOCATIONS: {
          const expandedFieldName = getExpandedFieldNameForItemLocations(updatedFieldName);
          expandedFieldsObject[expandedFieldName as keyof ItemLocationEntity.ItemLocationExpandedSortFieldsSchema] =
            updatedValue;
          break;
        }
        case DocumentNameEnum.SHIPPING_CONTAINERS: {
          const expandedFieldName = getExpandedFieldNameForShippingContainers(updatedFieldName);
          expandedFieldsObject[
            expandedFieldName as keyof ShippingContainerEntity.ShippingContainerExpandedSortFieldsSchema
          ] = updatedValue;
          break;
        }
      }
    }

    for (const removedFieldName in removedFields) {
      switch (documentToChangeName) {
        case DocumentNameEnum.ITEM_LOCATIONS: {
          const expandedFieldName = getExpandedFieldNameForItemLocations(removedFieldName);
          delete expandedFieldsObject[expandedFieldName as keyof ItemLocationEntity.ItemLocationExpandedSortFieldsSchema];
          break;
        }
        case DocumentNameEnum.SHIPPING_CONTAINERS: {
          const expandedFieldName = getExpandedFieldNameForShippingContainers(removedFieldName);
          delete expandedFieldsObject[expandedFieldName as keyof ItemLocationEntity.ItemLocationExpandedSortFieldsSchema];
          break;
        }
      }
    }
    return expandedFieldsObject;
  } catch (error) {
    logger.error({ message: `Error occured in ${__filename} - ${buildExpandedFieldsObjectForUpdateEvents.name}` });
  }
};

export const buildExpandedFieldsObjectForDeleteEvents = (
  docuentToChange: ItemLocationEntity.ItemLocationSchema,
  documentToChangeName: string,
):
  | ItemLocationEntity.ItemLocationExpandedSortFieldsSchema
  | ShippingContainerEntity.ShippingContainerExpandedSortFieldsSchema
  | undefined => {
  try {
    const expandedFieldsObject: any = docuentToChange.expandedSortFields || {};
    const expandedFieldsMap = getExpandedFieldsMapping(documentToChangeName);
    if (!expandedFieldsMap) {
      throw new ResourceNotFoundError({
        debugMessage: `Expanded fields mapping not found`,
        message: 'Expanded fields mapping not found',
        where: `${__filename} - ${buildExpandedFieldsObjectForDeleteEvents.name}`,
      });
    }
    for (const expandedFieldName of Object.values(expandedFieldsMap)) {
      delete expandedFieldsObject[expandedFieldName as keyof ItemLocationEntity.ItemLocationExpandedSortFieldsSchema];
    }
    return expandedFieldsObject;
  } catch (error: any) {
    logger.error({ message: `Error occured in ${__filename} - ${buildExpandedFieldsObjectForDeleteEvents.name}` });
  }
};
