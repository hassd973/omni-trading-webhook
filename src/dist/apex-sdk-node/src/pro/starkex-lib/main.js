export var ApexAsset;
(function (ApexAsset) {
    ApexAsset["USDC"] = "USDC";
    ApexAsset["USDT"] = "USDT";
    ApexAsset["BTC"] = "BTC";
    ApexAsset["ETH"] = "ETH";
    ApexAsset["LINK"] = "LINK";
    ApexAsset["AAVE"] = "AAVE";
    ApexAsset["UNI"] = "UNI";
    ApexAsset["SUSHI"] = "SUSHI";
    ApexAsset["SOL"] = "SOL";
    ApexAsset["YFI"] = "YFI";
    ApexAsset["ONEINCH"] = "1INCH";
    ApexAsset["AVAX"] = "AVAX";
    ApexAsset["SNX"] = "SNX";
    ApexAsset["CRV"] = "CRV";
    ApexAsset["UMA"] = "UMA";
    ApexAsset["DOT"] = "DOT";
    ApexAsset["DOGE"] = "DOGE";
    ApexAsset["MATIC"] = "MATIC";
    ApexAsset["MKR"] = "MKR";
    ApexAsset["FIL"] = "FIL";
    ApexAsset["ADA"] = "ADA";
    ApexAsset["ATOM"] = "ATOM";
    ApexAsset["COMP"] = "COMP";
    ApexAsset["BCH"] = "BCH";
    ApexAsset["LTC"] = "LTC";
    ApexAsset["EOS"] = "EOS";
    ApexAsset["ALGO"] = "ALGO";
    ApexAsset["ZRX"] = "ZRX";
    ApexAsset["XMR"] = "XMR";
    ApexAsset["ZEC"] = "ZEC";
    ApexAsset["ENJ"] = "ENJ";
    ApexAsset["ETC"] = "ETC";
    ApexAsset["XLM"] = "XLM";
    ApexAsset["TRX"] = "TRX";
    ApexAsset["XTZ"] = "XTZ";
    ApexAsset["HNT"] = "HNT";
})(ApexAsset || (ApexAsset = {}));
export var OrderSide;
(function (OrderSide) {
    OrderSide["BUY"] = "BUY";
    OrderSide["SELL"] = "SELL";
})(OrderSide || (OrderSide = {}));
export var WalletWay;
(function (WalletWay) {
    WalletWay["MetaMask"] = "injected";
    WalletWay["CoinbaseWallet"] = "coinbaseWallet";
    WalletWay["Walletconnect"] = "walletConnect";
})(WalletWay || (WalletWay = {}));
// V1
// 币对信息
let symbols = [];
const setSymbols = (data) => {
    symbols = data;
};
const getSymbols = () => {
    return symbols;
};
// 价值信息
let currency = [];
const setCurrency = (data) => {
    currency = data;
};
const getCurrency = () => {
    return currency;
};
// config
let config = {};
const setConfig = (data) => {
    config = data;
};
const getConfig = () => {
    return config;
};
// V2
// 合约对信息
let perpetual = '';
const setPerpetual = (data) => {
    perpetual = data;
};
const getPerpetual = () => {
    return perpetual;
};
// 币对信息
let symbolsV2 = [];
const setSymbolsV2 = (data) => {
    symbols = data;
};
const getSymbolsV2 = () => {
    return symbols;
};
// 价值信息
let currencyV2 = { usdc: [], usdt: [] };
const setUSDCCurrency = (data) => {
    currencyV2.usdc = data;
};
const getUSDCCurrency = () => {
    return currencyV2?.usdc;
};
const setUSDTCurrency = (data) => {
    currencyV2.usdt = data;
};
const getUSDTCurrency = () => {
    return currencyV2?.usdt;
};
const setCurrencyV2 = (data) => {
    currencyV2 = data;
};
const getCurrencyV2 = () => {
    const currentPerpetual = getPerpetual()?.toLowerCase?.();
    if (currentPerpetual) {
        return currencyV2?.[currentPerpetual];
    }
    return currencyV2;
};
// config
let configV2 = { usdc: {}, usdt: {} };
const setUSDCConfig = (data) => {
    configV2.usdc = data;
};
const getUSDCConfig = () => {
    return configV2?.usdc;
};
const setUSDTConfig = (data) => {
    configV2.usdt = data;
};
const getUSDTConfig = () => {
    return configV2?.usdt;
};
const setConfigV2 = (data) => {
    configV2 = data;
};
const getConfigV2 = () => {
    const currentPerpetual = getPerpetual()?.toLowerCase?.();
    if (currentPerpetual) {
        return configV2?.[currentPerpetual];
    }
    return configV2;
};
export { setUSDCConfig, getUSDCConfig, setUSDTConfig, getUSDTConfig, setUSDCCurrency, getUSDCCurrency, setUSDTCurrency, getUSDTCurrency, setPerpetual, getPerpetual, setSymbols, getSymbols, setCurrency, getCurrency, setConfig, getConfig, setSymbolsV2, getSymbolsV2, setCurrencyV2, getCurrencyV2, setConfigV2, getConfigV2, };
