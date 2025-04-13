import { ClientConfig, ENV, PROD } from './Constant';
import { asEcKeyPair, asSimpleKeyPair, setConfig, setConfigV2, setCurrency, setCurrencyV2, setPerpetual, setSymbols, setSymbolsV2 } from './starkex-lib';
import {
  AccountObject,
  AccountsItem,
  ApiKeyCredentials,
  ApiTool,
  Clock,
  CurrencyObject,
  getPrecision,
  KeyPair,
  PerpetualContractObject,
  PerpetualCurrencyObject,
  SymbolInfoObject,
  UserObject,
} from './apexpro';

export interface PublicApi {
  getServerTime(): Promise<string>;
}

export interface PrivateApi {
  getPositions(params: { accountId: string }): Promise<any>;
  getAccount(accountId: string, currency: string): Promise<any>;
  createOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    type: 'LIMIT' | 'MARKET',
    size: number,
    timeInForce: 'GTC',
    price?: number,
    clientOrderId?: string,
    maxFeeRate?: string
  ): Promise<any>;
}

const genSymbolInfo = (groupSymbols: PerpetualContractObject[], currency: CurrencyObject[], symbols: { [key: string]: SymbolInfoObject }) => {
  if (groupSymbols.length) {
    groupSymbols.forEach((obj: PerpetualContractObject, idx: number) => {
      const symbolInfo: SymbolInfoObject = { ...obj, info: {} };
      symbolInfo.rankIdx = idx;
      symbolInfo.pricePrecision = getPrecision(obj.tickSize);
      symbolInfo.priceStep = Number(obj.tickSize);
      symbolInfo.sizePrecision = getPrecision(obj.stepSize);
      symbolInfo.sizeStep = Number(obj.stepSize);
      symbolInfo.baseCoin = obj.settleCurrencyId;
      symbolInfo.currentCoin = obj.underlyingCurrencyId;
      const baseCoinInfo: CurrencyObject =
        currency.find((item: CurrencyObject) => item.id === symbolInfo.baseCoin) || ({} as CurrencyObject);
      const currentCoinInfo: CurrencyObject =
        currency.find((item: CurrencyObject) => item.id === symbolInfo.currentCoin) || ({} as CurrencyObject);
      symbolInfo.baseCoinPrecision = Math.abs(Math.log10(Number(baseCoinInfo.showStep) || 1));
      symbolInfo.baseCoinRealPrecision = Math.abs(Math.log10(Number(baseCoinInfo.stepSize) || 1));
      symbolInfo.currentCoinPrecision = Math.abs(Math.log10(Number(currentCoinInfo.stepSize) || 1));
      symbolInfo.baseCoinIcon = baseCoinInfo.iconUrl;
      symbolInfo.currentCoinIcon = currentCoinInfo.iconUrl;
      symbols[obj.symbol] = symbolInfo;
    });
  }
};

export class ApexClient {
  apiTool: ApiTool;
  publicApi: PublicApi;
  privateApi: PrivateApi;
  clientConfig: ClientConfig;
  env: ENV;
  user: UserObject;
  account: AccountObject;
  symbols: { [key: string]: SymbolInfoObject };
  currency: CurrencyObject[];

  constructor(config: {
    networkId: number;
    key: string;
    secret: string;
    passphrase: string;
    starkKeyPair: { publicKey: string; privateKey: string };
    accountId: string;
    ethPrivateKey: string;
    url: string;
    isProd: boolean;
    registerChainId: number;
  }) {
    this.apiTool = new ApiTool(config.isProd ? PROD : { networkId: config.networkId, url: config.url });
    this.publicApi = {
      getServerTime: async () => (await this.apiTool.get('/time')).data.time
    };
    this.privateApi = {
      getPositions: async (params: { accountId: string }) =>
        (await this.apiTool.get('/positions', { params })).data,
      getAccount: async (accountId: string, currency: string) =>
        (await this.apiTool.get(`/account/${accountId}`, { params: { currency } })).data,
      createOrder: async (
        symbol: string,
        side: 'BUY' | 'SELL',
        type: 'LIMIT' | 'MARKET',
        size: number,
        timeInForce: 'GTC',
        price?: number,
        clientOrderId?: string,
        maxFeeRate?: string
      ) =>
        (await this.apiTool.post('/order', {
          symbol,
          side,
          type,
          size,
          timeInForce,
          price,
          clientOrderId,
          maxFeeRate
        })).data
    };
    this.env = config.isProd ? PROD : { networkId: config.networkId, url: config.url };
    this.clientConfig = new ClientConfig();
    this.clientConfig.apiTool = this.apiTool;
    this.clientConfig.networkId = config.networkId;
    this.clientConfig.accountId = config.accountId;
    this.clientConfig.apiKeyCredentials = {
      key: config.key,
      secret: config.secret,
      passphrase: config.passphrase
    };
    this.clientConfig.starkKeyPair = config.starkKeyPair;
    this.clientConfig.clock = new Clock();
    this.symbols = {};
    this.currency = [];
    this.initConfig().catch(err => console.error('ApexClient init failed:', err));
  }

  private async initClock() {
    const { time } = await this.publicApi.getServerTime().then(() => ({ time: new Date().getTime() }));
    this.clientConfig.clock.setTimestampAdjustment(time - new Date().getTime());
  }

  private async initConfig() {
    this.user = await this.privateApi.getAccount(this.clientConfig.accountId, '').then(() => ({} as UserObject));
    this.account = await this.privateApi.getAccount(this.clientConfig.accountId, this.user.ethereumAddress || '');
    this.checkAccountId();
    this.checkStarkKey();
    await this.initSymbol();
  }

  private async initSymbol() {
    const symbols: { [key: string]: SymbolInfoObject } = {};
    const { perpetualContract: groupSymbols = [], currency, multiChain, global } = await Promise.resolve({
      perpetualContract: [],
      currency: [],
      multiChain: {},
      global: {}
    });
    genSymbolInfo(groupSymbols, currency, symbols);
    this.symbols = symbols;
    this.currency = currency;
    setSymbols(symbols);
    setCurrency(currency);
    setConfig({ multiChain, global, currency });
  }

  private checkAccountId() {
    if (this.account.id !== this.clientConfig.accountId) {
      throw new Error('Account Id does not match, please check your account id.');
    }
  }

  private checkStarkKey() {
    let accountStarkPublicKey = this.account.starkKey.toLowerCase();
    if (!accountStarkPublicKey.startsWith('0x')) {
      accountStarkPublicKey = '0x' + accountStarkPublicKey;
    }
    let publicKey = this.clientConfig.starkKeyPair.publicKey;
    if (!publicKey.startsWith('0x')) {
      publicKey = '0x' + publicKey;
    }
    if (accountStarkPublicKey.toLowerCase() !== publicKey.toLowerCase()) {
      throw new Error('Stark Key does not match, please check your stark private key.');
    }
  }
}

export class ApexClientV2 {
  // ... (keep as is, not used in index.ts)
}
