import { MongooseBaseRepository } from '@procurenetworks/backend-utils';
import {
  convertSortPropsToMongoQuery,
  ItemEntity,
  PaginationUtil,
  setMongoProjectionForMetadataFilters,
  UserContext,
} from '@procurenetworks/inter-service-contracts';
import { DocumentType } from '@typegoose/typegoose';
import mongoose, { ClientSession, FilterQuery } from 'mongoose';
import { buildGetItemsFilterQuery } from './utils/buildFilterQuery';
import { buildItemsSortQuery } from './utils/buildSortQuery';

class ItemRepositoryClass extends MongooseBaseRepository<typeof ItemEntity.ItemSchema> {
  constructor() {
    super({
      entityClass: ItemEntity.ItemSchema,
      mongooseConnection: mongoose.connection,
      schemaOptions: { collection: 'items', strictQuery: false },
    });
  }

  private _getBaseFilterQuery(userContext: UserContext): FilterQuery<DocumentType<ItemEntity.ItemSchema>> {
    return {
      status: { $ne: ItemEntity.ItemStatusEnum.DELETED },
      tenantId: userContext.tenantId,
    };
  }

  /* Queries */
  async getItemsByIdsAcrossTenants(
    { filters, projection }: ItemEntity.GetItemsByIdsAcrossTenantsInput,
    userContext: UserContext,
  ): Promise<Array<ItemEntity.ItemSchema>> {
    const filterQuery = await buildGetItemsFilterQuery(filters, userContext);
    const items = await this.mongooseModel
      .find(filterQuery)
      .select(setMongoProjectionForMetadataFilters(filterQuery, projection))
      .lean();
    return items;
  }

  async getAllItems(
    { filters, projection, sorts }: ItemEntity.GetAllItemsInput,
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<Array<ItemEntity.ItemSchema>> {
    const baseFilterQuery = this._getBaseFilterQuery(userContext);
    const filterQuery = await buildGetItemsFilterQuery(filters, userContext);
    const items = await this.mongooseModel
      .find({ ...baseFilterQuery, ...filterQuery })
      .select(setMongoProjectionForMetadataFilters(filterQuery, projection))
      .sort(convertSortPropsToMongoQuery(sorts))
      .lean()
      .setOptions({ session });
    return items;
  }

  async getPaginatedItems(
    { disableBaseFilter = false, filters, paginationProps, projection }: ItemEntity.GetPaginatedItemsInput,
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<ItemEntity.PaginatedItemsPayload> {
    let baseFilterQuery = this._getBaseFilterQuery(userContext);
    if (disableBaseFilter) {
      baseFilterQuery = {
        tenantId: userContext.tenantId,
      };
    }
    const filterQuery = await buildGetItemsFilterQuery(filters, userContext);
    const itemPaginationUtil = new PaginationUtil<ItemEntity.ItemSchema>(
      { ...baseFilterQuery, ...filterQuery },
      paginationProps,
    );
    const paginatedFilterQuery = itemPaginationUtil.getPaginationFilterQuery();
    const paginatedSortQuery = itemPaginationUtil.getSortQuery();
    const { limit } = paginationProps;
    const [items, itemsCount] = await Promise.all([
      this.mongooseModel
        .find(paginatedFilterQuery)
        .sort(paginatedSortQuery)
        .select(setMongoProjectionForMetadataFilters(filterQuery, projection))
        .limit(limit + 1)
        .lean()
        .setOptions({ session }),
      this.mongooseModel.countDocuments({ ...baseFilterQuery, ...filterQuery }, { session }),
    ]);
    return itemPaginationUtil.getPaginatedResponse(items, itemsCount);
  }

  async getPaginatedItemsDeprecated(
    { disableBaseFilter = false, filters, paginationProps, projection }: ItemEntity.GetPaginatedItemsInput,
    userContext: UserContext,
  ): Promise<Array<ItemEntity.ItemSchema>> {
    let baseFilterQuery = this._getBaseFilterQuery(userContext);
    if (disableBaseFilter) {
      baseFilterQuery = {
        tenantId: userContext.tenantId,
      };
    }
    const filterQuery = await buildGetItemsFilterQuery(filters, userContext);
    const { limit = 10, skip = 0 } = paginationProps;
    const sortQuery = buildItemsSortQuery(paginationProps, filterQuery);
    const items = await this.mongooseModel
      .find({ ...baseFilterQuery, ...filterQuery })
      .sort(sortQuery)
      .select(setMongoProjectionForMetadataFilters(filterQuery, projection))
      .limit(limit)
      .skip(skip)
      .lean();
    return items;
  }

  async getItemsCount({ filters }: ItemEntity.GetAllItemsInput, userContext: UserContext): Promise<number> {
    const baseFilterQuery = this._getBaseFilterQuery(userContext);
    const filterQuery = await buildGetItemsFilterQuery(filters, userContext);
    return this.mongooseModel.countDocuments({ ...baseFilterQuery, ...filterQuery });
  }

  async getDistinctValuesForAllItem<T extends keyof ItemEntity.ItemSchema>(
    { filters }: ItemEntity.GetAllItemsInput,
    field: T,
    userContext: UserContext,
  ): Promise<ItemEntity.ItemSchema[T][]> {
    const baseFilterQuery: FilterQuery<DocumentType<ItemEntity.ItemSchema>> = {
      status: { $ne: ItemEntity.ItemStatusEnum.DELETED },
      tenantId: userContext.tenantId,
    };
    const filterQuery = await buildGetItemsFilterQuery(filters, userContext);
    const distinctValues = await this.mongooseModel.distinct(field, {
      ...filterQuery,
      ...baseFilterQuery,
    });
    return distinctValues as ItemEntity.ItemSchema[T][];
  }
}

export const ItemRepository = new ItemRepositoryClass();
