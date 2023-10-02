import { ForbiddenError, logger } from '@procurenetworks/backend-utils';
import { ItemEntity, ItemLocationEntity, StringObjectID, UserContext } from '@procurenetworks/inter-service-contracts';
import { DocumentType } from '@typegoose/typegoose';
import { escapeRegExp } from 'lodash';
import mongoose, { FilterQuery } from 'mongoose';
import NodeCache from 'node-cache';
import { CompanyService } from '../../../services/company/company.service';
import { ItemLocationService } from '../../../services/itemLocation/itemLocation.service';
import { CategoryService, PartnerTenantService } from '../../../transport/__grpc/client/services';
import { ManufacturerService } from '../../../transport/__grpc/client/services/organization/manufacturer.service';
import { contextUserUtil } from '../../../utils/contextUser.util';

const CACHE = new NodeCache({ checkperiod: 90, stdTTL: 240 });

export async function attachItemIdsForSiteIdsFilter(
  query: FilterQuery<DocumentType<ItemEntity.ItemSchema>>,
  siteIds: StringObjectID[],
  userContext: UserContext,
  itemTypes = Object.values(ItemLocationEntity.ItemLocationItemTypeEnum),
) {
  if (siteIds.length === 0) {
    return;
  }
  if (!query.$and) {
    // eslint-disable-next-line no-param-reassign
    query.$and = [];
  }
  const { stringObjectIDFieldValues = [] } = await ItemLocationService.getDistinctValuesForAllItemLocation(
    {
      field: 'itemId',
      filters: {
        siteIds,
        itemTypes,
        _or: [{ nonZeroTotalQuantity: true }, { recentOnly: true }, { nonZeroTotalQuantityFromLocations: true }],
      },
    },
    userContext,
  );
  const itemIdsInStock = stringObjectIDFieldValues as StringObjectID[];
  if (itemIdsInStock.length > 0) {
    query.$and.push({
      _id: { $in: itemIdsInStock },
    });
  } else if (itemIdsInStock.length === 0) {
    query.$and.push({ _id: { $exists: false } });
  }
}

export async function searchExternalEntities(search: string, userContext: UserContext) {
  const promises = [
    CategoryService.getDistinctValuesForAllCategory({ filters: { searchInternal: search }, field: '_id' }, userContext),
    CompanyService.getDistinctValuesForAllCompany({ filters: { searchInternal: search }, field: '_id' }, userContext),
    ManufacturerService.getDistinctValuesForAllManufacturer(
      { filters: { searchInternal: search }, field: '_id' },
      userContext,
    ),
  ];
  const [
    { stringObjectIDFieldValues: stringifiedCategoryIds },
    { stringObjectIDFieldValues: stringifiedVendorIds },
    { stringObjectIDFieldValues: stringifiedManufacturerIds },
  ] = await Promise.all(promises);
  const categoryIds: StringObjectID[] = stringifiedCategoryIds?.map((value) => new mongoose.Types.ObjectId(value)) || [];
  const vendorIds: StringObjectID[] = stringifiedVendorIds?.map((value) => new mongoose.Types.ObjectId(value)) || [];
  const manufacturerIds: StringObjectID[] =
    stringifiedManufacturerIds?.map((value) => new mongoose.Types.ObjectId(value)) || [];
  return { categoryIds, vendorIds, manufacturerIds };
}

export async function getAccessibleCategoryIdsOfPartnerTenant(
  tenantId: StringObjectID,
  userContext: UserContext,
): Promise<StringObjectID[]> {
  const { currentUserInfo } = userContext;
  if (CACHE.has(`${currentUserInfo._id.toString()}${tenantId.toString()}`)) {
    return CACHE.get(`${currentUserInfo._id.toString()}${tenantId.toString()}`) as StringObjectID[];
  }
  const {
    partnerTenants: [partnerTenant],
  } = await PartnerTenantService.getAllPartnerTenants(
    {
      filters: {
        allowedUserIds: contextUserUtil.isSuperAdmin(userContext) ? [] : [currentUserInfo._id],
        parentTenantIds: [tenantId],
      },
    },
    userContext,
  );
  if (!partnerTenant) {
    throw new ForbiddenError({
      message: 'You do not have access to order items of the selected organization. Please check and try again.',
      where: `${__filename} - ${getAccessibleCategoryIdsOfPartnerTenant.name}`,
      params: { tenantId },
    });
  }
  CACHE.set(`${currentUserInfo._id.toString()}${tenantId.toString()}`, partnerTenant.accessibleCategoryIds);
  return partnerTenant.accessibleCategoryIds.length > 0
    ? partnerTenant.accessibleCategoryIds
    : [new mongoose.Types.ObjectId()];
}

