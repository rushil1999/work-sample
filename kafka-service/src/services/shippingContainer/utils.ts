import { LocationEntity, ShippingContainerEntity } from '@procurenetworks/inter-service-contracts';

export const buildExpandedFieldsForInsertEvents = (
  shippingContainer: ShippingContainerEntity.ShippingContainerSchema,
  site: LocationEntity.LocationSchema,
): ShippingContainerEntity.ShippingContainerExpandedSortFieldsSchema => {
  // Functino can be expanded to add more fields from differnt documents.
  const { name: siteName } = site;
  const expandedSortFields = shippingContainer.expandedSortFields || {};
  expandedSortFields['destinationSiteName'] = siteName;
  return expandedSortFields;
};
