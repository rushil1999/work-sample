import { appConfigs } from '../../appConfigs';
import { KafkaConnection, KafkaConnectionConfig } from '@procurenetworks/kafka-utils';

const {
  KafkaConsumerConfigs: { host, port, authMechanism, username, password, saslEnabled },
} = appConfigs;

let kafkaClientOptions: KafkaConnectionConfig = {
  host,
  port,
};

if (saslEnabled) {
  kafkaClientOptions = {
    ...kafkaClientOptions,
    saslConfig: {
      authMechanism,
      username,
      password,
    },
  };
}

export const kafkaConnection = new KafkaConnection(kafkaClientOptions);