export async function attachItemSearchQuery(
  itemsFilters: ItemEntity.ItemFilters,
  query: FilterQuery<ItemEntity.ItemSchema>,
  search: string,
  userContext: UserContext,
  internal = false,
) {
  if (!search) {
    return query;
  }
  if (!query.$and) {
    // eslint-disable-next-line no-param-reassign
    query.$and = [];
  }

  const searchWord = search.trim();

  let tenantIdsFilter: StringObjectID[] = [new mongoose.Types.ObjectId(userContext.tenantId)];
  if (itemsFilters.tenantIds && itemsFilters.tenantIds.length > 0) {
    tenantIdsFilter = itemsFilters.tenantIds.map((tenantId) => new mongoose.Types.ObjectId(tenantId));
  }
  if (itemsFilters.partnerTenantId) {
    tenantIdsFilter = [itemsFilters.partnerTenantId];
  }

  const orConditionsForSearch: Array<FilterQuery<ItemEntity.ItemSchema>> = [];

  orConditionsForSearch.push(
    ...[
      {
        $text: { $search: searchWord },
        tenantId: { $in: tenantIdsFilter },
      },
      { sku: { $regex: new RegExp(`.*${escapeRegExp(searchWord)}`, 'i') } },
      { description: { $regex: new RegExp(`.*${escapeRegExp(searchWord)}.*`, 'i') } },
      { title: { $regex: new RegExp(`.*${escapeRegExp(searchWord)}.*`, 'i') } },
    ],
  );

  if (!internal) {
    let { categoryIds, vendorIds, manufacturerIds } = await searchExternalEntities(searchWord, userContext);
    if (categoryIds.length > 0) {
      categoryIds = categoryIds.map((categoryId) => new mongoose.Types.ObjectId(categoryId));
      orConditionsForSearch.push({ categoryId: { $in: categoryIds } });
    }
    if (vendorIds.length > 0) {
      vendorIds = vendorIds.map((companyId) => new mongoose.Types.ObjectId(companyId));
      orConditionsForSearch.push({ vendorId: { $in: vendorIds } });
    }
    if (manufacturerIds.length > 0) {
      manufacturerIds = manufacturerIds.map((manufacturerId) => new mongoose.Types.ObjectId(manufacturerId));
      orConditionsForSearch.push({ manufacturerId: { $in: manufacturerIds } });
    }
  }

  if (orConditionsForSearch.length > 0) {
    query.$and.push({ $and: [{ $or: orConditionsForSearch }] });
  } else {
    query.$and.push({ $and: [{ __v: -1 }] });
  }

  return query;
}

