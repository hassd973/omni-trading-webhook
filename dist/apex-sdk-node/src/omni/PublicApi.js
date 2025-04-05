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
    time() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v3/time', 'get');
        });
    }
    symbols() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v3/symbols', 'get');
        });
    }
    depth(symbol_1) {
        return __awaiter(this, arguments, void 0, function* (symbol, limit = 100) {
            return this.apiTool.apiRequest('/api/v3/depth', 'get', {
                symbol,
                limit,
            });
        });
    }
    trades(symbol, limit, from) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v3/trades', 'get', {
                symbol,
                limit,
                from,
            });
        });
    }
    klines(symbol, interval, start, end, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v3/klines', 'get', {
                symbol,
                interval,
                start,
                end,
                limit,
            });
        });
    }
    tickers(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v3/ticker', 'get', { symbol });
        });
    }
    historyFunding(symbol, limit, beginTimeInclusive, endTimeExclusive, page) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v3/history-funding', 'get', {
                symbol,
                page,
                beginTimeInclusive,
                endTimeExclusive,
                limit,
            });
        });
    }
    checkUserExist(ethAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.apiTool.apiRequest('/api/v3/check-user-exist', 'get', {
                ethAddress,
            });
        });
    }
}
exports.PublicApi = PublicApi;
