import { ClientConfig, ENV, PROD } from './Constant.js';
import { setPerpetual, setSymbols, setCurrency, setConfig } from './starkex-lib/index.js';
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
} from './apexpro/index.js';

// Define PublicApi interface
export interface PublicApi {
  getServerTime(): Promise<string>;
}

// Define PrivateApi interface
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

  constructor(env: ENV = PROD) {
    this.apiTool = new ApiTool(env);
    this.publicApi = { getServerTime: () => Promise.resolve('') } as PublicApi;
    this.env = env;
  }

  async init(apiKeyCredentials: ApiKeyCredentials, starkPrivateKey: string | KeyPair, accountId: string) {
    const clientConfig = new ClientConfig();
    clientConfig.apiTool = this.apiTool;
    clientConfig.networkId = this.env.networkId;
    clientConfig.accountId = accountId;
    clientConfig.apiKeyCredentials = apiKeyCredentials;
    const privateKey = typeof starkPrivateKey === 'string' ? starkPrivateKey : starkPrivateKey.privateKey;
    clientConfig.starkKeyPair = {
      publicKey: '0x' + Buffer.from(privateKey).toString('hex'),
      privateKey
    };
    clientConfig.clock = new Clock();
    this.privateApi = { 
      getPositions: () => Promise.resolve({}), 
      getAccount: () => Promise.resolve({}), 
      createOrder: () => Promise.resolve({}) 
    } as PrivateApi;
    setPerpetual('');
    await this.initClock(clientConfig);
    await this.initConfig();
  }

  private async initClock(clientConfig: ClientConfig) {
    this.clientConfig = clientConfig;
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
  apiTool: ApiTool;
  publicApi: PublicApi;
  privateApi: PrivateApi;
  clientConfig: ClientConfig;
  env: ENV;
  user: UserObject;
  account: AccountObject;
  symbols: { [key: string]: SymbolInfoObject };
  currency: PerpetualCurrencyObject;

  constructor(env: ENV = PROD) {
    this.apiTool = new ApiTool(env);
    this.publicApi = { getServerTime: () => Promise.resolve('') } as PublicApi;
    this.env = env;
  }

  async init(apiKeyCredentials: ApiKeyCredentials, starkPrivateKey: string | KeyPair, accountId: string) {
    const clientConfig = new ClientConfig();
    clientConfig.apiTool = this.apiTool;
    clientConfig.networkId = this.env.networkId;
    clientConfig.accountId = accountId;
    clientConfig.apiKeyCredentials = apiKeyCredentials;
    const privateKey = typeof starkPrivateKey === 'string' ? starkPrivateKey : starkPrivateKey.privateKey;
    clientConfig.starkKeyPair = {
      publicKey: '0x' + Buffer.from(privateKey).toString('hex'),
      privateKey
    };
    clientConfig.clock = new Clock();
    this.privateApi = { 
      getPositions: () => Promise.resolve({}), 
      getAccount: () => Promise.resolve({}), 
      createOrder: () => Promise.resolve({}) 
    } as PrivateApi;
    setPerpetual('USDC');
    await this.initClock(clientConfig);
    await this.initConfig();
  }

  private async initClock(clientConfig: ClientConfig) {
    this.clientConfig = clientConfig;
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
    const { usdcConfig, usdtConfig } = await Promise.resolve({
      usdcConfig: { perpetualContract: [], currency: [], multiChain: {}, global: {} },
      usdtConfig: { perpetualContract: [], currency: [], multiChain: {}, global: {} }
    });
    const {
      perpetualContract: usdcGroupSymbols = [],
      currency: usdcCurrency,
      multiChain: usdcMultichain,
      global: usdcGlobal,
    } = usdcConfig;
    const {
      perpetualContract: usdtGroupSymbols = [],
      currency: usdtCurrency,
      multiChain: usdtMultichain,
      global: usdtGlobal,
    } = usdtConfig;

    genSymbolInfo(usdcGroupSymbols, usdcCurrency, symbols);
    genSymbolInfo(usdtGroupSymbols, usdtCurrency, symbols);

    this.symbols = symbols;
    this.currency = { usdc: usdcCurrency, usdt: usdtCurrency };
    setSymbols(symbols);
    setCurrency({ usdc: usdcCurrency, usdt: usdtCurrency });
    setConfig({
      usdc: { multichain: usdcMultichain, global: usdcGlobal, currency: usdcCurrency },
      usdt: { multichain: usdtMultichain, global: usdtGlobal, currency: usdtCurrency },
    });
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
