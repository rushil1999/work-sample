import { InternalServerError, logger, ProcureError } from '@procurenetworks/backend-utils';
import {
  CompanyEntity,
  Entity,
  getDistinctValuesForAllEntityPayload,
  JobEntity,
  UserContext,
} from '@procurenetworks/inter-service-contracts';
import { JobService } from '@transport/__grpc/client/services';
import mongoose from 'mongoose';
import { CompanyRepository } from '../../models/company/company.repository';
import { CreateCompanyRepositoryInput } from '../../types/Company';
import { AddressService } from '../address/address.service';
import { ContactService } from '../contact/contact.service';
import {
  filterValidCreateCompanyInput,
  validateCreateCompanyInput,
  validateDeleteCompaniesInput,
  validateUpdateCompanyInput,
} from './helpers/company.validators';
import { parseCreateCompanyInputs } from './helpers/createCompany.helper';
import { parseUpdateCompanyInput } from './helpers/updateCompany.helper';

class CompanyServiceClass {
  /* Queries */

  async getAllCompanies(
    getAllCompanyInput: CompanyEntity.GetAllCompaniesInput,
    userContext: UserContext,
  ): Promise<CompanyEntity.GetAllCompaniesPayload> {
    const companies = await CompanyRepository.getAllCompanies(getAllCompanyInput, userContext);
    return { companies };
  }

