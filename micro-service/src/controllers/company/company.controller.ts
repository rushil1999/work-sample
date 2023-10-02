import { CompanyEntity, Entity, UserContext } from '@procurenetworks/inter-service-contracts';
import { CompanyService } from '../../services/company/company.service';

export class CompanyController {
  /* Queries */

  static async getAllCompanies(
    getCompaniesInput: CompanyEntity.GetAllCompaniesInput,
    userContext: UserContext,
  ): Promise<CompanyEntity.GetAllCompaniesPayload> {
    return CompanyService.getAllCompanies(getCompaniesInput, userContext);
  }

  static async getPaginatedCompanies(
    getPaginatedCompaniesInput: CompanyEntity.GetPaginatedCompaniesInput,
    userContext: UserContext,
  ): Promise<CompanyEntity.PaginatedCompaniesPayload> {
    return CompanyService.getPaginatedCompanies(getPaginatedCompaniesInput, userContext);
  }

  /* Mutations */

  static async createCompany(
    createCompanyInput: CompanyEntity.CreateCompanyInput,
    userContext: UserContext,
  ): Promise<CompanyEntity.CreateCompanyPayload> {
    return CompanyService.createCompany(createCompanyInput, userContext);
  }

  static async createCompanies(
    createCompanyInput: CompanyEntity.CreateCompaniesInput,
    userContext: UserContext,
  ): Promise<Entity.MutationResponse> {
    return CompanyService.createCompanies(createCompanyInput, userContext);
  }

  static async updateCompany(
    updateCompanyInput: CompanyEntity.UpdateCompanyInput,
    userContext: UserContext,
  ): Promise<CompanyEntity.UpdateCompanyPayload> {
    return CompanyService.updateCompany(updateCompanyInput, userContext);
  }

  static async updateCompanies(
    updateCompaniesInput: CompanyEntity.UpdateCompaniesInput,
    userContext: UserContext,
  ): Promise<CompanyEntity.UpdateCompanyPayload> {
    return CompanyService.updateCompanies(updateCompaniesInput, userContext);
  }

  static async deleteCompanies(
    deleteCompaniesInput: CompanyEntity.DeleteCompaniesInput,
    userContext: UserContext,
  ): Promise<Entity.MutationResponse> {
    await CompanyService.deleteCompanies(deleteCompaniesInput, userContext);
    return { success: true };
  }
}
