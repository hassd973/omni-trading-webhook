"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicApi = void 0;
class PublicApi {
    constructor(apiTool) {
        this.apiTool = apiTool;
    }
    /**
     * GET System Time
     * @see https://api-docs.pro.apex.exchange/#publicapi-get-system-time
     */
    time() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v1/time', 'get');
        });
    }
    /**
     * GET All Config Data
     * @see https://api-docs.pro.apex.exchange/#publicapi-get-all-config-data
     */
    symbols() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v1/symbols', 'get');
        });
    }
    symbolsV2() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v2/symbols', 'get');
        });
    }
    /**
     * GET Market Depth
     * @see https://api-docs.pro.apex.exchange/#publicapi-get-market-depth
     * @param symbol use crossSymbolName responded from All Config Data
     * @param limit  Default at 100
     */
    depth(symbol_1) {
        return __awaiter(this, arguments, void 0, function* (symbol, limit = 100) {
            return this.apiTool.apiRequest('/api/v1/depth', 'get', {
                symbol,
                limit,
            });
        });
    }
    /**
     * GET Newest Trading Data
     * @see https://api-docs.pro.apex.exchange/#publicapi-get-newest-trading-data
     * @param symbol use crossSymbolName responded from All Config Data
     * @param limit Limit
     * @param from  Return to latest data as default
     */
    trades(symbol, limit, from) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v1/trades', 'get', {
                symbol,
                limit,
                from,
            });
        });
    }
    /**
     * GET Candlestick Chart Data
     * @see https://api-docs.pro.apex.exchange/#publicapi-get-candlestick-chart-data
     * @param symbol use crossSymbolName responded from All Config Data
     * @param interval Candlestick chart time indicators: Numbers represent minutes, D for Days, M for Month and W for Week — 1 5 15 30 60 120 240 360 720 "D" "M" "W"
     * @param start Start time
     * @param end End time
     * @param limit Limit
     */
    klines(symbol, interval, start, end, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v1/klines', 'get', {
                symbol,
                interval,
                start,
                end,
                limit,
            });
        });
    }
    /**
     * GET Ticker Data
     * @see https://api-docs.pro.apex.exchange/#publicapi-get-ticker-data
     * @param symbol use crossSymbolName responded from All Config Data
     */
    tickers(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v1/ticker', 'get', { symbol });
        });
    }
    /**
     * GET Funding Rate History
     * @see https://api-docs.pro.apex.exchange/#publicapi-get-funding-rate-history
     * @param symbol use crossSymbolName responded from All Config Data
     * @param limit Default at 100
     * @param beginTimeInclusive 	Start time
     * @param endTimeExclusive End time
     * @param page Page numbers start from 0
     */
    historyFunding(symbol, limit, beginTimeInclusive, endTimeExclusive, page) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v1/history-funding', 'get', {
                symbol,
                page,
                beginTimeInclusive,
                endTimeExclusive,
                limit,
            });
        });
    }
    historyFundingV2(symbol, limit, beginTimeInclusive, endTimeExclusive, page) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v2/history-funding', 'get', {
                symbol,
                page,
                beginTimeInclusive,
                endTimeExclusive,
                limit,
            });
        });
    }
    /**
     * GET Check If User Exists
     * @see https://api-docs.pro.apex.exchange/#publicapi-get-check-if-user-exists
     * @param ethAddress 0x111111
     */
    checkUserExist(ethAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v1/check-user-exist', 'get', {
                ethAddress,
            });
        });
    }
}
exports.PublicApi = PublicApi;
