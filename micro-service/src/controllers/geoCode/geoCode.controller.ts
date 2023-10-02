import { GeoCodeEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { GeoCodeService } from '../../services/geoCode/geoCode.service';

export class GeoCodeController {
  /* Queries */

  static async getGeoCode(
    getGeoCodeInput: GeoCodeEntity.GetGeoCodeInput,
    userContext: UserContext,
  ): Promise<GeoCodeEntity.GetGeoCodePayload> {
    return GeoCodeService.getGeoCode(getGeoCodeInput, userContext);
  }
}
