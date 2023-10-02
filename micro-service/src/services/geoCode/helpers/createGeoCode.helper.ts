import { CreateGeoCodeRepositoryInput, ZipCodeApiPayload } from '../../../types/GeoCode';

export const parseZipCodeApiPayload = (zipCodeApiPayload: ZipCodeApiPayload): CreateGeoCodeRepositoryInput => {
  const {
    city,
    lat,
    lng,
    state,
    zip_code,
    acceptable_city_names,
    area_codes,
    timezone: { is_dst, timezone_abbr, timezone_identifier, utc_offset_sec },
  } = zipCodeApiPayload;
  const parsedGeoCodeRepositoryInput: CreateGeoCodeRepositoryInput = {
    city,
    state,
    zipcode: zip_code,
    coordinates: { lat, lng },
    acceptableCityNames: acceptable_city_names,
    areaCodes: area_codes,
    timezone: {
      abbreviation: timezone_abbr,
      identifier: timezone_identifier,
      isDaylightSavingTime: is_dst === 'T',
      utcOffsetInSeconds: utc_offset_sec,
    },
  };
  return parsedGeoCodeRepositoryInput;
};
