import { BaseCrudService, GeoCodeEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import mongoose, { ClientSession } from 'mongoose';
import { CreateGeoCodeRepositoryInput } from '../../types/GeoCode';
import { GeoCodeAbility } from './geoCode.ability';
import { buildGetGeoCodeFilterQuery } from './utils/buildFilterQuery';

class GeoCodeRepositoryClass extends BaseCrudService<typeof GeoCodeEntity.GeoCodeSchema, typeof GeoCodeAbility> {
  constructor() {
    super({
      ability: GeoCodeAbility,
      entityClass: GeoCodeEntity.GeoCodeSchema,
      mongooseConnection: mongoose.connection,
      schemaOptions: { collection: 'geoCodes' },
    });
  }

  /* Queries */
  async getGeoCode(
    { filters, projection }: GeoCodeEntity.GetGeoCodeInput,
    userContext: UserContext,
  ): Promise<GeoCodeEntity.GeoCodeSchema | undefined> {
    const filterQuery = await buildGetGeoCodeFilterQuery(filters, userContext);
    const geoCode = await this.findOne({
      acl: { byPass: true },
      filterQuery: { ...filterQuery },
      projection: { ...projection },
    });

    return geoCode;
  }

  /* Mutations */
  async createGeoCode(
    geoCode: CreateGeoCodeRepositoryInput,
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<GeoCodeEntity.GeoCodeSchema> {
    try {
      const payload = await this.insertMany({
        acl: { permission: { geoCode: GeoCodeEntity.GeoCodeActionsEnum.CREATE }, userContext, byPass: true },
        docs: [geoCode],
        options: {
          session,
        },
      });

      return JSON.parse(JSON.stringify(payload[0]));
    } catch (error) {
      throw error;
    }
  }
}

export const GeoCodeRepository = new GeoCodeRepositoryClass();
