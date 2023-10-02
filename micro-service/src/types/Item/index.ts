import { AssetItemEntity } from '@procurenetworks/inter-service-contracts';

export interface UpdateKitItemCostInput {
  itemId: string;
  unitCostDelta: number;
}

export type UpdateKitItemInput = Omit<AssetItemEntity.UpdateAssetKitItemInput, 'assetKitItemId'> & {
  itemId: string;
};
