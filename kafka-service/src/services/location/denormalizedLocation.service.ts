import { logger } from '@procurenetworks/backend-utils';
import { ItemLocationEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { ItemLocationService } from '../../__transport/__grpc/client/services/inventory/itemLocation.service';
import { DocumentNameEnum } from '../../enums/document.enum';
import {
  buildExpandedFieldsObjectForDeleteEvents,
  buildExpandedFieldsObjectForUpdateEvents,
  getListOfDocumentsWithExpandedSortFields,
} from './utils';

import { MongoOperationTypeEnum } from '@procurenetworks/kafka-utils';
import { findIndex } from 'lodash';

export class DenormalizedLocationService {
  async syncLocationEvents(events: any[], userContext: UserContext): Promise<void> {
    try {
      const listOfDocumentsWithExpandedSortFields = getListOfDocumentsWithExpandedSortFields();
      for (const expandedDocumentName of listOfDocumentsWithExpandedSortFields) {
        const updatedDocIds = events?.map((event: any) => event.documentKey._id.$oid);
        if (updatedDocIds.length === 0) {
          return;
        }
        switch (expandedDocumentName) {
          case DocumentNameEnum.ITEM_LOCATIONS: {
            const { itemLocations } = await ItemLocationService.getAllItemLocations(
              { filters: { locationIds: updatedDocIds } },
              userContext,
            );
            const bulkUpdateItemLocationInputs = this.getBulkItemLocationInputsForUpdatedLocationEvents(
              events,
              itemLocations,
            );
            if (
              bulkUpdateItemLocationInputs &&
              bulkUpdateItemLocationInputs.updateExpandedSortFieldsInItemLocationInputs.length > 0
            ) {
              await ItemLocationService.bulkUpdateExpandedSortFields(bulkUpdateItemLocationInputs, userContext);
            }
            break;
          }
        }
      }
    } catch (error: any) {
      logger.error({ message: `Error occured in ${__filename} - ${this.syncLocationEvents.name}` });
    }
  }

  private getBulkItemLocationInputsForUpdatedLocationEvents(
    events: any[],
    itemLocations: Array<ItemLocationEntity.ItemLocationSchema>,
  ): ItemLocationEntity.BulkUpdateExpandedSortFieldsInItemLocationInput | undefined {
    try {
      const bulkUpdateItemLocationInputsForUpdatedLocationEvents: Array<ItemLocationEntity.UpdateExpandedSortFieldsInItemLocationInput> =
        [];
      events.forEach((event) => {
        const {
          documentKey: {
            _id: { $oid: updatedDocId },
          },
          operationType,
        } = event;
        const expandedItemLocationsToBeUpdated = itemLocations.filter(
          (itemLocation: any) => itemLocation.locationId.toString() === updatedDocId.toString(),
        );
        for (const expandedItemLocationToBeUpdated of expandedItemLocationsToBeUpdated) {
          let expandedSortFieldObject;
          switch (operationType) {
            case MongoOperationTypeEnum.UPDATE: {
              expandedSortFieldObject = buildExpandedFieldsObjectForUpdateEvents(
                event,
                expandedItemLocationToBeUpdated,
                DocumentNameEnum.ITEM_LOCATIONS,
              );
              break;
            }
            case MongoOperationTypeEnum.DELETE: {
              expandedSortFieldObject = buildExpandedFieldsObjectForDeleteEvents(
                expandedItemLocationToBeUpdated,
                DocumentNameEnum.ITEM_LOCATIONS,
              );
              break;
            }
            default: {
              expandedSortFieldObject = null;
              break;
            }
          }
          if (expandedSortFieldObject) {
            const existingIndex = findIndex(bulkUpdateItemLocationInputsForUpdatedLocationEvents, {
              itemLocationId: expandedItemLocationToBeUpdated?._id.toString(),
            });

            if (existingIndex === -1) {
              bulkUpdateItemLocationInputsForUpdatedLocationEvents.push({
                itemLocationId: expandedItemLocationToBeUpdated?._id.toString(),
                expandedSortFields: { ...expandedSortFieldObject },
              });
            } else {
              // Replace item at index using native splice
              bulkUpdateItemLocationInputsForUpdatedLocationEvents[existingIndex] = {
                ...bulkUpdateItemLocationInputsForUpdatedLocationEvents[existingIndex],
                itemLocationId: expandedItemLocationToBeUpdated?._id.toString(),
                expandedSortFields: { ...expandedSortFieldObject },
              };
            }
          }
        }
      });
      return { updateExpandedSortFieldsInItemLocationInputs: bulkUpdateItemLocationInputsForUpdatedLocationEvents };
    } catch (error: any) {
      logger.error({
        message: `Error occured in ${__filename} - ${this.getBulkItemLocationInputsForUpdatedLocationEvents.name}`,
      });
      return;
    }
  }
}
export const denormalisedLocationService = new DenormalizedLocationService();
