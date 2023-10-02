import { InternalServerError, logger, ProcureError } from '@procurenetworks/backend-utils';
import { ContactEntity, StringObjectID, UserContext } from '@procurenetworks/inter-service-contracts';
import { ClientSession } from 'mongoose';
import { ContactRepository } from '../../models/contact/contact.repository';
import {
  validateCreateContactInput,
  validateDeleteContactsByCompanyIdInput,
  validateDeleteContactsInput,
  validateUpdateContactInput,
} from './helpers/contact.validators';
import { parseCreateContactInputs } from './helpers/createContact.helper';
import { parseUpdateContactInput } from './helpers/updateContact.helper';

class ContactServiceClass {
  /* Queries */

  async getAllContacts(
    getAllContactInput: ContactEntity.GetAllContactsInput,
    userContext: UserContext,
  ): Promise<ContactEntity.GetAllContactsPayload> {
    const contacts = await ContactRepository.getAllContacts(getAllContactInput, userContext);
    return { contacts };
  }

  async getPaginatedContacts(
    getPaginatedContactsInput: ContactEntity.GetPaginatedContactsInput,
    userContext: UserContext,
  ): Promise<ContactEntity.PaginatedContactsPayload> {
    try {
      logger.debug({ message: 'getPaginatedContacts:', payload: { getPaginatedContactsInput } });
      return ContactRepository.getPaginatedContacts(getPaginatedContactsInput, userContext);
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in getPaginatedContacts.` });
      throw new InternalServerError({
        debugMessage: `Failed to getPaginatedContacts ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { getPaginatedContactsInput },
        where: `Contact service - ${this.getPaginatedContacts.name}`,
      });
    }
  }

  /* Mutations */
  /**
   * @param  {Array<ContactEntity.CreateContactInput} createContactInput
   * @param  {UserContext} userContext
   * @returns {ContactEntity.CreateContactPayload}
   */
  async createContact(
    createContactInput: ContactEntity.CreateContactInput,
    userContext: UserContext,
  ): Promise<ContactEntity.CreateContactPayload> {
    try {
      validateCreateContactInput(createContactInput);
      const parsedCreateContactInput = parseCreateContactInputs(createContactInput, userContext);
      const createdContact = await ContactRepository.createContact(parsedCreateContactInput, userContext);
      logger.debug({ message: `Contact created with contactId ${createdContact._id}` });
      return { success: true, contact: createdContact as ContactEntity.ContactSchema };
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in createContact.` });
      throw new InternalServerError({
        debugMessage: `Failed to createContact ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { createContactInput },
        where: `Contact service - ${this.createContact.name}`,
      });
    }
  }

  /**
   * @param  {Array<ContactEntity.UpdateContactInput} updateContactInput
   * @param  {UserContext} userContext
   * @returns {ContactEntity.UpdateContactPayload}
   */
  async updateContact(
    updateContactInput: ContactEntity.UpdateContactInput,
    userContext: UserContext,
  ): Promise<ContactEntity.UpdateContactPayload> {
    try {
      const {
        contacts: [existingContact],
      } = await this.getAllContacts({ filters: { contactIds: [updateContactInput.contactId] } }, userContext);
      await validateUpdateContactInput(updateContactInput, existingContact);
      const parsedUpdateContactInput = parseUpdateContactInput(updateContactInput, existingContact, userContext);

      const { contactId } = updateContactInput;
      const updatedContact = await ContactRepository.updateContact(contactId, parsedUpdateContactInput, userContext);

      if (!updatedContact) {
        logger.info({ message: `Contact for contactId ${contactId} not found.` });
        return { success: false };
      }

      logger.debug({ message: `Contact updated with contactId ${updatedContact._id}` });
      return { success: true, contact: updatedContact as ContactEntity.ContactSchema };
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in updateContact.` });
      throw new InternalServerError({
        debugMessage: `Failed to updateContact ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { updateContactInput },
        where: `Contact service - ${this.updateContact.name}`,
      });
    }
  }

  /**
   * @param  {Array<ContactEntity.DeleteContactInput} deleteContactsInput
   * @param  {UserContext} userContext
   * @returns {Promise<void>}
   */
  async deleteContacts(deleteContactsInput: ContactEntity.DeleteContactsInput, userContext: UserContext): Promise<void> {
    try {
      validateDeleteContactsInput(deleteContactsInput, userContext);

      await ContactRepository.deleteContacts(deleteContactsInput, userContext);
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in deleteContacts.` });
      throw new InternalServerError({
        debugMessage: `Failed to deleteContacts ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { deleteContactsInput },
        where: `Contact service - ${this.deleteContacts.name}`,
      });
    }
  }

  /**
   * @param  {Array<StringObjectID>} companyIds
   * @param  {UserContext} userContext
   * @param  {ClientSession} session
   * @returns {Promise<void>}
   */
  async deleteContactsByCompanyId(
    companyIds: StringObjectID[],
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<void> {
    try {
      validateDeleteContactsByCompanyIdInput(companyIds, userContext);

      await ContactRepository.deleteContactsByCompanyId(companyIds, userContext, session);
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in deleteContactsByCompanyId.` });
      throw new InternalServerError({
        debugMessage: `Failed to deleteContactsByCompanyId ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { companyIds },
        where: `Contact service - ${this.deleteContactsByCompanyId.name}`,
      });
    }
  }
}

export const ContactService = new ContactServiceClass();
