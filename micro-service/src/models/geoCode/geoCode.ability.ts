import { Ability, GeoCodeEntity, StrictAbilityACL } from '@procurenetworks/inter-service-contracts';
import { FilterQuery } from 'mongoose';

class GeoCodeAbilityClass extends Ability<GeoCodeEntity.GeoCodePermission> {
  getEntity(): string {
    return 'geoCode';
  }

  permittedOn = (
    acl: StrictAbilityACL<GeoCodeEntity.GeoCodePermission>,
  ): Promise<FilterQuery<GeoCodeEntity.GeoCodeSchema>> => {
    return this.buildConditions(acl);
  };
}

export const GeoCodeAbility = new GeoCodeAbilityClass();
