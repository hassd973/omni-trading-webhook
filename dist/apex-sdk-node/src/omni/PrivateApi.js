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
const qs_1 = __importDefault(require("qs"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const Tool_1 = require("./tool/Tool");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const zklink_sdk_node_1 = require("../packages/node-dist/zklink-sdk-node");
const viem_1 = require("viem");
class PrivateApi {
    constructor(clientConfig) {
        this.clientConfig = clientConfig;
        this.version = 'v3';
    }
    updateVersion(version) {
        this.version = version;
    }
    request(_path_1, method_1) {
        return __awaiter(this, arguments, void 0, function* (_path, method, data = {}, config = {
            headers: {},
            form: true,
        }) {
            let path = _path.startsWith('/api') ? _path : `/api/${this.version}` + _path;
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
        const messageString = new Date(isoTimestamp).getTime() + method.toUpperCase() + requestPath + ((0, Tool_1.isNullOrBlank)(params) ? '' : params);
        const key = Buffer.from(this.clientConfig.apiKeyCredentials.secret).toString('base64');
        const hash = crypto_js_1.default.HmacSHA256(messageString, key);
        return hash.toString(crypto_js_1.default.enc.Base64);
    }
    getAccount(id, ethereumAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(`/account`, 'get', {
                id,
                ethereumAddress,
            });
        });
    }
    user() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(`/user`, 'get');
        });
    }
    // ----- trade -----
    tradeHistory(symbol, status, side, limit, beginTimeInclusive, endTimeExclusive, page, orderType) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/fills', 'get', {
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
    getWorstPrice(symbol, size, side) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/get-worst-price', 'get', {
                symbol,
                size,
                side,
            });
        });
    }
    getCreateOrderSignature(params, clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            const orderToSign = {
                // todo
                accountId: this.clientConfig.zkAccountId || '0',
                slotId: clientId,
                nonce: clientId,
                pairId: params.pairId,
                size: params.size,
                price: params.price,
                direction: params.side,
                makerFeeRate: params.makerFeeRate,
                takerFeeRate: params.takerFeeRate,
            };
            return yield this.getZKContractSignatureObj(orderToSign);
        });
    }
    ;
    getZKContractSignatureObj(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const invalidKeys = (_a = Object.entries(params)) === null || _a === void 0 ? void 0 : _a.map(([key, item]) => {
                if (item === '' || item === undefined) {
                    return key;
                }
                return undefined;
            }).filter((i) => i);
            if (invalidKeys === null || invalidKeys === void 0 ? void 0 : invalidKeys.length) {
                throw { msg: `Invalid params: ${invalidKeys.toString()}` };
            }
            const formattedSlotId = new bignumber_js_1.default((0, Tool_1.removePrefix)((0, viem_1.sha256)(params.slotId)), 16);
            const formattedNonce = new bignumber_js_1.default((0, Tool_1.removePrefix)((0, viem_1.sha256)(params.nonce)), 16);
            const formattedUint64 = new bignumber_js_1.default(viem_1.maxUint64.toString());
            const formattedUint32 = new bignumber_js_1.default(viem_1.maxUint32.toString());
            const accountId = new bignumber_js_1.default(this.clientConfig.accountId)
                .mod(formattedUint32)
                .plus(formattedUint32)
                .mod(formattedUint32);
            const slotId = formattedSlotId.mod(formattedUint64).dividedBy(formattedUint32).integerValue(bignumber_js_1.default.ROUND_FLOOR);
            const nonce = formattedNonce.mod(formattedUint32).plus(formattedUint32).mod(formattedUint32);
            let tx_builder = new zklink_sdk_node_1.ContractBuilder(accountId.toNumber(), 0, slotId.toNumber(), nonce.toNumber(), +params.pairId, (0, bignumber_js_1.default)(params.size).multipliedBy(1e18).toFixed(0, bignumber_js_1.default.ROUND_DOWN), (0, bignumber_js_1.default)(params.price).multipliedBy(1e18).toFixed(0, bignumber_js_1.default.ROUND_DOWN), params.direction === 'BUY', Math.ceil(params.makerFeeRate * 10000), Math.ceil(params.takerFeeRate * 10000), false);
            let contractor = (0, zklink_sdk_node_1.newContract)(tx_builder);
            (_c = (_b = this.clientConfig.client).initZkSigner) === null || _c === void 0 ? void 0 : _c.call(_b);
            contractor === null || contractor === void 0 ? void 0 : contractor.sign(this.clientConfig.signer);
            const tx = contractor.jsValue();
            return (_d = tx === null || tx === void 0 ? void 0 : tx.signature) === null || _d === void 0 ? void 0 : _d.signature;
        });
    }
    ;
    createOrder(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const clientId = params.clientId || (0, Tool_1.generateRandomClientIdOmni)(this.clientConfig.accountId);
            let signature = params.signature || '';
            if (!signature) {
                signature = yield this.getCreateOrderSignature(params, clientId);
                if (params.isSetOpenTp) {
                    const tpClientOrderId = (0, Tool_1.generateRandomClientIdOmni)(this.clientConfig.accountId);
                    // @ts-ignore
                    const tpExpiration = Date.now() + 30 * 24 * 60 * 60 * 1000;
                    params.tpSignature = yield this.getCreateOrderSignature({
                        side: params.tpSide,
                        size: params.tpSize || '',
                        price: params.tpPrice || '',
                        pairId: params.pairId,
                        makerFeeRate: params.makerFeeRate,
                        takerFeeRate: params.takerFeeRate,
                    }, tpClientOrderId);
                    params.tpExpiration = tpExpiration; // TODO 时间戳处理
                    params.tpClientOrderId = tpClientOrderId;
                }
                if (params.isSetOpenSl) {
                    const slClientOrderId = (0, Tool_1.generateRandomClientIdOmni)(this.clientConfig.accountId);
                    // @ts-ignore
                    const slExpiration = Date.now() + 30 * 24 * 60 * 60 * 1000;
                    params.slSignature = yield this.getCreateOrderSignature({
                        side: params.slSide,
                        size: params.slSize || '',
                        price: params.slPrice || '',
                        pairId: params.pairId,
                        makerFeeRate: params.makerFeeRate,
                        takerFeeRate: params.takerFeeRate,
                    }, slClientOrderId);
                    params.slExpiration = slExpiration; // TODO 
                    params.slClientOrderId = slClientOrderId;
                }
            }
            // @ts-ignore
            delete params.pairId;
            // @ts-ignore
            delete params.takerFeeRate;
            // @ts-ignore
            delete params.makerFeeRate;
            let order = Object.assign(Object.assign({}, params), { clientId,
                signature });
            order.expiration = params.expiration; // TODO 
            return this.request('/order', 'post', order);
        });
    }
    cancelOrder(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/delete-order', 'post', {
                id,
            });
        });
    }
    cancelOrderByClientOrderId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/delete-client-order-id', 'post', {
                id,
            });
        });
    }
    cancelAllOrder(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/delete-open-orders', 'post', {
                symbol,
            });
        });
    }
    openOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/open-orders', 'get', {});
        });
    }
    historyOrders(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/history-orders', 'get', params || {});
        });
    }
    fundingRate(symbol, limit, page, beginTimeInclusive, endTimeExclusive, side, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/funding', 'get', {
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
    historicalPNL(beginTimeInclusive, endTimeExclusive, type, symbol, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/historical-pnl', 'get', {
                beginTimeInclusive,
                endTimeExclusive,
                type,
                symbol,
                page,
                limit,
            });
        });
    }
    yesterdayPNL() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/yesterday-pnl', 'get', {});
        });
    }
    setInitialMarginRate(symbol, initialMarginRate) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/set-initial-margin-rate', 'post', {
                symbol,
                initialMarginRate,
            });
        });
    }
    accountBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request('/account-balance', 'get', {});
        });
    }
}
exports.PrivateApi = PrivateApi;
