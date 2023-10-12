import {
  PingResponse,
  RPCShippingServiceClient,
  UserContext,
  getRPCMetadata,
} from '@procurenetworks/inter-service-contracts';
import { Metadata } from 'grpc';
import { appConfigs } from '../../../../../appConfigs';

const { serviceRPCCall: ShippingServiceRPCCall } = RPCShippingServiceClient.getClient({
  host: appConfigs.rpc.shipService.host,
  port: appConfigs.rpc.shipService.port,
});
export class ShippingServiceRPCClient {
  static rpcCall =
    <T1, R>(fnName: string) =>
      (input: T1, userContext: UserContext): Promise<R> => {
        const metadata = getRPCMetadata(userContext);
        return ShippingServiceRPCCall<T1, R>(fnName)(input, metadata);
      };

  static pingService = (): Promise<PingResponse> => {
    const metadata = new Metadata();
    metadata.set('requestId', 'pingService');
    return ShippingServiceRPCCall<any, PingResponse>('ping')({}, metadata);
  };
}
