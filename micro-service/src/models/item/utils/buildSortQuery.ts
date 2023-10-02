import { logger, ValidationError } from '@procurenetworks/backend-utils';
import { Entity, ItemEntity } from '@procurenetworks/inter-service-contracts';
import { FilterQuery } from 'mongoose';

export function buildItemsSortQuery(
  { sortField, sortOrder }: Entity.PaginationProps,
  filterQuery: FilterQuery<ItemEntity.ItemSchema>,
): {
  [key: string]: -1 | 1;
} {
  let sortQuery: { [key: string]: -1 | 1 } = {};
  if (!sortField) {
    if (JSON.stringify(filterQuery).indexOf('$text') !== -1) {
      // eslint-disable-next-line no-param-reassign
      sortField = 'score';
    } else {
      // eslint-disable-next-line no-param-reassign
      sortField = '_id';
    }
  }

  switch (sortField) {
    case '_id': {
      sortQuery = { _id: Entity.SortOrderEnum.DESC === sortOrder ? -1 : 1 };
      break;
    }
    case 'score': {
      sortQuery = { score: -1 };
      break;
    }
    case 'title': {
      sortQuery = { title: Entity.SortOrderEnum.DESC === sortOrder ? -1 : 1 };
      break;
    }
    case 'createdAt': {
      sortQuery = { createdAt: Entity.SortOrderEnum.DESC === sortOrder ? -1 : 1 };
      break;
    }
    case 'description': {
      sortQuery = { description: Entity.SortOrderEnum.DESC === sortOrder ? -1 : 1 };
      break;
    }
    case 'mName': {
      sortQuery = { mName: Entity.SortOrderEnum.DESC === sortOrder ? -1 : 1 };
      break;
    }
    case 'updatedAt': {
      sortQuery = { updatedAt: Entity.SortOrderEnum.DESC === sortOrder ? -1 : 1 };
      break;
    }
    default:
      throw new ValidationError({
        debugMessage: 'Error attaching sort query to items database request.',
        message: 'There was a problem with sorting on the column you selected. Please retry.',
        params: { sortField, sortOrder },
        where: 'buildItemsSortQuery',
      });
  }
  logger.debug({ message: 'Query for sorting items', payload: { sortQuery } });
  return sortQuery;
}
