import { InventoryItemEntity, ItemEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Mongoose } from 'mongoose';
import { InventoryItemService } from '../../../src/services/inventoryItem/inventoryItem.service';
import { contextUserUtil } from '../../../src/utils/contextUser.util';

describe('CRUD InventoryItem', (): void => {
  let mongoClient: Mongoose;
  const userContext: UserContext = contextUserUtil.createUserContext();
  let mongoServer: MongoMemoryServer;
  let createdMockInventoryItem: InventoryItemEntity.InventoryItemSchema | undefined = undefined;

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

  test('Create a new InventoryItem', async () => {
    const mockInventoryItem: InventoryItemEntity.CreateInventoryItemInput = {
      title: 'Jest InventoryItem',
      type: ItemEntity.ItemTypeEnum.INVENTORY,
      pickableThroughOrderRequest: true,
      categoryId: 'temp objectId',
      description: 'Jest InventoryItem',
    };

    const { inventoryItem } = await InventoryItemService.createInventoryItem(mockInventoryItem, userContext);
    createdMockInventoryItem = inventoryItem;

    expect(createdMockInventoryItem).toBeDefined();
    if (createdMockInventoryItem) {
      expect(createdMockInventoryItem.title).toEqual(mockInventoryItem.title);
      expect(createdMockInventoryItem.sku).toBeDefined();
    }
  });

  test('Update a newly created InventoryItem', async () => {
    if (!createdMockInventoryItem) {
      fail('InventoryItem was not created successfully');
    }

    const updateInventoryItemId = createdMockInventoryItem._id.toString();
    const updateInventoryItemInput: InventoryItemEntity.UpdateInventoryItemInput = {
      itemId: updateInventoryItemId,
      attachments: createdMockInventoryItem.attachments,
      externalProductCodes: createdMockInventoryItem.externalProductCodes,
      title: 'Jest InventoryItem - 1',
    };

    const { inventoryItem: updatedInventoryItem } = await InventoryItemService.updateInventoryItem(
      updateInventoryItemInput,
      userContext,
    );
    expect(updatedInventoryItem).toBeDefined();
    if (updatedInventoryItem) {
      expect(updatedInventoryItem.title).toEqual(updateInventoryItemInput.title);
    }
  });

  test('Get a newly created InventoryItem', async () => {
    if (!createdMockInventoryItem) {
      fail('InventoryItem was not created successfully');
    }

    const { inventoryItems } = await InventoryItemService.getAllInventoryItems(
      { filters: { itemIds: [createdMockInventoryItem._id.toString()] } },
      userContext,
    );
    expect(inventoryItems).toBeDefined();
    expect(inventoryItems).toHaveLength(1);
    expect(inventoryItems[0]._id.toString()).toEqual(createdMockInventoryItem._id.toString());
  });
});
