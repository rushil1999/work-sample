import { logger } from '@procurenetworks/backend-utils';
import { ItemLocationEntity, ShippingContainerEntity } from '@procurenetworks/inter-service-contracts';
import { ItemLocationService } from '../../__transport/__grpc/client/services/inventory/itemLocation.service';

import { MongoOperationTypeEnum } from '@procurenetworks/kafka-utils';
import { findIndex } from 'lodash';
import { ShippingContainerService } from '../../__transport/__grpc/client/services/shipping';
import { DocumentNameEnum } from '../../enums/document.enum';
import {
  buildExpandedFieldsObjectForDeleteEvents,
  buildExpandedFieldsObjectForUpdateEvents,
  getListOfDocumentsWithExpandedSortFields,
} from './utils';
export class DenormalizedSiteService {
  async syncSiteEvents(events: any[], userContext: any): Promise<void> {
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
              { filters: { siteIds: updatedDocIds } },
              userContext,
            );
            const bulkUpdateItemLocationInputs = this.getBulkItemLocationInputsForUpdatedSiteEvents(events, itemLocations);
            if (
              bulkUpdateItemLocationInputs &&
              bulkUpdateItemLocationInputs.updateExpandedSortFieldsInItemLocationInputs.length > 0
            ) {
              await ItemLocationService.bulkUpdateExpandedSortFields(bulkUpdateItemLocationInputs, userContext);
            }
            break;
          }
          case DocumentNameEnum.SHIPPING_CONTAINERS: {
            const { shippingContainers } = await ShippingContainerService.getAllShippingContainers(
              {
                filters: { destinationSiteIds: updatedDocIds },
              },
              userContext,
            );
            const bulkUpdateShippingContainerInputs = this.getBulkShippingContainerInputsForUpdatedSiteEvents(
              events,
              shippingContainers,
            );
            if (
              bulkUpdateShippingContainerInputs &&
              bulkUpdateShippingContainerInputs.updateExpandedSortFieldsInShippingContainerInputs.length > 0
            ) {
              await ShippingContainerService.bulkUpdateExpandedSortFields(bulkUpdateShippingContainerInputs, userContext);
            }
            break;
          }
        }
      }
    } catch (error: any) {
      logger.error({ message: `Error occured in ${__filename} - ${this.syncSiteEvents.name}` });
    }
  }

  private getBulkItemLocationInputsForUpdatedSiteEvents(
    events: any[],
    itemLocations: Array<ItemLocationEntity.ItemLocationSchema>,
  ): ItemLocationEntity.BulkUpdateExpandedSortFieldsInItemLocationInput | undefined {
    try {
      const bulkUpdateItemLocationInputsForUpdatedSiteEvents: Array<ItemLocationEntity.UpdateExpandedSortFieldsInItemLocationInput> =
        [];
      events.forEach((event) => {
        const {
          documentKey: {
            _id: { $oid: updatedDocId },
          },
          operationType,
        } = event;
        const expandedItemLocationsToBeUpdated = itemLocations.filter(
          (itemLocation: any) => itemLocation.siteId.toString() === updatedDocId.toString(),
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
            const existingIndex = findIndex(bulkUpdateItemLocationInputsForUpdatedSiteEvents, {
              itemLocationId: expandedItemLocationToBeUpdated?._id.toString(),
            });

            if (existingIndex === -1) {
              bulkUpdateItemLocationInputsForUpdatedSiteEvents.push({
                itemLocationId: expandedItemLocationToBeUpdated?._id.toString(),
                expandedSortFields: expandedSortFieldObject as ItemLocationEntity.ItemLocationExpandedSortFieldsSchema,
              });
            } else {
              // Replace item at index using native splice
              bulkUpdateItemLocationInputsForUpdatedSiteEvents[existingIndex] = {
                ...bulkUpdateItemLocationInputsForUpdatedSiteEvents[existingIndex],
                itemLocationId: expandedItemLocationToBeUpdated?._id.toString(),
                expandedSortFields: expandedSortFieldObject as ItemLocationEntity.ItemLocationExpandedSortFieldsSchema,
              };
            }
          }
        }
      });
      return { updateExpandedSortFieldsInItemLocationInputs: bulkUpdateItemLocationInputsForUpdatedSiteEvents };
    } catch (error) {
      logger.error({
        message: `Error occured in ${__filename} - ${this.getBulkItemLocationInputsForUpdatedSiteEvents.name}`,
      });
      return;
    }
  }

  private getBulkShippingContainerInputsForUpdatedSiteEvents(
    events: any[],
    shippingContainers: any[],
  ): ShippingContainerEntity.BulkUpdateExpandedSortFieldsInItemLocationInput | undefined {
    try {
      const bulkShippingContainerInputsForUpdatedSiteEvents: any[] = [];
      events.forEach((event) => {
        const {
          documentKey: {
            _id: { $oid: updatedDocId },
          },
          operationType,
        } = event;
        const expandedShippingContainersToBeUpdated = shippingContainers.filter(
          (shippingContainer: any) => shippingContainer.destinationSiteId.toString() === updatedDocId.toString(),
        );
        for (const expandedShippingContainerToBeUpdated of expandedShippingContainersToBeUpdated) {
          let expandedSortFieldObject;
          switch (operationType) {
            case MongoOperationTypeEnum.UPDATE: {
              expandedSortFieldObject = buildExpandedFieldsObjectForUpdateEvents(
                event,
                expandedShippingContainerToBeUpdated,
                DocumentNameEnum.SHIPPING_CONTAINERS,
              );
              break;
            }
            case MongoOperationTypeEnum.DELETE: {
              expandedSortFieldObject = buildExpandedFieldsObjectForDeleteEvents(
                event,
                expandedShippingContainerToBeUpdated,
              );
              break;
            }
            default: {
              expandedSortFieldObject = null;
              break;
            }
          }
          if (expandedSortFieldObject) {
            const existingIndex = findIndex(bulkShippingContainerInputsForUpdatedSiteEvents, {
              shippingContainerId: expandedShippingContainerToBeUpdated?._id.toString(),
            });

            if (existingIndex === -1) {
              bulkShippingContainerInputsForUpdatedSiteEvents.push({
                shippingContainerId: expandedShippingContainerToBeUpdated?._id.toString(),
                expandedSortFields:
                  expandedSortFieldObject as ShippingContainerEntity.ShippingContainerExpandedSortFieldsSchema,
              });
            } else {
              // Replace item at index using native splice
              bulkShippingContainerInputsForUpdatedSiteEvents[existingIndex] = {
                ...bulkShippingContainerInputsForUpdatedSiteEvents[existingIndex],
                shippingContainerId: expandedShippingContainerToBeUpdated?._id.toString(),
                expandedSortFields:
                  expandedSortFieldObject as ShippingContainerEntity.ShippingContainerExpandedSortFieldsSchema,
              };
            }
          }
        }
      });
      return { updateExpandedSortFieldsInShippingContainerInputs: bulkShippingContainerInputsForUpdatedSiteEvents };
    } catch (error) {
      logger.error({
        message: `Error occured in ${__filename} - ${this.getBulkShippingContainerInputsForUpdatedSiteEvents.name}`,
      });
    }
  }
}

export const denormalizedSiteService = new DenormalizedSiteService();