  async getPaginatedCompanies(
    getPaginatedCompaniesInput: CompanyEntity.GetPaginatedCompaniesInput,
    userContext: UserContext,
  ): Promise<CompanyEntity.PaginatedCompaniesPayload> {
    try {
      return CompanyRepository.getPaginatedCompanies(getPaginatedCompaniesInput, userContext);
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in getPaginatedCompanies.` });
      throw new InternalServerError({
        debugMessage: `Failed to getPaginatedCompanies ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { getPaginatedCompaniesInput },
        where: `Company service - ${this.getPaginatedCompanies.name}`,
      });
    }
  }

  async getDistinctValuesForAllCompany(
    getDistinctValuesInput: CompanyEntity.GetDistinctValuesForAllCompanyInput,
    userContext: UserContext,
  ): Promise<Entity.GetDistinctValuesForAllEntityPayload> {
    const { filters, field } = getDistinctValuesInput;
    const distinctValues = await CompanyRepository.getDistinctValuesForAllCompany<typeof field>(
      { filters },
      field,
      userContext,
    );
    return getDistinctValuesForAllEntityPayload(distinctValues);
  }

  /* Mutations */
  /**
   * @param  {Array<CompanyEntity.CreateCompanyInput} createCompanyInput
   * @param  {UserContext} userContext
   * @returns {CompanyEntity.CreateCompanyPayload}
   */
  async createCompany(
    createCompanyInput: CompanyEntity.CreateCompanyInput,
    userContext: UserContext,
  ): Promise<CompanyEntity.CreateCompanyPayload> {
    try {
      validateCreateCompanyInput(createCompanyInput);
      const parsedCreateCompanyInput = parseCreateCompanyInputs(createCompanyInput, userContext);
      const createdCompany = await CompanyRepository.createCompany(parsedCreateCompanyInput, userContext);
      logger.debug({ message: `Company created with companyId ${createdCompany._id}` });
      return { success: true, company: createdCompany as CompanyEntity.CompanySchema };
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in createCompany.` });
      throw new InternalServerError({
        debugMessage: `Failed to createCompany ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { createCompanyInput },
        where: `Company service - ${this.createCompany.name}`,
      });
    }
  }

  async createCompanies(
    createCompaniesInput: CompanyEntity.CreateCompaniesInput,
    userContext: UserContext,
  ): Promise<Entity.MutationResponse> {
    try {
      const createCompaniesRepositoryInput: CreateCompanyRepositoryInput[] = filterValidCreateCompanyInput(
        createCompaniesInput,
        userContext,
      );
      const { jobId } = createCompaniesInput;
      const createdCompanies = await CompanyRepository.createCompanies(createCompaniesRepositoryInput, userContext);
      if (jobId) {
        try {
          await JobService.updateJob(
            {
              jobId,
              retryCount: 0,
            },
            userContext,
          );
        } catch (innerError) {
          logger.error({ error: innerError, message: `Error while message of job to success.` });
        }
      }
      return { success: true };
    } catch (error: any) {
      const { jobId } = createCompaniesInput;
      if (jobId) {
        try {
          await JobService.updateJob({ jobId, status: JobEntity.JobStatusEnum.FAILED, error }, userContext);
        } catch (innerError) {
          logger.error({ error: innerError, message: `Error while update status of job to failed.` });
        }
      }
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in createCompanies.` });
      throw new InternalServerError({
        debugMessage: `Failed to createCompanies ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { createCompaniesInput },
        where: `Company service - ${this.createCompanies.name}`,
      });
    }
  }

  /**
   * @param  {Array<CompanyEntity.UpdateCompanyInput} updateCompanyInput
   * @param  {UserContext} userContext
   * @returns {CompanyEntity.UpdateCompanyPayload}
   */
  async updateCompany(
    updateCompanyInput: CompanyEntity.UpdateCompanyInput,
    userContext: UserContext,
  ): Promise<CompanyEntity.UpdateCompanyPayload> {
    try {
      await validateUpdateCompanyInput(updateCompanyInput, userContext);
      const parsedUpdateCompanyInput = parseUpdateCompanyInput(updateCompanyInput, userContext);

      const { companyId } = updateCompanyInput;
      const updatedCompany = await CompanyRepository.updateCompany(companyId, parsedUpdateCompanyInput, userContext);

      if (!updatedCompany) {
        logger.info({ message: `Company for companyId ${companyId} not found.` });
        return { success: false };
      }

      logger.debug({ message: `Company updated with companyId ${updatedCompany._id}` });
      return { success: true, company: updatedCompany as CompanyEntity.CompanySchema };
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in updateCompany.` });
      throw new InternalServerError({
        debugMessage: `Failed to updateCompany ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { updateCompanyInput },
        where: `Company service - ${this.updateCompany.name}`,
      });
    }
  }

  async updateCompanies(
    input: CompanyEntity.UpdateCompaniesInput,
    userContext: UserContext,
  ): Promise<Entity.MutationResponse> {
    try {
      for (const companyInput of input.updateCompanies) {
        await validateUpdateCompanyInput(companyInput, userContext);
        const parsedUpdateCompanyInput = parseUpdateCompanyInput(companyInput, userContext);

        const updatedCompany = await CompanyRepository.updateCompany(
          companyInput.companyId,
          parsedUpdateCompanyInput,
          userContext,
        );

        if (!updatedCompany) {
          logger.info({ message: `Company for companyId ${companyInput.companyId} not found.` });
          return { success: false };
        }
      }

      return { success: true };
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in updateCompanies.` });
      throw new InternalServerError({
        debugMessage: `Failed to updateCompanies ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { input },
        where: `Company service - ${this.updateCompanies.name}`,
      });
    }
  }

  /* Mutations */
  /**
   * @param  {Array<CompanyEntity.DeleteCompanyInput} deleteCompaniesInput
   * @param  {UserContext} userContext
   * @returns {Promise<void>}
   */
  async deleteCompanies({ companyIds }: CompanyEntity.DeleteCompaniesInput, userContext: UserContext): Promise<void> {
    await validateDeleteCompaniesInput({ companyIds }, userContext);

    const session = await mongoose.startSession();

    try {
      await CompanyRepository.deleteCompanies({ companyIds }, userContext, session);
      await AddressService.deleteAddressesByCompanyId(companyIds, userContext);
      await ContactService.deleteContactsByCompanyId(companyIds, userContext);
    } catch (error: any) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      if (error instanceof ProcureError) {
        throw error;
      }
      logger.error({ error, message: `Error in deleteCompanies.` });
      throw new InternalServerError({
        debugMessage: `Failed to deleteCompanies ${error.message}`,
        error,
        message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
        params: { companyIds },
        where: `Company service - ${this.deleteCompanies.name}`,
      });
    } finally {
      await session.endSession();
    }
  }
}

export const CompanyService = new CompanyServiceClass();
