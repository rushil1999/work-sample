import { Ability, CompanyEntity, StrictAbilityACL } from '@procurenetworks/inter-service-contracts';
import { FilterQuery } from 'mongoose';

class CompanyAbilityClass extends Ability<CompanyEntity.CompanyPermission> {
  getEntity(): string {
    return 'contact';
  }

  permittedOn = (
    acl: StrictAbilityACL<CompanyEntity.CompanyPermission>,
  ): Promise<FilterQuery<CompanyEntity.CompanySchema>> => {
    return this.buildConditions(acl);
  };
}

export const CompanyAbility = new CompanyAbilityClass();
