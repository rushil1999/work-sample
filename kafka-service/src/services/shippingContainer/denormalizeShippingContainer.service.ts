import { logger } from '@procurenetworks/backend-utils';
import { ShippingContainerEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { MongoOperationTypeEnum } from '@procurenetworks/kafka-utils';
import { keyBy, uniq } from 'lodash';
import { LocationService } from '../../__transport/__grpc/client/services/organization';
import { ShippingContainerService } from '../../__transport/__grpc/client/services/shipping';
import { buildEventsByOperationMap } from '../entityExpander/utils/events.utils';
import { buildExpandedFieldsForInsertEvents } from './utils';

export class DenormalizeShippingContainerClass {
  async syncShippingContainerEvents(events: any[], userContext: UserContext): Promise<void> {
    try {
      const evetsByOperationMap = buildEventsByOperationMap(events);
      for (const [operation, operationSpecificEvents] of evetsByOperationMap) {
        switch (operation) {
          case MongoOperationTypeEnum.INSERT: {
            const shippingContainersFromEvents: Array<ShippingContainerEntity.ShippingContainerSchema> =
              operationSpecificEvents.map((event) => {
                const { fullDocument } = event;
                return {
                  ...fullDocument,
                  _id: fullDocument._id.$oid,
                  destinationSiteId: fullDocument.destinationSiteId.$oid,
                } as ShippingContainerEntity.ShippingContainerSchema;
              });
            const bulkUpdateShippingContainerInputs =
              await this.getBulkShippingContainerInputsForInsertedShippinContainerEvents(
                shippingContainersFromEvents,
                userContext,
              );
            if (
              bulkUpdateShippingContainerInputs &&
              bulkUpdateShippingContainerInputs.updateExpandedSortFieldsInShippingContainerInputs.length > 0
            ) {
              await ShippingContainerService.bulkUpdateExpandedSortFields(bulkUpdateShippingContainerInputs, userContext);
            }
            break;
          }
          default: {
            break;
          }
        }
      }
    } catch (error: any) {
      logger.error({ message: `Error occured in ${__filename} - ${this.syncShippingContainerEvents.name}` });
    }
  }
  async getBulkShippingContainerInputsForInsertedShippinContainerEvents(
    shippingContainers: Array<ShippingContainerEntity.ShippingContainerSchema>,
    userContext: UserContext,
  ): Promise<ShippingContainerEntity.BulkUpdateExpandedSortFieldsInItemLocationInput> {
    try {
      const updateExpandedSortFieldsInShippingContainerInputs: Array<ShippingContainerEntity.UpdateExpandedSortFieldsInShippingContainerInput> =
        [];
      const locationIds = uniq(
        shippingContainers.map(
          (shippingContainer: ShippingContainerEntity.ShippingContainerSchema) => shippingContainer.destinationSiteId,
        ),
      );
      const { locations } = await LocationService.getAllLocations({ filters: { locationIds } }, userContext);
      const locationByKeyMap = keyBy(locations, (location) => location._id.toString());
      shippingContainers.forEach((shippingContainer: ShippingContainerEntity.ShippingContainerSchema) => {
        const { destinationSiteId, _id } = shippingContainer;

        // eslint-disable-next-line prefer-destructuring
        const siteForShippingContainer = locationByKeyMap[destinationSiteId.toString()];
        if (siteForShippingContainer) {
          const expandedSortFields = buildExpandedFieldsForInsertEvents(shippingContainer, siteForShippingContainer);
          updateExpandedSortFieldsInShippingContainerInputs.push({ shippingContainerId: _id, expandedSortFields });
        }
      });
      return { updateExpandedSortFieldsInShippingContainerInputs };
    } catch (error: unknown) {
      logger.error({
        message: `Error occuerd in ${this.getBulkShippingContainerInputsForInsertedShippinContainerEvents.name} with user context ${userContext}`,
      });
      throw error;
    }
  }
}

export const denormalizeShippingContainer = new DenormalizeShippingContainerClass();
