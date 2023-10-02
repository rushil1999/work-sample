import { logger } from '@procurenetworks/backend-utils';
import { GeoCodeEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { DocumentType } from '@typegoose/typegoose';
import { FilterQuery } from 'mongoose';

export async function buildGetGeoCodeFilterQuery(
  geoCodeFilters: GeoCodeEntity.GeoCodeFilters,
  userContext: UserContext,
): Promise<FilterQuery<DocumentType<GeoCodeEntity.GeoCodeSchema>>> {
  const query: FilterQuery<DocumentType<GeoCodeEntity.GeoCodeSchema>> = {};
  for (const key of Object.keys(geoCodeFilters) as Array<keyof GeoCodeEntity.GeoCodeFilters>) {
    if (geoCodeFilters[key] && Array.isArray(geoCodeFilters[key])) {
      if ((geoCodeFilters[key] as any[]).length === 0) {
        continue;
      }
    }
    switch (key) {
      case '_and': {
        if (geoCodeFilters._and && Array.isArray(geoCodeFilters._and)) {
          query.$and = query.$and || [];
          for (const andCondition of geoCodeFilters._and) {
            const nestedQuery = await buildGetGeoCodeFilterQuery(andCondition, userContext);
            if (Object.keys(nestedQuery).length !== 0) {
              query.$and.push(nestedQuery);
            }
          }
          if (query.$and && Array.isArray(query.$and) && query.$and.length === 0) {
            delete query.$and;
          }
        }
        break;
      }
      case '_or': {
        if (geoCodeFilters._or && Array.isArray(geoCodeFilters._or)) {
          query.$or = query.$or || [];
          for (const orCondition of geoCodeFilters._or) {
            const nestedQuery = await buildGetGeoCodeFilterQuery(orCondition, userContext);
            if (Object.keys(nestedQuery).length !== 0) {
              query.$or.push(nestedQuery);
            }
          }
          if (query.$or && Array.isArray(query.$or) && query.$or.length === 0) {
            delete query.$or;
          }
        }
        break;
      }

      case 'zipcode': {
        const { zipcode } = geoCodeFilters;

        query['zipcode'] = zipcode;
        break;
      }
      default:
        continue;
    }
  }
  logger.debug({ message: 'Query for fetching zip code based information', payload: { query } });
  return query;
}
