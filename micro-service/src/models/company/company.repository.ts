import { ErrorCodeEnum, ForbiddenError, logger, ResourceNotFoundError, StatusCodes } from '@procurenetworks/backend-utils';
import {
  BaseCrudService,
  CompanyEntity,
  convertSortPropsToMongoQuery,
  PaginationUtil,
  StringObjectID,
  UserContext,
} from '@procurenetworks/inter-service-contracts';
import { DocumentType } from '@typegoose/typegoose';
import { chunk } from 'lodash';
import mongoose, { ClientSession, FilterQuery } from 'mongoose';
import { CreateCompanyRepositoryInput, UpdateCompanyRepositoryInput } from '../../types/Company';
import { CompanyAbility } from './company.ability';
import { buildGetCompaniesFilterQuery } from './utils/buildFilterQuery';
import { buildUpdateCompanyQuery } from './utils/buildUpdateQuery';

class CompanyRepositoryClass extends BaseCrudService<typeof CompanyEntity.CompanySchema, typeof CompanyAbility> {
  constructor() {
    super({
      ability: CompanyAbility,
      entityClass: CompanyEntity.CompanySchema,
      mongooseConnection: mongoose.connection,
      schemaOptions: { collection: 'companies' },
    });
  }

  /* Queries */
  async getAllCompanies(
    { disableBaseFilter = false, filters, projection, sorts }: CompanyEntity.GetAllCompaniesInput,
    userContext: UserContext,
  ): Promise<Array<CompanyEntity.CompanySchema>> {
    let baseFilterQuery: FilterQuery<DocumentType<CompanyEntity.CompanySchema>> = {
      status: { $ne: CompanyEntity.CompanyStatusEnum.DELETED },
      tenantId: userContext.tenantId,
    };
    if (disableBaseFilter) {
      baseFilterQuery = {
        tenantId: userContext.tenantId,
      };
    }
    const filterQuery = await buildGetCompaniesFilterQuery(filters, userContext);
    const companies = await this.findAll({
      filterQuery: { ...baseFilterQuery, ...filterQuery },
      projection,
      sortQuery: convertSortPropsToMongoQuery(sorts),
      acl: { permission: { company: CompanyEntity.CompanyActionsEnum.READ }, userContext },
    });

    return companies;
  }

  async getPaginatedCompanies(
    { disableBaseFilter = false, filters, paginationProps, projection }: CompanyEntity.GetPaginatedCompaniesInput,
    userContext: UserContext,
  ): Promise<CompanyEntity.PaginatedCompaniesPayload> {
    let baseFilterQuery: FilterQuery<DocumentType<CompanyEntity.CompanySchema>> = {
      status: { $ne: CompanyEntity.CompanyStatusEnum.DELETED },
      tenantId: userContext.tenantId,
    };
    if (disableBaseFilter) {
      baseFilterQuery = {
        tenantId: userContext.tenantId,
      };
    }
    const filterQuery = await buildGetCompaniesFilterQuery(filters, userContext);
    const companyPaginationUtil = new PaginationUtil<CompanyEntity.CompanySchema>(
      { ...baseFilterQuery, ...filterQuery },
      paginationProps,
    );
    const paginatedFilterQuery = companyPaginationUtil.getPaginationFilterQuery();
    const paginatedSortQuery = companyPaginationUtil.getSortQuery();
    const { limit } = paginationProps;
    const [companies, companiesCount] = await Promise.all([
      this.find({
        acl: { permission: { company: CompanyEntity.CompanyActionsEnum.READ }, userContext },
        filterQuery: paginatedFilterQuery,
        sortQuery: paginatedSortQuery,
        projection,
        limit: limit + 1,
      }),
      this.countDocuments({
        acl: { permission: { company: CompanyEntity.CompanyActionsEnum.READ }, userContext },
        filterQuery: { ...baseFilterQuery, ...filterQuery },
      }),
    ]);
    return companyPaginationUtil.getPaginatedResponse(companies, companiesCount);
  }

