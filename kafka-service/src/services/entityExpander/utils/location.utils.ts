import { LocationEntity } from '@procurenetworks/inter-service-contracts';
export const segregateEventBasedOnLocationType = (events: any[]): { locationBasedEvents: any[]; siteBasedEvents: any[] } => {
  const locationBasedEvents: any[] = [];
  const siteBasedEvents: any[] = [];

  events.forEach((event) => {
    const { fullDocument } = event;
    const { type } = fullDocument;
    if (type === LocationEntity.LocationTypeEnum.SITE) {
      siteBasedEvents.push(event);
    } else {
      locationBasedEvents.push(event);
    }
  });
  return { locationBasedEvents, siteBasedEvents };
};
