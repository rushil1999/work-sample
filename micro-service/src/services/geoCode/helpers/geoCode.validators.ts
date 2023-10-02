import { ValidationError, logger } from '@procurenetworks/backend-utils';
import { GeoCodeEntity } from '@procurenetworks/inter-service-contracts';

const validateZipCode = (zipcode: string) => {
  if (!zipcode || typeof zipcode !== 'string' || zipcode.length !== 5) {
    logger.error({ message: `Rejecting request due to invalid zipcode: ${zipcode}` });
    throw new ValidationError({
      debugMessage: `Rejecting request due to invalid zipcode: ${zipcode}`,
      message: 'Please enter a valid zipcode.',
      params: { zipcode },
      where: `${__filename} - validateZipCode`,
    }); // REVIEW: Ask @Scott
  }
};

export const validateFindGeoCodeInput = (createGeoCodeInput: GeoCodeEntity.CreateGeoCodeInput): void => {
  const { zipcode } = createGeoCodeInput;

  validateZipCode(zipcode);
};
