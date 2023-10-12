import { LocationEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { OrganizationServiceRPCClient } from './rpcClient';

export class LocationService extends OrganizationServiceRPCClient {
  /* Queries */
  public static async getAllLocations(
    inputProps: LocationEntity.GetAllLocationsInput,
    context: UserContext,
  ): Promise<LocationEntity.GetAllLocationsPayload> {
    const allLocationResponse = await this.rpcCall<
      LocationEntity.GetAllLocationsInput,
      LocationEntity.GetAllLocationsPayload
    >('getAllLocations')(inputProps, context);
    return allLocationResponse;
  }
}
