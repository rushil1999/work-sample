import { ValidationError } from '@procurenetworks/backend-utils';
import { Entity, ItemEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { appConfigs } from '../../../appConfigs';
import { ItemService } from '../item.service';

function _getDateInYYMMDDFormat(date = new Date()) {
  /** DISCLAIMER: This will create date in the timezone of the instance where server is deployed. */
  const parsedDate = new Date(date);
  let month = `${parsedDate.getMonth() + 1}`;
  let day = `${parsedDate.getDate()}`;
  const year = parsedDate.getFullYear() - 2000;

  if (month.length < 2) {
    month = `0${month}`;
  }
  if (day.length < 2) {
    day = `0${day}`;
  }

  return [year, month, day].join('');
}

function _getPrefixLengthForItemType(itemType: ItemEntity.ItemTypeEnum) {
  switch (itemType) {
    case ItemEntity.ItemTypeEnum.INVENTORY:
    case ItemEntity.ItemTypeEnum.ASSET:
    case ItemEntity.ItemTypeEnum.INVENTORY_KIT:
    case ItemEntity.ItemTypeEnum.ASSET_KIT:
      return 3;
    default:
      return 3;
  }
}

export const getNextItemSequenceForTenant = async (
  itemTypes: Array<ItemEntity.ItemTypeEnum>,
  userContext: UserContext,
): Promise<number> => {
  const { edges } = await ItemService.getPaginatedItems(
    {
      disableBaseFilter: true,
      filters: {
        types: itemTypes,
      },
      paginationProps: {
        limit: 1,
        skip: 0,
        sorts: [
          {
            sortField: '_id',
            sortOrder: Entity.SortOrderEnum.DESC,
          },
          {
            sortField: 'sku',
            sortOrder: Entity.SortOrderEnum.DESC,
          },
        ],
      },
      projection: { sku: 1 },
    },
    userContext,
  );
  const dateToConsider = _getDateInYYMMDDFormat();
  const lastItemCreated = edges[0] ? edges[0].node : undefined;
  let nextSequenceNumberForItem = 0;
  const prefixLengthForItemType = _getPrefixLengthForItemType(itemTypes[0]);

  if (lastItemCreated && dateToConsider === lastItemCreated.sku.slice(prefixLengthForItemType, 9)) {
    nextSequenceNumberForItem = (parseInt(lastItemCreated.sku.slice(prefixLengthForItemType + 6)) % 100000) + 1;
  }

  if (appConfigs.node.env !== 'production' && nextSequenceNumberForItem >= 100000) {
    throw new ValidationError({
      debugMessage: 'Error fetching next inventory items.',
      message:
        'Your tenant has reached the quota to create maximum number of inventory items today. Please try again to create inventory items tomorrow',
      where: `${__filename} - ${getNextItemSequenceForTenant.name}`,
    });
  }
  return nextSequenceNumberForItem;
};

export const generateNumericalItemSkuId = (nextSequenceNumberForItem: number) => {
  const numericalItemSkuId = parseInt(`${_getDateInYYMMDDFormat()}${nextSequenceNumberForItem}`, 10);
  return numericalItemSkuId;
};
