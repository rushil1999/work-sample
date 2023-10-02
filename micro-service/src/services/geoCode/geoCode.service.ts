import { InternalServerError, ProcureError, ValidationError, logger } from '@procurenetworks/backend-utils';
import { GeoCodeEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { GeoCodeRepository } from '../../models/geoCode/geoCode.repository';
import ZipCodeAPIService from '../../utils/external-services/ZipCodeAPIService';
import { parseZipCodeApiPayload } from './helpers/createGeoCode.helper';
import { validateFindGeoCodeInput } from './helpers/geoCode.validators';

class GeoCodeServiceClass {
  /* Queries */

  async getGeoCode(
    getGeoCodeInput: GeoCodeEntity.GetGeoCodeInput,
    userContext: UserContext,
  ): Promise<GeoCodeEntity.GetGeoCodePayload> {
    let geoCode = await GeoCodeRepository.getGeoCode(getGeoCodeInput, userContext);
    if (!geoCode) {
      const {
        filters: { zipcode },
      } = getGeoCodeInput;
      geoCode = await this.findAndStoreGeoCode({ zipcode }, userContext);
    }
    return { geoCode };
  }

  /* Mutations */
  /**
   * @param  {Array<GeoCodeEntity.CreateGeoCodeInput} findGeoCodeInput
   * @param  {UserContext} userContext
   * @returns {GeoCodeEntity.GeoCodeSchema}
   */
  async findAndStoreGeoCode(
    findGeoCodeInput: GeoCodeEntity.CreateGeoCodeInput,
    userContext: UserContext,
  ): Promise<GeoCodeEntity.GeoCodeSchema> {
    try {
      validateFindGeoCodeInput(findGeoCodeInput);
      const zipCodeData = await ZipCodeAPIService.getZipCodeData(findGeoCodeInput.zipcode);
      const parsedCreateGeoCodeRepositoryInput = parseZipCodeApiPayload(zipCodeData);
      const createdGeoCode = await GeoCodeRepository.createGeoCode(parsedCreateGeoCodeRepositoryInput, userContext);
      logger.debug({ message: `GeoCode found and stored for zipcode ${findGeoCodeInput.zipcode}` });
      return createdGeoCode;
    } catch (error: any) {
      if (error instanceof ProcureError) {
        throw error;
      }
      if (error && error.response && error.response.data && error.response.data.error_code === 404) {
        throw new ValidationError({
          debugMessage: `Invalid zipcode provided ${findGeoCodeInput.zipcode}`,
          error,
          message: 'Please provide a valid zipcode.',
          params: { findGeoCodeInput },
          where: `GeoCode service - ${this.findAndStoreGeoCode.name}`,
        });
      } else {
        logger.error({ error, message: `Error in createGeoCode.` });
        throw new InternalServerError({
          debugMessage: `Failed to createGeoCode ${error.message}`,
          error,
          message: "A technical issue occurred. We've logged the issue. You may be able to try again.",
          params: { findGeoCodeInput },
          where: `GeoCode service - ${this.findAndStoreGeoCode.name}`,
        });
      }
    }
  }
}

export const GeoCodeService = new GeoCodeServiceClass();
