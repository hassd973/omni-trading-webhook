import { KeyPair } from './starkex-lib';
import { ApiKeyCredentials, ApiTool, Clock } from './apexpro';

export class ClientConfig {
  public apiKeyCredentials: ApiKeyCredentials;
  public starkKeyPair: KeyPair;
  public clock: Clock;
  public apiTool: ApiTool;
  public networkId: number;
  public accountId: string;
}

export class ENV {
  url: string;
  networkId: number;
  isProd: boolean;
  registerChainId: number;
  key?: string;               // Optional API key
  secret?: string;            // Optional API secret
  passphrase?: string;        // Optional API passphrase (fixed: removed erroneous 'k')
  starkKeyPair?: { publicKey: string; privateKey: string }; // Optional Stark key pair
  accountId?: string;         // Optional account ID
  ethPrivateKey?: string;     // Optional Ethereum private key

  constructor(url: string, networkId: number) {
    this.url = url;
    this.networkId = networkId;
    this.isProd = +networkId === 1;
    this.registerChainId = +networkId === 1 ? 1 : 5;
  }
}

export const PROD = new ENV('https://pro.apex.exchange', 1);

export const QA = new ENV('https://qa.pro.apex.exchange', 5);
