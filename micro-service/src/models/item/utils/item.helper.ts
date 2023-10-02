import { AssetItemEntity } from '@procurenetworks/inter-service-contracts';

export const parseItemsForActiveReminders = (items: any[]): Array<AssetItemEntity.AssetItemSchema> => {
  const itemsWithActiveReminders = items.map((item: AssetItemEntity.AssetItemSchema) => {
    const { reminders } = item;
    const activeReminders = (reminders || []).filter(
      (reminder: AssetItemEntity.AssetItemReminder) =>
        reminder.status === AssetItemEntity.AssetItemReminderStatusEnum.ACTIVE,
    );
    return {
      ...item,
      reminders: activeReminders,
    };
  });
  return itemsWithActiveReminders;
};
