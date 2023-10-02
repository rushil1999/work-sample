import { Entity, GeoCodeEntity } from '@procurenetworks/inter-service-contracts';

/** Version 2. */

/* Queries inputs */

/* Mutation inputs */
export type CreateGeoCodeRepositoryInput = Pick<
  GeoCodeEntity.GeoCodeSchema,
  Exclude<keyof GeoCodeEntity.GeoCodeSchema, keyof Entity.EntityBaseSchema>
>;

export type ZipCodeApiPayload = {
  zip_code: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  timezone: {
    timezone_identifier: string;
    timezone_abbr: string;
    utc_offset_sec: number;
    is_dst: string;
  };
  acceptable_city_names: { city: string; state: string }[];
  area_codes: number[];
};
