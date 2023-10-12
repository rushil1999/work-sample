import { ItemLocationEntity, LocationEntity } from '@procurenetworks/inter-service-contracts';

export const buildExpandedFieldsForInsertEvents = (
  itemLocation: ItemLocationEntity.ItemLocationSchema,
  site: LocationEntity.LocationSchema,
  location: LocationEntity.LocationSchema,
): ItemLocationEntity.ItemLocationExpandedSortFieldsSchema => {
  // Functino can be expanded to add more fields from differnt documents.
  const { name: siteName } = site;
  const { name: locationName, type: locationType } = location;
  const expandedSortFields: ItemLocationEntity.ItemLocationExpandedSortFieldsSchema = itemLocation.expandedSortFields || {};
  if (locationType === LocationEntity.LocationTypeEnum.SITE) {
    expandedSortFields['siteName'] = siteName;
    expandedSortFields['locationName'] = 'Unassigned';
  } else {
    expandedSortFields['siteName'] = siteName;
    expandedSortFields['locationName'] = locationName;
  }
  return expandedSortFields;
};
