import { Ability, ContactEntity, StrictAbilityACL } from '@procurenetworks/inter-service-contracts';
import { FilterQuery } from 'mongoose';

class ContactAbilityClass extends Ability<ContactEntity.ContactPermission> {
  getEntity(): string {
    return 'contact';
  }

  permittedOn = (
    acl: StrictAbilityACL<ContactEntity.ContactPermission>,
  ): Promise<FilterQuery<ContactEntity.ContactSchema>> => {
    return this.buildConditions(acl);
  };
}

export const ContactAbility = new ContactAbilityClass();
