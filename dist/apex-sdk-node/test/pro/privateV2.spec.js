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
const pro_1 = require("../../src/pro");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const starkex_lib_1 = require("../../src/pro/starkex-lib");
const mock_1 = require("../../src/mock");
describe('Private Api Example', () => {
    let apexClient;
    const currentPerpetual = 'USDT';
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        apexClient = new pro_1.ApexClientV2(pro_1.QA);
        const apiKeyCredentials = {
            key: mock_1.proUser.key,
            passphrase: mock_1.proUser.passphrase,
            secret: mock_1.proUser.secret,
        };
        const startPrivateKey = mock_1.proUser.privateKey;
        const accountId = mock_1.proUser.accountId;
        yield apexClient.init(apiKeyCredentials, startPrivateKey, accountId);
        // setup perpetual USDC or USDT before trading, default is USDC. And if set '' will change to V1 version.
        (0, starkex_lib_1.setPerpetual)(currentPerpetual);
    }));
    it('GET Retrieve User Data', () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield apexClient.privateApi.user();
        pro_1.Trace.print(user);
    }));
    it('GET Retrieve User Account Data', () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield apexClient.privateApi.user();
        const accountInfo = yield apexClient.privateApi.getAccount(apexClient.clientConfig.accountId, user.ethereumAddress);
        pro_1.Trace.print(accountInfo);
    }));
    // update v2
    it('GET Trade History', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const currentPerpetual = (_a = (0, starkex_lib_1.getPerpetual)()) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        const { orders } = yield apexClient.privateApi.tradeHistoryV2(currentPerpetual, `BTC-${currentPerpetual}`, 'OPEN');
        pro_1.Trace.print(orders);
    }));
    // update v2
    it('GET Worst Price', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const currentPerpetual = (_a = (0, starkex_lib_1.getPerpetual)()) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        const price = yield apexClient.privateApi.getWorstPriceV2(`BTC-${currentPerpetual}`, '0.01', 'BUY');
        // const price = await apexClient.privateApi.getWorstPrice('BTC-USDT', '0.01', 'BUY');
        pro_1.Trace.print(price);
    }));
    // update v2
    it('POST Creating Orders', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const currentPerpetual = (_a = (0, starkex_lib_1.getPerpetual)()) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        const symbol = `BTC-${currentPerpetual}`;
        // const symbol = 'BTC-USDT';
        const price = '24046.0';
        const size = '0.01';
        const baseCoinRealPrecision = apexClient.symbols[symbol].baseCoinRealPrecision;
        const takerFeeRate = (_d = (_c = (_b = apexClient === null || apexClient === void 0 ? void 0 : apexClient.account) === null || _b === void 0 ? void 0 : _b.accounts) === null || _c === void 0 ? void 0 : _c.find(i => (i === null || i === void 0 ? void 0 : i.token) === (0, starkex_lib_1.getPerpetual)())) === null || _d === void 0 ? void 0 : _d.takerFeeRate;
        const limitFee = new bignumber_js_1.default(price)
            .multipliedBy(takerFeeRate || '0')
            .multipliedBy(size)
            .toFixed(baseCoinRealPrecision, bignumber_js_1.default.ROUND_UP);
        console.log('limitFee', limitFee);
        const apiOrder = {
            limitFee,
            price,
            reduceOnly: false,
            side: pro_1.OrderSide.BUY,
            size,
            symbol,
            timeInForce: 'GOOD_TIL_CANCEL',
            type: pro_1.OrderType.LIMIT,
            clientOrderId: (0, pro_1.generateRandomClientId)(),
            positionId: apexClient.clientConfig.accountId,
            trailingPercent: '',
            triggerPrice: '',
        };
        const result = yield apexClient.privateApi.createOrderV2(apiOrder.clientOrderId, apiOrder.positionId, apiOrder.symbol, apiOrder.side, apiOrder.type, apiOrder.size, apiOrder.price, apiOrder.limitFee, apiOrder.timeInForce, apiOrder.triggerPrice, apiOrder.trailingPercent, apiOrder.reduceOnly);
        pro_1.Trace.print(result);
    }));
    // update v2
    it('GET Open Orders', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const currentPerpetual = (_a = (0, starkex_lib_1.getPerpetual)()) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        const { orders } = yield apexClient.privateApi.openOrdersV2(currentPerpetual);
        pro_1.Trace.print(orders);
    }));
    // update v2
    it('POST Cancel all Open Orders', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const currentPerpetual = (_a = (0, starkex_lib_1.getPerpetual)()) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        const symbol = `BTC-${currentPerpetual}`;
        yield apexClient.privateApi.cancelAllOrderV2(currentPerpetual, symbol);
    }));
    // update v2
    it('GET All Order History', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const currentPerpetual = (_a = (0, starkex_lib_1.getPerpetual)()) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        const { orders } = yield apexClient.privateApi.historyOrdersV2(currentPerpetual);
        pro_1.Trace.print(orders);
    }));
    // update v2
    it('GET Order ID', () => __awaiter(void 0, void 0, void 0, function* () {
        const orderId = '557260254170054997';
        const order = yield apexClient.privateApi.getOrderV2(orderId);
        pro_1.Trace.print(order);
    }));
    // update v2
    it('POST Cancel Order', () => __awaiter(void 0, void 0, void 0, function* () {
        const orderId = '557260254170054997';
        const result = yield apexClient.privateApi.cancelOrderV2(orderId);
        pro_1.Trace.print(result);
    }));
    // update v2
    it('POST Cancel Order By ClientOrderId', () => __awaiter(void 0, void 0, void 0, function* () {
        const clientOrderId = '3773562820849392';
        const result = yield apexClient.privateApi.cancelOrderByClientOrderIdV2(clientOrderId);
        pro_1.Trace.print(result);
    }));
    it('GET Order by clientOrderId', () => __awaiter(void 0, void 0, void 0, function* () {
        const orderId = '3773562820849392';
        const order = yield apexClient.privateApi.getOrderByClientOrderId(orderId);
        pro_1.Trace.print(order);
    }));
    // update v2
    it('GET Funding Rate', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const currentPerpetual = (_a = (0, starkex_lib_1.getPerpetual)()) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        const { fundingValues, totalSize } = yield apexClient.privateApi.fundingRateV2(currentPerpetual);
        pro_1.Trace.print(fundingValues, totalSize);
    }));
    // update v2
    it('GET User Historial Profit and Loss', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const currentPerpetual = (_a = (0, starkex_lib_1.getPerpetual)()) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        const { historicalPnl, totalSize } = yield apexClient.privateApi.historicalPNLV2(currentPerpetual);
        pro_1.Trace.print(historicalPnl, totalSize);
    }));
    // update v2
    it("GET Yesterday's Profit & Loss", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const currentPerpetual = (_a = (0, starkex_lib_1.getPerpetual)()) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        const yesterdayPNL = yield apexClient.privateApi.yesterdayPNLV2(currentPerpetual);
        pro_1.Trace.print(yesterdayPNL);
    }));
    it('GET Account Balance', () => __awaiter(void 0, void 0, void 0, function* () {
        const accountBalance = yield apexClient.privateApi.accountBalance();
        pro_1.Trace.print(accountBalance);
    }));
});
