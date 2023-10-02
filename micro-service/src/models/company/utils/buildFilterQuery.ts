import { logger } from '@procurenetworks/backend-utils';
import { CompanyEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { DocumentType } from '@typegoose/typegoose';
import { escapeRegExp } from 'lodash';
import mongoose, { FilterQuery } from 'mongoose';

export async function buildGetCompaniesFilterQuery(
  companiesFilters: CompanyEntity.CompanyFilters,
  userContext: UserContext,
): Promise<FilterQuery<DocumentType<CompanyEntity.CompanySchema>>> {
  const query: FilterQuery<DocumentType<CompanyEntity.CompanySchema>> = {};
  for (const key of Object.keys(companiesFilters) as Array<keyof CompanyEntity.CompanyFilters>) {
    if (companiesFilters[key] && Array.isArray(companiesFilters[key])) {
      if ((companiesFilters[key] as any[]).length === 0) {
        continue;
      }
    }
    switch (key) {
      case '_and': {
        if (companiesFilters._and && Array.isArray(companiesFilters._and)) {
          query.$and = query.$and || [];
          for (const andCondition of companiesFilters._and) {
            const nestedQuery = await buildGetCompaniesFilterQuery(andCondition, userContext);
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
        if (companiesFilters._or && Array.isArray(companiesFilters._or)) {
          query.$or = query.$or || [];
          for (const orCondition of companiesFilters._or) {
            const nestedQuery = await buildGetCompaniesFilterQuery(orCondition, userContext);
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
        if (companiesFilters._exists) {
          query.$and = query.$and || [];
          for (const existsKey in companiesFilters._exists) {
            query.$and.push({
              [existsKey]: {
                $exists: companiesFilters._exists[existsKey as keyof CompanyEntity.CompanySchema],
              },
            });
          }
        }
        break;
      }
      case 'companyIds': {
        const { companyIds } = companiesFilters;
        if (companyIds && companyIds.length > 0) {
          query['_id'] = { $in: companyIds.map((companyId) => new mongoose.Types.ObjectId(companyId)) };
        }
        break;
      }
      case 'statuses': {
        const { statuses } = companiesFilters;
        if (statuses && statuses.length > 0) {
          query['status'] = { $in: statuses };
        }
        break;
      }
      case 'isVendor': {
        const { isVendor } = companiesFilters;
        if (typeof isVendor === 'boolean') {
          query['isVendor'] = isVendor;
        }
        break;
      }
      case 'names': {
        const { names } = companiesFilters;
        if (Array.isArray(names) && names.length > 0) {
          query['name'] = { $in: names };
        }
        break;
      }
      case 'searchInternal':
      case 'search': {
        const search = companiesFilters[key] as string;
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
                { companyName: { $regex: new RegExp(`.*${escapeRegExp(search.trim())}.*`, 'i') } },
                // { companyContactNumber: { $regex: new RegExp(`^${escapeRegExp(search.trim())}`, 'i') } },
                // { companyEmail: { $regex: new RegExp(`^${escapeRegExp(search.trim())}`, 'i') } },
                // { companyFax: { $regex: new RegExp(`^${escapeRegExp(search.trim())}`, 'i') } },
                // { companyWebsite: { $regex: new RegExp(`^${escapeRegExp(search.trim())}`, 'i') } },
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
  logger.debug({ message: 'Query for fetching companies', payload: { query } });
  return query;
}