  async getDistinctValuesForAllCompany<T extends keyof CompanyEntity.CompanySchema>(
    { disableBaseFilter = false, filters }: CompanyEntity.GetAllCompaniesInput,
    field: T,
    userContext: UserContext,
  ): Promise<CompanyEntity.CompanySchema[T][]> {
    if (disableBaseFilter && Object.keys(filters).length === 0) {
      return [];
    }
    let baseFilterQuery: FilterQuery<DocumentType<CompanyEntity.CompanySchema>> = {
      tenantId: userContext.tenantId,
    };
    if (!disableBaseFilter) {
      baseFilterQuery = {
        status: { $ne: CompanyEntity.CompanyStatusEnum.DELETED },
        tenantId: userContext.tenantId,
      };
    }
    const filterQuery = await buildGetCompaniesFilterQuery(filters, userContext);
    const distinctValues = await this.distinct<T>({
      acl: { permission: { company: CompanyEntity.CompanyActionsEnum.READ }, userContext },
      field,
      filterQuery: {
        ...baseFilterQuery,
        ...filterQuery,
      },
    });
    return distinctValues as CompanyEntity.CompanySchema[T][];
  }

  /* Mutations */
  async createCompany(
    company: CreateCompanyRepositoryInput,
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<CompanyEntity.CompanySchema> {
    try {
      const payload = await this.insertMany({
        acl: { permission: { company: CompanyEntity.CompanyActionsEnum.CREATE }, userContext },
        docs: [company],
        options: {
          session,
        },
      });

      return JSON.parse(JSON.stringify(payload[0]));
    } catch (error) {
      throw error;
    }
  }

  async createCompanies(
    companies: Array<CreateCompanyRepositoryInput>,
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<Array<CompanyEntity.CompanySchema>> {
    try {
      const companiesChunks = chunk(companies, 500);
      const createdCompanies = [];
      for (const companiesChunk of companiesChunks) {
        const payload = await this.insertMany({
          acl: { permission: { company: CompanyEntity.CompanyActionsEnum.CREATE }, userContext },
          docs: companiesChunk,
          options: {
            session,
          },
        });
        createdCompanies.push(...payload);
      }

      logger.debug({
        message: `${createdCompanies.length} companies created by userId: ${userContext.currentUserInfo._id.toString()}`,
      });
      return createdCompanies;
    } catch (error) {
      logger.error({
        message: `Error while creating locations in CompanyRepository.createCompanies`,
        error,
      });
      throw error;
    }
  }

  async updateCompany(
    companyId: StringObjectID,
    input: UpdateCompanyRepositoryInput,
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<CompanyEntity.CompanySchema> {
    try {
      const updateCompanyUpdateQuery = buildUpdateCompanyQuery(input, userContext);

      const updateCompanyFilterQuery = await buildGetCompaniesFilterQuery(
        { companyIds: [companyId], statuses: [CompanyEntity.CompanyStatusEnum.ACTIVE] },
        userContext,
      );

      const updatedCompany = await this.findOneAndUpdate({
        acl: { permission: { company: CompanyEntity.CompanyActionsEnum.EDIT }, userContext },
        filterQuery: updateCompanyFilterQuery,
        updateQuery: updateCompanyUpdateQuery,
        options: { session, new: true },
      });

      if (!updatedCompany) {
        throw new ResourceNotFoundError({
          errorCode: ErrorCodeEnum.RESOURCE_NOT_FOUND,
          httpStatus: StatusCodes.NOT_FOUND,
          debugMessage: `Failed to updateCompany`,
          message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
          where: `${__filename} - ${this.updateCompany.name}`,
        });
      }

      return updatedCompany;
    } catch (error) {
      logger.error({ message: `Error while updateCompany in CompanyRepository.updateCompany`, error });
      throw error;
    }
  }

  async deleteCompanies(
    { companyIds }: CompanyEntity.DeleteCompaniesInput,
    userContext: UserContext,
    session?: ClientSession,
  ): Promise<void> {
    const { tenantId, currentUserInfo } = userContext;

    const result = await this.updateMany({
      acl: { permission: { company: CompanyEntity.CompanyActionsEnum.DELETE }, userContext },
      filterQuery: { _id: { $in: companyIds }, status: { $ne: CompanyEntity.CompanyStatusEnum.DELETED }, tenantId },
      updateQuery: {
        $set: {
          status: CompanyEntity.CompanyStatusEnum.DELETED,
          deletedAt: userContext.requestTimestamp,
          deletedById: currentUserInfo._id,
        },
      },
      options: { session },
    });
    if (result.modifiedCount !== companyIds.length) {
      throw new ForbiddenError({
        message: 'You are not authorized to delete one or more of these company records.',
        where: `${__filename} - ${this.deleteCompanies.name}`,
        params: { companyIds },
      });
    }

    logger.debug(`Marked ${result.modifiedCount} companies as deleted for companyId: ${companyIds}`);
  }
}

export const CompanyRepository = new CompanyRepositoryClass();
