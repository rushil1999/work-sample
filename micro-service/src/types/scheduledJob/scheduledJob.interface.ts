import { ScheduledJobEntity, StringObjectID, AssetItemEntity } from '@procurenetworks/inter-service-contracts';

export interface CreateScheduledJobRepositoryInputType extends ScheduledJobEntity.CreateScheduledJobInput {
  _id: StringObjectID;
  createdById: StringObjectID;
  updatedById: StringObjectID;
  status: ScheduledJobEntity.ScheduledJobStatusEnum;
}

export type UpdateScheduledJobRepositoryInputType = Partial<
  Omit<ScheduledJobEntity.ScheduledJobSchema, 'tenantId' | 'createdById' | 'updatedById' | 'oldTenantId' | 'sqlId'>
> & {
  cron?: string;
  recurringInterval?: number;
  type?: AssetItemEntity.AssetItemReminderTypeEnum;
  assetItemId?: string;
  notifyUserIds?: Array<StringObjectID>;
};

export interface CreateScheduledJobsPayload {
  success: boolean;
}
