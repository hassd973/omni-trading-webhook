import { ClientConfig, PROD } from './Constant.js';
import { asEcKeyPair, asSimpleKeyPair, setConfig, setConfigV2, setCurrency, setCurrencyV2, setPerpetual, setSymbols, setSymbolsV2 } from './starkex-lib/index.js';
import { ApiTool, Clock, getPrecision, } from './apexpro/index.js';
const genSymbolInfo = (groupSymbols, currency, symbols) => {
    if (groupSymbols.length) {
        groupSymbols.forEach((obj, idx) => {
            const symbolInfo = { ...obj, info: {} };
            symbolInfo.rankIdx = idx;
            symbolInfo.pricePrecision = getPrecision(obj.tickSize);
            symbolInfo.priceStep = Number(obj.tickSize);
            symbolInfo.sizePrecision = getPrecision(obj.stepSize);
            symbolInfo.sizeStep = Number(obj.stepSize);
            symbolInfo.baseCoin = obj.settleCurrencyId;
            symbolInfo.currentCoin = obj.underlyingCurrencyId;
            const baseCoinInfo = currency.find((item) => item.id === symbolInfo.baseCoin) || {};
            const currentCoinInfo = currency.find((item) => item.id === symbolInfo.currentCoin) || {};
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
    constructor(env = PROD) {
        this.apiTool = new ApiTool(env);
        this.publicApi = { getServerTime: () => Promise.resolve('') }; // Placeholder
        this.env = env;
    }
    async init(apiKeyCredentials, starkPrivateKey, accountId) {
        const clientConfig = new ClientConfig();
        clientConfig.apiTool = this.apiTool;
        clientConfig.networkId = this.env.networkId;
        clientConfig.accountId = accountId;
        clientConfig.apiKeyCredentials = apiKeyCredentials;
        clientConfig.starkKeyPair = asSimpleKeyPair(asEcKeyPair(starkPrivateKey));
        clientConfig.clock = new Clock();
        this.privateApi = {
            getPositions: () => Promise.resolve({}),
            getAccount: () => Promise.resolve({}),
            createOrder: () => Promise.resolve({})
        }; // Placeholder
        setPerpetual('');
        await this.initClock(clientConfig);
        await this.initConfig();
    }
    async initClock(clientConfig) {
        this.clientConfig = clientConfig;
        const { time } = await this.publicApi.getServerTime().then(() => ({ time: new Date().getTime() }));
        this.clientConfig.clock.setTimestampAdjustment(time - new Date().getTime());
    }
    async initConfig() {
        this.user = await this.privateApi.getAccount(this.clientConfig.accountId, '').then(() => ({})); // Placeholder
        this.account = await this.privateApi.getAccount(this.clientConfig.accountId, this.user.ethereumAddress || '');
        this.checkAccountId();
        this.checkStarkKey();
        await this.initSymbol();
    }
    async initSymbol() {
        const symbols = {};
        const { perpetualContract: groupSymbols = [], currency, multiChain, global } = await Promise.resolve({
            perpetualContract: [],
            currency: [],
            multiChain: {},
            global: {}
        }); // Placeholder
        genSymbolInfo(groupSymbols, currency, symbols);
        this.symbols = symbols;
        this.currency = currency;
        setSymbols(symbols);
        setCurrency(currency);
        setConfig({ multiChain, global, currency });
    }
    checkAccountId() {
        if (this.account.id !== this.clientConfig.accountId) {
            throw new Error('Account Id does not match, please check your account id.');
        }
    }
    checkStarkKey() {
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
    constructor(env = PROD) {
        this.apiTool = new ApiTool(env);
        this.publicApi = { getServerTime: () => Promise.resolve('') };
        this.env = env;
    }
    async init(apiKeyCredentials, starkPrivateKey, accountId) {
        const clientConfig = new ClientConfig();
        clientConfig.apiTool = this.apiTool;
        clientConfig.networkId = this.env.networkId;
        clientConfig.accountId = accountId;
        clientConfig.apiKeyCredentials = apiKeyCredentials;
        clientConfig.starkKeyPair = asSimpleKeyPair(asEcKeyPair(starkPrivateKey));
        clientConfig.clock = new Clock();
        this.privateApi = {
            getPositions: () => Promise.resolve({}),
            getAccount: () => Promise.resolve({}),
            createOrder: () => Promise.resolve({})
        };
        setPerpetual('USDC');
        await this.initClock(clientConfig);
        await this.initConfig();
    }
    async initClock(clientConfig) {
        this.clientConfig = clientConfig;
        const { time } = await this.publicApi.getServerTime().then(() => ({ time: new Date().getTime() }));
        this.clientConfig.clock.setTimestampAdjustment(time - new Date().getTime());
    }
    async initConfig() {
        this.user = await this.privateApi.getAccount(this.clientConfig.accountId, '').then(() => ({}));
        this.account = await this.privateApi.getAccount(this.clientConfig.accountId, this.user.ethereumAddress || '');
        this.checkAccountId();
        this.checkStarkKey();
        await this.initSymbol();
    }
    async initSymbol() {
        const symbols = {};
        const { usdcConfig, usdtConfig } = await Promise.resolve({
            usdcConfig: { perpetualContract: [], currency: [], multiChain: {}, global: {} },
            usdtConfig: { perpetualContract: [], currency: [], multiChain: {}, global: {} }
        }); // Placeholder
        const { perpetualContract: usdcGroupSymbols = [], currency: usdcCurrency, multiChain: usdcMultichain, global: usdcGlobal, } = usdcConfig;
        const { perpetualContract: usdtGroupSymbols = [], currency: usdtCurrency, multiChain: usdtMultichain, global: usdtGlobal, } = usdtConfig;
        genSymbolInfo(usdcGroupSymbols, usdcCurrency, symbols);
        genSymbolInfo(usdtGroupSymbols, usdtCurrency, symbols);
        this.symbols = symbols;
        this.currency = { usdc: usdcCurrency, usdt: usdtCurrency };
        setSymbolsV2(symbols);
        setCurrencyV2({ usdc: usdcCurrency, usdt: usdtCurrency });
        setConfigV2({
            usdc: { multichain: usdcMultichain, global: usdcGlobal, currency: usdcCurrency },
            usdt: { multichain: usdtMultichain, global: usdtGlobal, currency: usdtCurrency },
        });
    }
    checkAccountId() {
        if (this.account.id !== this.clientConfig.accountId) {
            throw new Error('Account Id does not match, please check your account id.');
        }
    }
    checkStarkKey() {
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
