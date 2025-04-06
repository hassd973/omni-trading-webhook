import lodash from 'lodash';
import { BasicException } from './BasicException';
export const SLEEP_MS = 1000;
/**
 * @param ms
 */
export const sleep = async (ms) => {
    return await new Promise((resolve) => setTimeout(() => {
        resolve(1);
    }, ms));
};
/**
 * @param value
 */
export const isNullOrBlank = (value) => {
    return !value || value === undefined || value === '' || value.length === 0;
};
/**
 * @param func
 * @param retryCount
 * @param sleepMS
 */
export const retry = async (func, retryCount = 3, sleepMS = SLEEP_MS) => {
    let count = retryCount;
    do {
        try {
            return await func();
        }
        catch (e) {
            if (count > 0) {
                count--;
            }
            if (count <= 0) {
                throw new BasicException(e.toString(), e);
            }
            Trace.print('retry', e);
            await sleep(sleepMS);
        }
    } while (true);
};
export function getDefaultValue(obj, path, defaultValue) {
    return lodash.get(obj, path, defaultValue) || defaultValue;
}
export function generateRandomClientId() {
    return Math.random().toString().slice(2).replace(/^0+/, '');
}
export function getPrecision(num) {
    const val = Number(num);
    if (isNaN(val)) {
        return 0;
    }
    const strList = String(num).split('.');
    return strList.length === 2 ? strList[1].length : 0;
}
function getRandomString(length = 16, type = 'D') {
    const nonZeroNum = '123456789';
    const hexString = 'abcdef';
    const firstCharSource = type === 'hex' ? `${nonZeroNum}${hexString}` : nonZeroNum;
    const otherCharSource = type === 'hex' ? `0${nonZeroNum}${hexString}` : `0${nonZeroNum}`;
    const count = type === 'hex' ? 15 : 9;
    let result = firstCharSource[Math.floor(Math.random() * count)];
    for (let i = 1; i < length; i++) {
        result += otherCharSource[Math.floor(Math.random() * (count + 1))];
    }
    return result;
}
export function generateRandomClientIdOmni(_accountId) {
    const accountId = _accountId || getRandomString(24);
    return `apexomni-${accountId}-${Date.now()}-${getRandomString(6)}`;
}
export const removePrefix = (v, prefix = '0x') => {
    if (!v)
        return v;
    return v?.replace(prefix, '');
};
export function getSymbolsWithBaseInfo(contract, assets, tokens, contractType) {
    const symbols = {};
    if (contract.length) {
        contract.forEach((obj, idx) => {
            const symbolInfo = {
                ...obj,
            };
            symbolInfo.rankIdx = idx;
            symbolInfo.pricePrecision = getPrecision(obj.tickSize);
            symbolInfo.priceStep = obj.tickSize;
            symbolInfo.sizePrecision = getPrecision(obj.stepSize);
            symbolInfo.sizeStep = obj.stepSize;
            symbolInfo.baseCoin = obj.settleAssetId;
            symbolInfo.currentCoin = obj.baseTokenId;
            const baseCoinInfo = assets.find((item) => item.token === symbolInfo.baseCoin) || {};
            const currentCoinInfo = tokens.find((item) => item.token === symbolInfo.currentCoin) || {};
            symbolInfo.baseCoinPrecision = Math.abs(Math.log10(baseCoinInfo.showStep || 1));
            symbolInfo.baseCoinRealPrecision = Math.abs(Math.log10(baseCoinInfo.showStep || 1));
            symbolInfo.currentCoinPrecision = Math.abs(Math.log10(currentCoinInfo.stepSize || 1));
            symbolInfo.tokenAssetId = baseCoinInfo.tokenId;
            symbolInfo.baseCoinIcon = baseCoinInfo.iconUrl;
            symbolInfo.currentCoinIcon = currentCoinInfo.iconUrl;
            symbolInfo.defaultInitialMarginRate = Number(symbolInfo.defaultInitialMarginRate) || 0;
            // tradeAll - 可以开可平；tradeNone - 不可交易；tradeClose - 仅可平仓
            symbolInfo.tradeStatus = symbolInfo.enableTrade
                ? symbolInfo.enableOpenPosition
                    ? 'tradeAll'
                    : 'tradeClose'
                : 'tradeNone';
            if (contractType) {
                symbolInfo.contractType = contractType;
            }
            symbols[obj.symbol] = symbolInfo;
        });
    }
    return symbols;
}
export class TraceTool {
    constructor() {
        this.logShow = true;
        this.errorShow = true;
        this.debugShow = true;
    }
    setLogShow(b) {
        this.logShow = b;
    }
    setErrorShow(b) {
        this.errorShow = b;
    }
    setDebugShow(b) {
        this.debugShow = b;
    }
    log(...args) {
        // tslint:disable-next-line:no-console
        console.log(...args);
    }
    print(...args) {
        if (this.logShow) {
            this.log(...args);
        }
    }
    error(...args) {
        if (this.errorShow) {
            this.log(...args);
        }
    }
    debug(...args) {
        if (this.debugShow) {
            this.log(...args);
        }
    }
}
export const Trace = new TraceTool();
