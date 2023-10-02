import { ErrorCodeEnum, ForbiddenError, logger, ResourceNotFoundError, StatusCodes } from '@procurenetworks/backend-utils';
import {
  BaseCrudService,
  ContactEntity,
  convertSortPropsToMongoQuery,
  PaginationUtil,
  StringObjectID,
  UserContext,
} from '@procurenetworks/inter-service-contracts';
import { DocumentType } from '@typegoose/typegoose';
import mongoose, { ClientSession, FilterQuery } from 'mongoose';
import { CreateContactRepositoryInput, UpdateContactRepositoryInput } from '../../types/Contact';
import { ContactAbility } from './contact.ability';
import { buildGetContactsFilterQuery } from './utils/buildFilterQuery';
import { buildUpdateContactQuery } from './utils/buildUpdateQuery';

class ContactRepositoryClass extends BaseCrudService<typeof ContactEntity.ContactSchema, typeof ContactAbility> {
  constructor() {
    super({
      ability: ContactAbility,
      entityClass: ContactEntity.ContactSchema,
      mongooseConnection: mongoose.connection,
      schemaOptions: { collection: 'contacts' },
    });
  }

  /* Queries */
  async getAllContacts(
    { disableBaseFilter = false, filters, projection, sorts }: ContactEntity.GetAllContactsInput,
    userContext: UserContext,
  ): Promise<Array<ContactEntity.ContactSchema>> {
    let baseFilterQuery: FilterQuery<DocumentType<ContactEntity.ContactSchema>> = {
      status: { $ne: ContactEntity.ContactStatusEnum.DELETED },
      tenantId: userContext.tenantId,
    };
    if (disableBaseFilter) {
      baseFilterQuery = {
        tenantId: userContext.tenantId,
      };
    }
    const filterQuery = await buildGetContactsFilterQuery(filters, userContext);
    const contacts = await this.findAll({
      acl: { permission: { contact: ContactEntity.ContactActionsEnum.READ }, userContext },
      filterQuery: { ...baseFilterQuery, ...filterQuery },
      sortQuery: convertSortPropsToMongoQuery(sorts),
      projection,
    });
    return contacts;
  }

  async getPaginatedContacts(
    { disableBaseFilter = false, filters, paginationProps, projection }: ContactEntity.GetPaginatedContactsInput,
    userContext: UserContext,
  ): Promise<ContactEntity.PaginatedContactsPayload> {
    let baseFilterQuery: FilterQuery<DocumentType<ContactEntity.ContactSchema>> = {
      status: { $ne: ContactEntity.ContactStatusEnum.DELETED },
      tenantId: userContext.tenantId,
    };
    if (disableBaseFilter) {
      baseFilterQuery = {
        tenantId: userContext.tenantId,
      };
    }
    const filterQuery = await buildGetContactsFilterQuery(filters, userContext);
    const contactPaginationUtil = new PaginationUtil<ContactEntity.ContactSchema>(
      { ...baseFilterQuery, ...filterQuery },
      paginationProps,
    );
    const paginatedFilterQuery = contactPaginationUtil.getPaginationFilterQuery();
    const paginatedSortQuery = contactPaginationUtil.getSortQuery();
    const { limit } = paginationProps;
    const [contacts, contactsCount] = await Promise.all([
      this.find({
        acl: { permission: { contact: ContactEntity.ContactActionsEnum.READ }, userContext },
        filterQuery: paginatedFilterQuery,
        sortQuery: paginatedSortQuery,
        projection,
        limit: limit + 1,
      }),
      this.countDocuments({
        acl: { permission: { contact: ContactEntity.ContactActionsEnum.READ }, userContext },
        filterQuery: { ...baseFilterQuery, ...filterQuery },
      }),
    ]);
    return contactPaginationUtil.getPaginatedResponse(contacts, contactsCount);
  }

  /* Mutations */
  async createContact(
    contact: CreateContactRepositoryInput,
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<ContactEntity.ContactSchema> {
    try {
      const payload = await this.insertMany({
        acl: { permission: { contact: ContactEntity.ContactActionsEnum.CREATE }, userContext },
        docs: [contact],
        options: {
          session,
        },
      });

      return JSON.parse(JSON.stringify(payload[0]));
    } catch (error) {
      throw error;
    }
  }

  async updateContact(
    contactId: StringObjectID,
    input: UpdateContactRepositoryInput,
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<ContactEntity.ContactSchema> {
    try {
      const updateContactUpdateQuery = buildUpdateContactQuery(input, userContext);

      const updateContactFilterQuery = await buildGetContactsFilterQuery(
        { contactIds: [contactId], statuses: [ContactEntity.ContactStatusEnum.ACTIVE] },
        userContext,
      );

      const updatedContact = await this.findOneAndUpdate({
        acl: { permission: { contact: ContactEntity.ContactActionsEnum.EDIT }, userContext },
        filterQuery: updateContactFilterQuery,
        updateQuery: updateContactUpdateQuery,
        options: { session, new: true },
      });

      if (!updatedContact) {
        throw new ResourceNotFoundError({
          errorCode: ErrorCodeEnum.RESOURCE_NOT_FOUND,
          httpStatus: StatusCodes.NOT_FOUND,
          debugMessage: `Failed to updateContact`,
          message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
          where: `${__filename} - ${this.updateContact.name}`,
        });
      }

      return updatedContact;
    } catch (error) {
      logger.error({ message: `Error while updateContact in ContactRepository.updateContact`, error });
      throw error;
    }
  }

  async deleteContacts(
    { contactIds }: ContactEntity.DeleteContactsInput,
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<void> {
    const { currentUserInfo, tenantId } = userContext;

    const result = await this.updateMany({
      acl: { permission: { contact: ContactEntity.ContactActionsEnum.DELETE }, userContext },
      filterQuery: {
        _id: { $in: contactIds },
        status: { $ne: ContactEntity.ContactStatusEnum.DELETED },
        tenantId,
      },
      updateQuery: {
        $set: {
          status: ContactEntity.ContactStatusEnum.DELETED,
          deletedAt: userContext.requestTimestamp,
          deletedById: currentUserInfo._id,
        },
      },
      options: { session },
    });
    if (result.modifiedCount !== contactIds.length) {
      throw new ForbiddenError({
        message: 'You are not authorised to delete one or more contacts you requested to delete.',
        where: `${__filename} - ${this.deleteContacts.name}`,
        params: { contactIds },
      });
    }

    logger.debug(`Marked ${result.modifiedCount} contacts as deleted for contactId: ${contactIds}`);
  }

  async deleteContactsByCompanyId(
    companyIds: StringObjectID[],
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<void> {
    const { currentUserInfo, tenantId } = userContext;

    const result = await this.updateMany({
      acl: { permission: { contact: ContactEntity.ContactActionsEnum.DELETE }, userContext },
      filterQuery: {
        companyId: { $in: companyIds },
        status: { $ne: ContactEntity.ContactStatusEnum.DELETED },
        tenantId,
      },
      updateQuery: {
        $set: {
          status: ContactEntity.ContactStatusEnum.DELETED,
          deletedAt: userContext.requestTimestamp,
          deletedById: currentUserInfo._id,
        },
      },
      options: { session },
    });

    logger.debug(`Marked ${result.modifiedCount} contacts as deleted for companyId: ${companyIds}`);
  }
}

export const ContactRepository = new ContactRepositoryClass();
