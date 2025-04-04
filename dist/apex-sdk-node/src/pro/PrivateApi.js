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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateApi = void 0;
const starkex_lib_1 = require("./starkex-lib");
const crypto_js_1 = __importDefault(require("crypto-js"));
const apexpro_1 = require("./apexpro");
const qs_1 = __importDefault(require("qs"));
class PrivateApi {
    constructor(clientConfig) {
        this.clientConfig = clientConfig;
    }
    request(path_1, method_1) {
        return __awaiter(this, arguments, void 0, function* (path, method, data = {}, config = {
            headers: {},
            form: true,
        }) {
            let params = qs_1.default.stringify(data, {
                filter(prefix, value) {
                    if (value) {
                        return value;
                    }
                    return;
                },
                sort(a, b) {
                    return a.localeCompare(b);
                },
            });
            if (['get', 'delete'].indexOf(method.toLowerCase()) >= 0) {
                if (Object.keys(data).length > 0) {
                    if (params) {
                        path = path + '?' + params;
                    }
                    params = '';
                }
            }
            const isoTimestamp = this.clientConfig.clock.getAdjustedIsoString();
            const headers = {
                'APEX-SIGNATURE': this.sign(path, method, isoTimestamp, params),
                'APEX-API-KEY': this.clientConfig.apiKeyCredentials.key,
                'APEX-TIMESTAMP': new Date(isoTimestamp).getTime(),
                'APEX-PASSPHRASE': this.clientConfig.apiKeyCredentials.passphrase,
            };
            config.headers = Object.assign(Object.assign({}, config.headers), headers);
            return this.clientConfig.apiTool.apiRequest(path, method, params, config);
        });
    }
    sign(requestPath, method, isoTimestamp, params) {
        const messageString = new Date(isoTimestamp).getTime() + method.toUpperCase() + requestPath + ((0, apexpro_1.isNullOrBlank)(params) ? '' : params);
        apexpro_1.Trace.print(messageString);
        const key = Buffer.from(this.clientConfig.apiKeyCredentials.secret).toString('base64');
        const hash = crypto_js_1.default.HmacSHA256(messageString, key);
        return hash.toString(crypto_js_1.default.enc.Base64);
    }
    getSignature(signature, signatureFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            if (signature) {
                return signature;
            }
            if (!this.clientConfig.starkKeyPair) {
                throw new apexpro_1.BasicException('StarkKeyPair Uninitialized');
            }
            return yield signatureFunc();
        });
    }
    /**
     * GET Retrieve User Data
     * @see https://api-docs.pro.apex.exchange/#privateapi-get-retrieve-user-data
     */
    user() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/user', 'get');
        });
    }
    /**
     * GET Retrieve User Account Data
     * @see https://api-docs.pro.apex.exchange/#privateapi-get-retrieve-user-data
     * @param id  accountId
     * @param ethereumAddress ethereumAddress
     * @returns promise
     */
    getAccount(id, ethereumAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/account', 'get', {
                id,
                ethereumAddress,
            });
        });
    }
    getAccountV2(id, ethereumAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/account', 'get', {
                id,
                ethereumAddress,
            });
        });
    }
    /**
     * GET Trade History
     * @see https://api-docs.pro.apex.exchange/#privateapi-get-trade-history
     * @param symbol
     * @param status
     * @param side 'BUY' | 'SELL'
     * @param limit default at 100
     * @param beginTimeInclusive Start time
     * @param endTimeExclusive End time
     * @param page Page numbers start from 0
     * @param orderType "ACTIVE","CONDITION","HISTORY"
     */
    tradeHistory(symbol, status, side, limit, beginTimeInclusive, endTimeExclusive, page, orderType) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/fills', 'get', {
                symbol,
                status,
                side,
                limit,
                beginTimeInclusive,
                endTimeExclusive,
                page,
                orderType,
            });
        });
    }
    tradeHistoryV2(token, symbol, status, side, limit, beginTimeInclusive, endTimeExclusive, page, orderType) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/fills', 'get', {
                token,
                symbol,
                status,
                side,
                limit,
                beginTimeInclusive,
                endTimeExclusive,
                page,
                orderType,
            });
        });
    }
    /**
     * GET Worst Price
     * @see https://api-docs.pro.apex.exchange/#privateapi-get-worst-price
     * @param symbol Symbol
     * @param size Order open size
     * @param side BUY or SELL order
     */
    getWorstPrice(symbol, size, side) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/get-worst-price', 'get', {
                symbol,
                size,
                side,
            });
        });
    }
    getWorstPriceV2(symbol, size, side) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/get-worst-price', 'get', {
                symbol,
                size,
                side,
            });
        });
    }
    /**
     * POST Creating Orders
     * @see https://api-docs.pro.apex.exchange/#privateapi-post-creating-orders
     * @param clientOrderId Randomized client id
     * @param positionId
     * @param symbol Symbol
     * @param side BUY or SELL
     * @param type  "LIMIT", "MARKET","STOP_LIMIT", "STOP_MARKET", "TAKE_PROFIT_LIMIT", "TAKE_PROFIT_MARKET"
     * @param size Size
     * @param price Price
     * @param limitFee  limitFee = price * size * takerFeeRate  ( from GET /v1/account)
     * @param timeInForce "GOOD_TIL_CANCEL", "FILL_OR_KILL", "IMMEDIATE_OR_CANCEL", "POST_ONLY"
     * @param triggerPrice Trigger price
     * @param trailingPercent Conditional order trailing-stop
     * @param reduceOnly Reduce-only
     */
    createOrder(clientOrderId, positionId, symbol, side, type, size, price, limitFee, timeInForce, triggerPrice, trailingPercent, reduceOnly, brokerId) {
        return __awaiter(this, void 0, void 0, function* () {
            clientOrderId = clientOrderId || (0, apexpro_1.generateRandomClientId)();
            const expirationIsoTimestamp = (Date.now() + 30 * 24 * 60 * 60 * 1000);
            const signature = yield this.getSignature('', () => {
                const orderToSign = {
                    humanSize: `${Number(size)}`,
                    humanPrice: price,
                    limitFee,
                    symbol,
                    side: side === 'BUY' ? apexpro_1.OrderSide.BUY : apexpro_1.OrderSide.SELL,
                    expirationIsoTimestamp,
                    clientId: clientOrderId,
                    positionId,
                };
                const starkOrder = starkex_lib_1.SignableOrder.fromOrder(orderToSign, this.clientConfig.networkId);
                return starkOrder.sign(this.clientConfig.starkKeyPair);
            });
            const order = {
                clientId: clientOrderId,
                expiration: (0, starkex_lib_1.addOrderExpirationBufferHours)((0, starkex_lib_1.isoTimestampToEpochHours)(expirationIsoTimestamp)) * 60 * 60 * 1000,
                limitFee,
                price,
                reduceOnly,
                side,
                signature,
                size,
                symbol,
                clientOrderId,
                timeInForce,
                triggerPrice,
                trailingPercent,
                type,
                brokerId
            };
            return this.request('/api/v1/create-order', 'post', order);
        });
    }
    createOrderV2(clientOrderId, positionId, symbol, side, type, size, price, limitFee, timeInForce, triggerPrice, trailingPercent, reduceOnly, brokerId) {
        return __awaiter(this, void 0, void 0, function* () {
            clientOrderId = clientOrderId || (0, apexpro_1.generateRandomClientId)();
            const expirationIsoTimestamp = (Date.now() + 30 * 24 * 60 * 60 * 1000);
            const signature = yield this.getSignature('', () => {
                const orderToSign = {
                    humanSize: `${Number(size)}`,
                    humanPrice: price,
                    limitFee,
                    symbol,
                    side: side === 'BUY' ? apexpro_1.OrderSide.BUY : apexpro_1.OrderSide.SELL,
                    expirationIsoTimestamp,
                    clientId: clientOrderId,
                    positionId,
                };
                const starkOrder = starkex_lib_1.SignableOrder.fromOrder(orderToSign, this.clientConfig.networkId);
                return starkOrder.sign(this.clientConfig.starkKeyPair);
            });
            const order = {
                clientId: clientOrderId,
                expiration: (0, starkex_lib_1.addOrderExpirationBufferHours)((0, starkex_lib_1.isoTimestampToEpochHours)(expirationIsoTimestamp)) * 60 * 60 * 1000,
                limitFee,
                price,
                reduceOnly,
                side,
                signature,
                size,
                symbol,
                clientOrderId,
                timeInForce,
                triggerPrice,
                trailingPercent,
                type,
                brokerId
            };
            return this.request('/api/v2/create-order', 'post', order);
        });
    }
    /**
     * POST Cancel Order
     * @see https://api-docs.pro.apex.exchange/#privateapi-post-cancel-order
     * @param id of the order being canceled
     */
    cancelOrder(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/delete-order', 'post', {
                id,
            });
        });
    }
    cancelOrderV2(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/delete-order', 'post', {
                id,
            });
        });
    }
    /**
     * Cancel Order By ClientOrderId
     * @see https://api-docs.pro.apex.exchange/#privateapi-post-cancel-order-by-clientorderid
     * @param id of the order being canceled
     */
    cancelOrderByClientOrderId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/delete-client-order-id', 'post', {
                id,
            });
        });
    }
    cancelOrderByClientOrderIdV2(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/delete-client-order-id', 'post', {
                id,
            });
        });
    }
    /**
     * POST Cancel all Open Orders
     * @see https://api-docs.pro.apex.exchange/#privateapi-post-cancel-all-open-orders
     * @param symbol "BTC-USDC,ETH-USDC", Cancel all orders if none
     */
    cancelAllOrder(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/delete-open-orders', 'post', {
                symbol,
            });
        });
    }
    cancelAllOrderV2(token, symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/delete-open-orders', 'post', {
                token,
                symbol,
            });
        });
    }
    /**
     * GET Open Orders
     * @see https://api-docs.pro.apex.exchange/#privateapi-get-open-orders
     */
    openOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/open-orders', 'get', {});
        });
    }
    openOrdersV2(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/open-orders', 'get', { token });
        });
    }
    /**
     * GET Order ID
     * @see https://api-docs.pro.apex.exchange/#privateapi-get-order-id
     * @param id
     */
    getOrder(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/get-order', 'get', { id });
        });
    }
    getOrderV2(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/get-order', 'get', { id });
        });
    }
    /**
     * GET Order by clientOrderId
     * @see https://api-docs.pro.apex.exchange/#privateapi-get-order-by-clientorderid
     * @param id
     */
    getOrderByClientOrderId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/order-by-client-order-id', 'get', { id });
        });
    }
    /**
     * GET All Order History
     * @see https://api-docs.pro.apex.exchange/#privateapi-get-all-order-history
     * @param symbol
     * @param status
     * @param side 'BUY' | 'SELL'
     * @param limit default at 100
     * @param beginTimeInclusive Start time
     * @param endTimeExclusive End time
     * @param page Page numbers start from 0
     * @param orderType "ACTIVE","CONDITION","HISTORY"
     */
    historyOrders(symbol, status, side, limit, beginTimeInclusive, endTimeExclusive, page, orderType) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/history-orders', 'get', {
                symbol,
                status,
                side,
                limit,
                beginTimeInclusive,
                endTimeExclusive,
                page,
                orderType,
            });
        });
    }
    historyOrdersV2(token, symbol, status, side, limit, beginTimeInclusive, endTimeExclusive, page, orderType) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/history-orders', 'get', {
                token,
                symbol,
                status,
                side,
                limit,
                beginTimeInclusive,
                endTimeExclusive,
                page,
                orderType,
            });
        });
    }
    /**
     * GET Funding Rate
     * @see https://api-docs.pro.apex.exchange/#privateapi-get-funding-rate
     * @param symbol
     * @param limit default at 100
     * @param page Page numbers start from 0
     * @param beginTimeInclusive Start time
     * @param endTimeExclusive End time
     * @param side 'BUY' | 'SELL'
     * @param status
     */
    fundingRate(symbol, limit, page, beginTimeInclusive, endTimeExclusive, side, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/funding', 'get', {
                symbol,
                limit,
                page,
                beginTimeInclusive,
                endTimeExclusive,
                side,
                status,
            });
        });
    }
    fundingRateV2(token, symbol, limit, page, beginTimeInclusive, endTimeExclusive, side, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/funding', 'get', {
                token,
                symbol,
                limit,
                page,
                beginTimeInclusive,
                endTimeExclusive,
                side,
                status,
            });
        });
    }
    /**
     * GET User Historial Profit and Loss
     * @see https://api-docs.pro.apex.exchange/#privateapi-get-user-historial-profit-and-loss
     * @param beginTimeInclusive Start time
     * @param endTimeExclusive End time
     * @param type Position type
     * @param symbol Symbol
     * @param page Page numbers start from 0
     * @param limit Default at 100
     */
    historicalPNL(beginTimeInclusive, endTimeExclusive, type, symbol, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/historical-pnl', 'get', {
                beginTimeInclusive,
                endTimeExclusive,
                type,
                symbol,
                page,
                limit,
            });
        });
    }
    historicalPNLV2(token, beginTimeInclusive, endTimeExclusive, type, symbol, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/historical-pnl', 'get', {
                token,
                beginTimeInclusive,
                endTimeExclusive,
                type,
                symbol,
                page,
                limit,
            });
        });
    }
    /**
     * GET Yesterday's Profit & Loss
     * @see https://api-docs.pro.apex.exchange/#privateapi-get-yesterday-39-s-profit-amp-loss
     */
    yesterdayPNL() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/yesterday-pnl', 'get', {});
        });
    }
    yesterdayPNLV2(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/yesterday-pnl', 'get', { token });
        });
    }
    /**
     * POST Sets the initial margin rate of a contract
     * @see https://api-docs.pro.apex.exchange/#privateapi-post-sets-the-initial-margin-rate-of-a-contract
     * @param symbol
     * @param initialMarginRate
     */
    setInitialMarginRate(symbol, initialMarginRate) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/set-initial-margin-rate', 'post', {
                symbol,
                initialMarginRate,
            });
        });
    }
    setInitialMarginRateV2(symbol, initialMarginRate) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/set-initial-margin-rate', 'post', {
                symbol,
                initialMarginRate,
            });
        });
    }
    /**
     * GET Account Balance
     */
    accountBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v1/account-balance', 'get', {});
        });
    }
    accountBalanceV2() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/api/v2/account-balance', 'get', {});
        });
    }
}
exports.PrivateApi = PrivateApi;
