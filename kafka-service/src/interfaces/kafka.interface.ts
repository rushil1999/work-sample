import { ConsumerEvents, ValueOf } from 'kafkajs';

export interface AddConsumerEventListenerInput {
  eventName: ValueOf<ConsumerEvents>;
  listener: (...args: unknown[]) => void;
}

export interface SubscribeToTopicsInput {
  topics: Array<{ topic: string | RegExp; fromBeginning?: boolean }>;
}
