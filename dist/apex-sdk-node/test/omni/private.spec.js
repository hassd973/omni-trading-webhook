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
const mock_1 = require("../../src/mock");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const interface_1 = require("../../src/omni/interface");
const Tool_1 = require("../../src/omni/tool/Tool");
const src_1 = require("../../src");
describe('Omni Private Api Example', () => {
    let apexClient;
    const env = src_1.OMNI_QA;
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        apexClient = new src_1.ApexClient.omni(env);
        const apiKeyCredentials = {
            key: mock_1.omniUser.key,
            passphrase: mock_1.omniUser.passphrase,
            secret: mock_1.omniUser.secret,
        };
        const seed = mock_1.omniUser.seed;
        yield apexClient.init(apiKeyCredentials, seed);
    }));
    it('GET Trade History', () => __awaiter(void 0, void 0, void 0, function* () {
        const { orders } = yield apexClient.privateApi.tradeHistory(`BTC-USDT`, 'OPEN');
        Tool_1.Trace.print(orders);
    }));
    it('GET Worst Price', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield apexClient.privateApi.getWorstPrice('BTC-USDT', '0.01', 'BUY').catch((error) => {
            console.log('error', error);
        });
        Tool_1.Trace.print(res);
    }));
    it('Get Worst Price', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield apexClient.privateApi.getWorstPrice('BTC-USDT', '0.01', 'BUY').catch((error) => {
            console.log('error', error);
        });
        Tool_1.Trace.print(res);
    }));
    it('POST Creating Orders', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const symbol = `BTC-USDT`;
        const price = '46000';
        const size = '1';
        const baseCoinRealPrecision = (_b = (_a = apexClient === null || apexClient === void 0 ? void 0 : apexClient.symbols) === null || _a === void 0 ? void 0 : _a[symbol]) === null || _b === void 0 ? void 0 : _b.baseCoinRealPrecision;
        const takerFeeRate = apexClient.account.contractAccount.takerFeeRate;
        const makerFeeRate = apexClient.account.contractAccount.makerFeeRate;
        const limitFee = new bignumber_js_1.default(price)
            .multipliedBy(takerFeeRate || '0')
            .multipliedBy(size)
            .toFixed(baseCoinRealPrecision, bignumber_js_1.default.ROUND_UP);
        const apiOrder = {
            pairId: (_c = apexClient.symbols[symbol]) === null || _c === void 0 ? void 0 : _c.l2PairId,
            makerFeeRate,
            takerFeeRate,
            symbol,
            side: interface_1.OrderSide.BUY,
            type: interface_1.OrderType.LIMIT,
            size,
            price,
            limitFee,
            reduceOnly: false,
            timeInForce: 'GOOD_TIL_CANCEL',
            expiration: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60),
            trailingPercent: '',
            triggerPrice: '',
        };
        const result = yield apexClient.privateApi.createOrder(apiOrder);
        Tool_1.Trace.print(result);
    }));
    it('GET Open Orders', () => __awaiter(void 0, void 0, void 0, function* () {
        const { orders } = yield apexClient.privateApi.openOrders();
        Tool_1.Trace.print(orders);
    }));
    it('POST Cancel all Open Orders', () => __awaiter(void 0, void 0, void 0, function* () {
        const symbol = `BTC-USDT`;
        yield apexClient.privateApi.cancelAllOrder(symbol);
    }));
    it('GET All Order History', () => __awaiter(void 0, void 0, void 0, function* () {
        const { orders } = yield apexClient.privateApi.historyOrders({ orderType: 'ACTIVE' });
        Tool_1.Trace.print(orders);
    }));
    it('POST Cancel Order', () => __awaiter(void 0, void 0, void 0, function* () {
        const orderId = '632428509349806941';
        const result = yield apexClient.privateApi.cancelOrder(orderId);
        Tool_1.Trace.print(result);
    }));
    it('GET Funding Rate', () => __awaiter(void 0, void 0, void 0, function* () {
        const { fundingValues, totalSize } = yield apexClient.privateApi.fundingRate();
        Tool_1.Trace.print(fundingValues, totalSize);
    }));
    it('GET User Historial Profit and Loss', () => __awaiter(void 0, void 0, void 0, function* () {
        const { historicalPnl, totalSize } = yield apexClient.privateApi.historicalPNL();
        Tool_1.Trace.print(historicalPnl, totalSize);
    }));
    it("GET Yesterday's Profit & Loss", () => __awaiter(void 0, void 0, void 0, function* () {
        const yesterdayPNL = yield apexClient.privateApi.yesterdayPNL();
        Tool_1.Trace.print(yesterdayPNL);
    }));
    it('GET Account Balance', () => __awaiter(void 0, void 0, void 0, function* () {
        const accountBalance = yield apexClient.privateApi.accountBalance();
        Tool_1.Trace.print(accountBalance);
    }));
});
