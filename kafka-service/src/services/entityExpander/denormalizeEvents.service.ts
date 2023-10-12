import { BugReporterService, logger } from '@procurenetworks/backend-utils';
import { HeartbeatConfig, KafkaConsumer, OffsetResults } from '@procurenetworks/kafka-utils';
import { EachBatchPayload } from 'kafkajs';
import { appConfigs } from '../../appConfigs';
import { DocumentNameEnum } from '../../enums/document.enum';
import { contextUserUtil } from '../../utils/contextUser.utilts';
import { denormalizeItemLocation } from '../itemLocations/denormalizeItemLocation.service';
import { denormalisedLocationService } from '../location/denormalizedLocation.service';
import { denormalizeShippingContainer } from '../shippingContainer/denormalizeShippingContainer.service';
import { denormalizedSiteService } from '../site/denormalizedSite.service';
import { buildEventsByDocumentNameMap, buildEventsByOperationMap } from './utils/events.utils';
import { segregateEventBasedOnLocationType } from './utils/location.utils';

export class DenormalizeEventsHandler extends KafkaConsumer {
  /** An assumption that no Kafka consumer should be taking more than 25
   *  seconds to consume a single batch.
   */
  static LOCATION_EVENTS_TOPIC = appConfigs.KafkaConsumerConfigs.locationEventsTopic;

  private resolveHeartbeatThread = false;
  deInit(): void {
    if (!this.consumptionInProgress) {
      this.stopConsumption();
    }
    this.continueConsumption = false;
    logger.info({ message: 'Marked consumer to stop processing after the current batch. ' });
  }

  protected heartbeatConfig: HeartbeatConfig = {
    heartbeatThreadInterval: appConfigs.KafkaConsumerConfigs.consumerGroupHeartbeatInterval,
    batchProcessingHeartbeatsThreshold: appConfigs.KafkaConsumerConfigs.consumerGroupBatchHeartbeatsAlertThreshold,
  };

  /* Heartbeat functions */
  protected startHeartbeatThread(heartbeat: any, messageOffsets: string[]): void {
    this.resolveHeartbeatThread = false;
    let heartbeatsSent = 0;

    const sendHeartbeatIntervalId: any = setInterval(async () => {
      if (this.resolveHeartbeatThread) {
        if (heartbeatsSent >= this.heartbeatConfig.batchProcessingHeartbeatsThreshold) {
          logger.info({
            message: `${heartbeatsSent} heartbeats sent for resolving messageOffsets from ${messageOffsets[0]} to ${messageOffsets[messageOffsets.length - 1]
              }`,
            where: 'consumer.startHeartbeatThread',
          });
        }
        return clearInterval(sendHeartbeatIntervalId);
      }

      // notifying for long processing event/batch
      if (heartbeatsSent === this.heartbeatConfig.batchProcessingHeartbeatsThreshold) {
        logger.warn({
          message: `denormalisedPerformanceSync.eventHandler current batch is taking too long to process firstOffset:${messageOffsets[0]
            } lastOffset:${messageOffsets[messageOffsets.length - 1]}`,
        });
      }

      await heartbeat();
      heartbeatsSent++;

      return;
    }, this.heartbeatConfig.heartbeatThreadInterval);
  }

  private stopHeartbeatThread(): void {
    this.resolveHeartbeatThread = true;
    return;
  }

  private handleMessageBatch = async (batchId: string, input: EachBatchPayload): Promise<OffsetResults> => {
    const { batch, heartbeat, resolveOffset } = input;
    const { topic, messages, partition } = batch;
    logger.debug({
      message: `denormalisedPerformanceSyncEventHandler.handleMessageBatch: topic: ${topic} message size: ${messages.length}`,
    });
    try {
      const { offsets } = await this.handleChangestreamEvents(messages, heartbeat);
      for (const offset of offsets) {
        resolveOffset(offset);
      }
      return { consumedOffsets: offsets, erredOffsets: [] };
    } catch (error) {
      if (error instanceof Error) {
        logger.error({
          message: `Error in consuming the message first offset: ${batch.firstOffset()} last offset: ${batch.lastOffset()}. Error - ${error.message
            }`,
          payload: {
            input,
            where: `denormalisedPerformanceSyncEventHandler.handleMessageBatch ${error.stack}`,
            error: JSON.stringify(error),
          },
        });
      } else {
        logger.error({
          message: `Error in consuming the message  first offset: ${batch.firstOffset()} last offset: ${batch.lastOffset()}. Error -`,
          payload: {
            input,
            where: `denormalisedPerformanceSyncEventHandler.handleMessageBatch`,
            error: JSON.stringify(error),
          },
        });
      }

      // types not found
      // await BugReporterService.reportServerException(error, , {
      //   serviceName: appConfigs.node.service,
      //   currentUserInfo: request.userContext?.currentUserInfo,
      //   requestId: request.userContext?.requestId,
      //   tenantId: request.userContext?.tenantId,
      // });
      throw error;
    }
  };

  private handleChangestreamEvents = async (
    messages: any[],
    heartbeat: () => Promise<void>,
  ): Promise<{ offsets: Array<string> }> => {
    const events: any[] = []; // TODO: Change to kafka event
    const messageOffsets: Array<string> = [];

    for (const message of messages) {
      const { offset, value } = message;
      if (value) {
        const event = JSON.parse(value.toString());
        events.push(event);
      } else {
        logger.info({ message: `Kafka event not found for offset: ${offset}` });
      }

      messageOffsets.push(offset);
    }
    this.startHeartbeatThread(heartbeat, messageOffsets);
    const userContext = contextUserUtil.createUserContext();
    try {
      const eventsByDocumentName = buildEventsByDocumentNameMap(events);
      for (const [documetName, documentEvents] of eventsByDocumentName) {
        logger.info({ message: `received ${documentEvents.length} events for ${documetName} document` });
        const eventsByOperationMap = buildEventsByOperationMap(events);
        for (const [operation, operationSpecificEvents] of eventsByOperationMap) {
          logger.info({
            message: `received ${operationSpecificEvents.length} events for ${operation} operation`,
          });
        }
        switch (documetName) {
          case DocumentNameEnum.LOCATIONS: {
            const { locationBasedEvents, siteBasedEvents } = segregateEventBasedOnLocationType(documentEvents);
            await denormalisedLocationService.syncLocationEvents(locationBasedEvents, userContext);
            await denormalizedSiteService.syncSiteEvents(siteBasedEvents, userContext);
            break;
          }
          case DocumentNameEnum.SHIPPING_CONTAINERS: {
            await denormalizeShippingContainer.syncShippingContainerEvents(events, userContext);
            break;
          }
          case DocumentNameEnum.ITEM_LOCATIONS: {
            await denormalizeItemLocation.syncItemLocationEvents(documentEvents, userContext);
            break;
          }
        }
      }
    } catch (error) {
      this.stopHeartbeatThread();
      throw error;
    }
    this.stopHeartbeatThread();

    return { offsets: messageOffsets };
  };

  public async init(): Promise<void> {
    await this.subscribe({
      topics: appConfigs.KafkaConsumerConfigs.topicNames.map((topic) => ({ topic })),
    });
    await this.consume({
      eachBatch: this.handleMessageBatch,
    });
  }
}
