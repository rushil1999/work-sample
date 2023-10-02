import { Entity, ItemEntity, TransactionEntity, UserContext } from '@procurenetworks/inter-service-contracts';
import { TransactionService } from '../../transaction/transaction.service';

export const getEligibleTransactionsForCreateRestockTransactionsInput = async (
  { itemIds }: ItemEntity.UndeleteItemsInput,
  userContext: UserContext,
): Promise<TransactionEntity.TransactionSchema[]> => {
  const { transactions } = await TransactionService.getAllTransactions(
    {
      filters: { entityIds: itemIds, subTypes: [TransactionEntity.TransactionSubTypeEnum.DELETE] },
      sorts: [{ sortField: 'createdAt', sortOrder: Entity.SortOrderEnum.DESC }],
    },
    userContext,
  );

  // For every itemId, first parentTransactionID in the sorted list is recorded.
  // All the transactions having that parentTransactionID are considered eligible for that item
  let eligibleTransactions: TransactionEntity.TransactionSchema[] = [];

  itemIds.forEach((itemId) => {
    const transactionsForItem = transactions.filter((transaction) => transaction.entityId.toString() === itemId);
    if (transactionsForItem.length > 0) {
      const { parentTransactionId: eligibleParentTransactionId } = transactionsForItem[0];
      const eligibleTransactionsForItem = transactionsForItem.filter((transaction) => {
        return transaction.parentTransactionId.toString() === eligibleParentTransactionId.toString();
      });
      eligibleTransactions = eligibleTransactions.concat(eligibleTransactionsForItem);
    }
  });
  return eligibleTransactions;
};
