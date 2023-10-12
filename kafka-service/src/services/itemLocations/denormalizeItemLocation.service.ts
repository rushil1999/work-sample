import { logger } from '@procurenetworks/backend-utils';
import { ItemLocationEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { MongoOperationTypeEnum } from '@procurenetworks/kafka-utils';
import { keyBy, uniq } from 'lodash';
import { ItemLocationService, LocationService } from '../../__transport/__grpc/client/services';
import { buildEventsByOperationMap } from '../entityExpander/utils/events.utils';
import { buildExpandedFieldsForInsertEvents } from './utils';

export class DenormalizeItemLocationServiceClass {
  async syncItemLocationEvents(events: any[], userContext: UserContext): Promise<void> {
    try {
      const evetsByOperationMap = buildEventsByOperationMap(events);
      for (const [operation, operationSpecificEvents] of evetsByOperationMap) {
        switch (operation) {
          case MongoOperationTypeEnum.INSERT: {
            const itemLocationsFromEvents: Array<ItemLocationEntity.ItemLocationSchema> = operationSpecificEvents.map(
              (event) => {
                const { fullDocument } = event;
                return {
                  ...fullDocument,
                  _id: fullDocument._id.$oid,
                  siteId: fullDocument.siteId.$oid,
                  locationId: fullDocument.locationId.$oid,
                } as ItemLocationEntity.ItemLocationSchema;
              },
            );
            const bulkUpdateItemLocations = await this.getBulkItemLocationsInputsForInsertedItemLocationEvents(
              itemLocationsFromEvents,
              userContext,
            );
            if (bulkUpdateItemLocations && bulkUpdateItemLocations.updateExpandedSortFieldsInItemLocationInputs.length > 0) {
              await ItemLocationService.bulkUpdateExpandedSortFields(bulkUpdateItemLocations, userContext);
            }
            break;
          }
        }
      }
    } catch (error) {
      logger.error({ message: `Error occured in ${__filename} - ${this.syncItemLocationEvents.name}` });
    }
  }
  async getBulkItemLocationsInputsForInsertedItemLocationEvents(
    itemLocations: Array<ItemLocationEntity.ItemLocationSchema>,
    userContext: UserContext,
  ): Promise<ItemLocationEntity.BulkUpdateExpandedSortFieldsInItemLocationInput> {
    try {
      const updateExpandedSortFieldsInItemLocationInputs: Array<ItemLocationEntity.UpdateExpandedSortFieldsInItemLocationInput> =
        [];
      const locationIds = uniq([
        ...uniq(itemLocations.map((itemLocation: ItemLocationEntity.ItemLocationSchema) => itemLocation.siteId)),
        ...uniq(itemLocations.map((itemLocation: ItemLocationEntity.ItemLocationSchema) => itemLocation.locationId)),
      ]);
      const { locations } = await LocationService.getAllLocations({ filters: { locationIds } }, userContext);
      const locationByKeyMap = keyBy(locations, (location) => location._id.toString());
      itemLocations.forEach((itemLocation: ItemLocationEntity.ItemLocationSchema) => {
        const { locationId, siteId, _id } = itemLocation;

        // eslint-disable-next-line prefer-destructuring
        const siteForItemLocation = locationByKeyMap[siteId.toString()];
        // eslint-disable-next-line prefer-destructuring
        const locationForItemLocation = locationByKeyMap[locationId.toString()];
        if (siteForItemLocation) {
          const expandedSortFields = buildExpandedFieldsForInsertEvents(
            itemLocation,
            siteForItemLocation,
            locationForItemLocation,
          );
          updateExpandedSortFieldsInItemLocationInputs.push({ itemLocationId: _id, expandedSortFields });
        }
      });
      return { updateExpandedSortFieldsInItemLocationInputs };
    } catch (error: unknown) {
      logger.error({
        message: `Error occuerd in ${this.getBulkItemLocationsInputsForInsertedItemLocationEvents.name} with user context ${userContext}`,
      });
      throw error;
    }
  }
}

export const denormalizeItemLocation = new DenormalizeItemLocationServiceClass();
