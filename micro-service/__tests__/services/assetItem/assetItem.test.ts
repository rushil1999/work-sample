import { AssetItemEntity, ItemEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Mongoose } from 'mongoose';
import { AssetItemService } from '../../../src/services/assetItem/assetItem.service';
import { contextUserUtil } from '../../../src/utils/contextUser.util';

describe('CRUD AssetItem', (): void => {
  let mongoClient: Mongoose;
  const userContext: UserContext = contextUserUtil.createUserContext();
  let mongoServer: MongoMemoryServer;
  let createdMockAssetItem: AssetItemEntity.AssetItemSchema | undefined;

  beforeAll(async (): Promise<void> => {
    mongoServer = await MongoMemoryServer.create();
    const URI = mongoServer.getUri();

    mongoClient = await mongoose.connect(URI);
  });

  afterAll(async (): Promise<void> => {
    await mongoose.connection.close();

    if (mongoServer) {
      await mongoServer.stop();
    }

    await mongoClient.disconnect();
  });

  test('Create a new AssetItem', async () => {
    const mockAssetItem: AssetItemEntity.CreateAssetItemInput = {
      title: 'Jest AssetItem',
      categoryId: 'some objectId',
      mName: 'some model',
      description: 'Jest AssetItem',
      pickableThroughOrderRequest: true,
      type: ItemEntity.ItemTypeEnum.ASSET,
    };

    const { assetItem } = await AssetItemService.createAssetItem(mockAssetItem, userContext);
    createdMockAssetItem = assetItem;

    expect(createdMockAssetItem).toBeDefined();
    if (createdMockAssetItem) {
      expect(createdMockAssetItem.title).toEqual(mockAssetItem.title);
      expect(createdMockAssetItem.sku).toBeDefined();
    }
  });

  test('Update a newly created AssetItem', async () => {
    if (!createdMockAssetItem) {
      fail('AssetItem was not created successfully');
    }

    const updateAssetItemId = createdMockAssetItem._id.toString();
    const updateAssetItemInput: AssetItemEntity.UpdateAssetItemInput = {
      itemId: updateAssetItemId,
      attachments: createdMockAssetItem.attachments,
      protectedAttachments: createdMockAssetItem.attachments,
      externalProductCodes: createdMockAssetItem.externalProductCodes,
      title: 'Jest AssetItem-1',
    };

    const { assetItem: updatedAssetItem } = await AssetItemService.updateAssetItem(updateAssetItemInput, userContext);
    expect(updatedAssetItem).toBeDefined();
    if (updatedAssetItem) {
      expect(updatedAssetItem.title).toEqual(updateAssetItemInput.title);
    }
  });

  test('Get a newly created AssetItem', async () => {
    if (!createdMockAssetItem) {
      fail('AssetItem was not created successfully');
    }

    const { assetItems } = await AssetItemService.getAllAssetItems(
      { filters: { itemIds: [createdMockAssetItem._id.toString()] } },
      userContext,
    );
    expect(assetItems).toBeDefined();
    expect(assetItems).toHaveLength(1);
    expect(assetItems[0]._id.toString()).toEqual(createdMockAssetItem._id.toString());
  });
});
