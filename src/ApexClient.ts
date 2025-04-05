import { createApexProClient } from '../apex-sdk-node/src/pro/index';
import { ClientConfig } from '../apex-sdk-node/src/pro/apexpro/type';

export function createApexClient(config: {
  apiKey: string;
  secret: string;
  passphrase: string;
  ethPrivateKey: string;
  zkKey: string;
}) {
  const clientConfig: ClientConfig = {
    account: {
      apiKey: config.apiKey,
      secret: config.secret,
      passphrase: config.passphrase,
      ethPrivateKey: config.ethPrivateKey,
      l2Key: config.zkKey,
    },
    env: {
      isProd: false, // set to true for mainnet
      chainId: 5, // Goerli
    },
  };

  return createApexProClient(clientConfig);
}

