import { ContactEntity, Entity, UserContext } from '@procurenetworks/inter-service-contracts';
import { ContactService } from '../../services/contact/contact.service';

export class ContactController {
  /* Queries */

  static async getAllContacts(
    getContactsInput: ContactEntity.GetAllContactsInput,
    userContext: UserContext,
  ): Promise<ContactEntity.GetAllContactsPayload> {
    return ContactService.getAllContacts(getContactsInput, userContext);
  }

  static async getPaginatedContacts(
    getPaginatedContactsInput: ContactEntity.GetPaginatedContactsInput,
    userContext: UserContext,
  ): Promise<ContactEntity.PaginatedContactsPayload> {
    return ContactService.getPaginatedContacts(getPaginatedContactsInput, userContext);
  }

  /* Mutations */

  static async createContact(
    createContactInput: ContactEntity.CreateContactInput,
    userContext: UserContext,
  ): Promise<ContactEntity.CreateContactPayload> {
    return ContactService.createContact(createContactInput, userContext);
  }

  static async updateContact(
    updateContactInput: ContactEntity.UpdateContactInput,
    userContext: UserContext,
  ): Promise<ContactEntity.UpdateContactPayload> {
    return ContactService.updateContact(updateContactInput, userContext);
  }

  static async deleteContacts(
    deleteContactsInput: ContactEntity.DeleteContactsInput,
    userContext: UserContext,
  ): Promise<Entity.MutationResponse> {
    await ContactService.deleteContacts(deleteContactsInput, userContext);
    return { success: true };
  }
}
