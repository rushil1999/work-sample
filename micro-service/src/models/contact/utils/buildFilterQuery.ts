import { logger } from '@procurenetworks/backend-utils';
import { ContactEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { DocumentType } from '@typegoose/typegoose';
import { escapeRegExp } from 'lodash';
import mongoose, { FilterQuery } from 'mongoose';

export async function buildGetContactsFilterQuery(
  contactsFilters: ContactEntity.ContactFilters,
  userContext: UserContext,
): Promise<FilterQuery<DocumentType<ContactEntity.ContactSchema>>> {
  const query: FilterQuery<DocumentType<ContactEntity.ContactSchema>> = {};
  for (const key of Object.keys(contactsFilters) as Array<keyof ContactEntity.ContactFilters>) {
    if (contactsFilters[key] && Array.isArray(contactsFilters[key])) {
      if ((contactsFilters[key] as any[]).length === 0) {
        continue;
      }
    }
    switch (key) {
      case '_and': {
        if (contactsFilters._and && Array.isArray(contactsFilters._and)) {
          query.$and = query.$and || [];
          for (const andCondition of contactsFilters._and) {
            const nestedQuery = await buildGetContactsFilterQuery(andCondition, userContext);
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
        if (contactsFilters._or && Array.isArray(contactsFilters._or)) {
          query.$or = query.$or || [];
          for (const orCondition of contactsFilters._or) {
            const nestedQuery = await buildGetContactsFilterQuery(orCondition, userContext);
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
        if (contactsFilters._exists) {
          query.$and = query.$and || [];
          for (const existsKey in contactsFilters._exists) {
            query.$and.push({
              [existsKey]: {
                $exists: contactsFilters._exists[existsKey as keyof ContactEntity.ContactSchema],
              },
            });
          }
        }
        break;
      }
      case 'contactIds': {
        const { contactIds } = contactsFilters;
        if (contactIds && contactIds.length > 0) {
          query['_id'] = { $in: contactIds.map((contactId) => new mongoose.Types.ObjectId(contactId)) };
        }
        break;
      }
      case 'companyIds': {
        const { companyIds } = contactsFilters;
        if (companyIds && companyIds.length > 0) {
          query['companyId'] = { $in: companyIds.map((companyId) => new mongoose.Types.ObjectId(companyId)) };
        }
        break;
      }
      case 'addressIds': {
        const { addressIds } = contactsFilters;
        if (addressIds && addressIds.length > 0) {
          query['addressId'] = { $in: addressIds.map((addressId) => new mongoose.Types.ObjectId(addressId)) };
        }
        break;
      }
      case 'statuses': {
        const { statuses } = contactsFilters;
        if (statuses && statuses.length > 0) {
          query['status'] = { $in: statuses };
        }
        break;
      }
      case 'search': {
        const search = contactsFilters[key] as string;
        if (search === '') {
          continue;
        }
        if (!query.$and) {
          query.$and = [];
        }
        query.$and.push({
          $and: [
            {
              $or: [
                { fullName: { $regex: new RegExp(`.*${escapeRegExp(search.trim())}.*`, 'i') } },
                { email: { $regex: new RegExp(`^${escapeRegExp(search.trim())}`, 'i') } },
                // { fax: { $regex: new RegExp(`^${escapeRegExp(search.trim())}`, 'i') } },
                { homeContactNumber: { $regex: new RegExp(`.*${escapeRegExp(search.trim())}.*`, 'i') } },
                { mobileContactNumber: { $regex: new RegExp(`.*${escapeRegExp(search.trim())}.*`, 'i') } },
                { officeContactNumber: { $regex: new RegExp(`.*${escapeRegExp(search.trim())}.*`, 'i') } },
              ],
            },
          ],
        });
        break;
      }
      default:
        continue;
    }
  }
  logger.debug({ message: 'Query for fetching contacts', payload: { query } });
  return query;
}