export async function buildGetItemsFilterQuery(
  itemsFilters: ItemEntity.ItemFilters,
  userContext: UserContext,
): Promise<FilterQuery<DocumentType<ItemEntity.ItemSchema>>> {
  const query: FilterQuery<DocumentType<ItemEntity.ItemSchema>> = {};
  for (const key of Object.keys(itemsFilters) as Array<keyof ItemEntity.ItemFilters>) {
    if (itemsFilters[key] && Array.isArray(itemsFilters[key])) {
      if ((itemsFilters[key] as any[]).length === 0) {
        continue;
      }
    }
    switch (key) {
      case '_and': {
        if (itemsFilters._and && Array.isArray(itemsFilters._and)) {
          query.$and = query.$and || [];
          for (const andCondition of itemsFilters._and) {
            const nestedQuery = await buildGetItemsFilterQuery(andCondition, userContext);
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
        if (itemsFilters._or && Array.isArray(itemsFilters._or)) {
          query.$or = query.$or || [];
          for (const orCondition of itemsFilters._or) {
            const nestedQuery = await buildGetItemsFilterQuery(orCondition, userContext);
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
      case '_exists': {
        if (itemsFilters._exists) {
          query.$and = query.$and || [];
          for (const existsKey in itemsFilters._exists) {
            query.$and.push({
              [existsKey]: {
                $exists: itemsFilters._exists[existsKey as keyof ItemEntity.ItemSchema],
              },
            });
          }
        }
        break;
      }
      case 'partnerTenantId': {
        const { partnerTenantId } = itemsFilters;
        if (partnerTenantId) {
          query.$and = query.$and || [];

          const accessibleCategoryIds = await getAccessibleCategoryIdsOfPartnerTenant(partnerTenantId, userContext);
          query.$and.push({
            categoryId: { $in: accessibleCategoryIds.map((categoryId) => new mongoose.Types.ObjectId(categoryId)) },
          });
          query['tenantId'] = partnerTenantId;
        }
        break;
      }
      case 'types': {
        const { types } = itemsFilters;
        query.type = { $in: types };
        break;
      }
      case 'itemIds': {
        const { itemIds: itemIds } = itemsFilters;
        if (itemIds && itemIds.length > 0) {
          query['_id'] = { $in: itemIds.map((itemId) => new mongoose.Types.ObjectId(itemId)) };
        }
        break;
      }
      case 'categoryIds': {
        const { categoryIds } = itemsFilters;
        if (categoryIds && categoryIds.length > 0) {
          query['categoryId'] = { $in: categoryIds.map((categoryId) => new mongoose.Types.ObjectId(categoryId)) };
        }
        break;
      }
      case 'vendorIds': {
        const { vendorIds } = itemsFilters;
        if (vendorIds && vendorIds.length > 0) {
          query['vendorId'] = { $in: vendorIds.map((vendorId) => new mongoose.Types.ObjectId(vendorId)) };
        }
        break;
      }
      case 'siteIds': {
        const { siteIds } = itemsFilters;
        if (siteIds && siteIds.length > 0) {
          await attachItemIdsForSiteIdsFilter(query, siteIds, userContext);
        }
        break;
      }
      case 'tenantIds': {
        const { tenantIds } = itemsFilters;
        if (tenantIds && tenantIds.length > 0) {
          query['tenantId'] = {
            $in: tenantIds.map((tenantId) => new mongoose.Types.ObjectId(tenantId)),
          };
        }
        break;
      }
      case 'entityIdsInSourceTenant': {
        const { entityIdsInSourceTenant } = itemsFilters;
        if (entityIdsInSourceTenant && entityIdsInSourceTenant.length > 0) {
          query['entityIdInSourceTenant'] = {
            $in: entityIdsInSourceTenant.map(
              (entityIdInSourceTenant) => new mongoose.Types.ObjectId(entityIdInSourceTenant),
            ),
          };
        }
        break;
      }
      case 'entitySources': {
        const { entitySources } = itemsFilters;
        if (entitySources && entitySources.length > 0) {
          query['entitySource'] = { $in: entitySources };
        }
        break;
      }
      case 'skus': {
        const { skus } = itemsFilters;
        if (skus && skus.length > 0) {
          query['sku'] = { $in: skus };
        }
        break;
      }
      case 'productCodes': {
        const { productCodes } = itemsFilters;
        if (productCodes && productCodes.length > 0) {
          query['externalProductCodes.code'] = { $in: productCodes };
        }
        break;
      }
      case 'statuses': {
        const { statuses } = itemsFilters;
        if (statuses && statuses.length > 0) {
          query['status'] = { $in: statuses };
        }
        break;
      }
      case 'pickableThroughOrderRequest': {
        const { pickableThroughOrderRequest } = itemsFilters;
        query['pickableThroughOrderRequest'] = pickableThroughOrderRequest;
        break;
      }
      case 'search': {
        const search = itemsFilters[key] as string;
        await attachItemSearchQuery(itemsFilters, query, search, userContext, true);
        break;
      }
      case 'searchInternal': {
        const search = itemsFilters[key] as string;
        await attachItemSearchQuery(itemsFilters, query, search, userContext, true);
        break;
      }
      case 'manufacturerIds': {
        const { manufacturerIds } = itemsFilters;
        if (manufacturerIds && manufacturerIds.length > 0) {
          query['manufacturerId'] = {
            $in: manufacturerIds.map((manufacturerId) => new mongoose.Types.ObjectId(manufacturerId)),
          };
        }
        break;
      }
      case 'titles': {
        const { titles } = itemsFilters;
        if (Array.isArray(titles) && titles.length > 0) {
          query['title'] = { $in: titles };
        }
        break;
      }
      case 'nonChildItemsOnly': {
        const { nonChildItemsOnly } = itemsFilters;
        if (nonChildItemsOnly === true) {
          query.$and = query.$and || [];
          query.$and.push({
            $or: [{ parentId: { $exists: false } }],
          });
        }
        break;
      }
      case 'modelNumbers': {
        const { modelNumbers } = itemsFilters;
        if (Array.isArray(modelNumbers) && modelNumbers.length > 0) {
          query['modelNumber'] = { $in: modelNumbers };
        }
        break;
      }
      case 'mNames': {
        const { mNames } = itemsFilters;
        if (Array.isArray(mNames) && mNames.length > 0) {
          query['mName'] = { $in: mNames };
        }
        break;
      }
      case 'brands': {
        const { brands } = itemsFilters;
        if (Array.isArray(brands) && brands.length > 0) {
          query['brand'] = { $in: brands };
        }
        break;
      }
      case 'parentIds': {
        const { parentIds } = itemsFilters;
        if (Array.isArray(parentIds) && parentIds.length > 0) {
          query['parentId'] = { $in: parentIds.map((parentId) => new mongoose.Types.ObjectId(parentId)) };
        }
        break;
      }
      default:
        continue;
    }
  }
  logger.debug({ message: 'Query for fetching items', payload: { query } });
  return query;
}
