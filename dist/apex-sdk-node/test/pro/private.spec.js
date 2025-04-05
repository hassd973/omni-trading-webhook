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
const pro_1 = require("../../src/pro");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
describe('Private Api Example', () => {
    let apexClient;
    const currentPerpetual = 'USDC';
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        apexClient = new pro_1.ApexClient(pro_1.QA);
        const apiKeyCredentials = {
            key: mock_1.proUser.key,
            passphrase: mock_1.proUser.passphrase,
            secret: mock_1.proUser.secret,
        };
        const startPrivateKey = mock_1.proUser.privateKey;
        const accountId = mock_1.proUser.accountId;
        yield apexClient.init(apiKeyCredentials, startPrivateKey, accountId);
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
    it('GET Trade History', () => __awaiter(void 0, void 0, void 0, function* () {
        const { orders } = yield apexClient.privateApi.tradeHistory(`BTC-${currentPerpetual}`, 'OPEN');
        pro_1.Trace.print(orders);
    }));
    it('GET Worst Price', () => __awaiter(void 0, void 0, void 0, function* () {
        const price = yield apexClient.privateApi.getWorstPrice(`BTC-${currentPerpetual}`, '0.01', 'BUY');
        // const price = await apexClient.privateApi.getWorstPrice('BTC-USDT', '0.01', 'BUY');
        pro_1.Trace.print(price);
    }));
    it('POST Creating Orders', () => __awaiter(void 0, void 0, void 0, function* () {
        const symbol = `BTC-${currentPerpetual}`;
        console.log('symbol', symbol);
        // const symbol = 'BTC-USDT';
        const price = '24046.0';
        const size = '0.01';
        const baseCoinRealPrecision = apexClient.symbols[symbol].baseCoinRealPrecision;
        const takerFeeRate = apexClient.account.takerFeeRate;
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
        const result = yield apexClient.privateApi.createOrder(apiOrder.clientOrderId, apiOrder.positionId, apiOrder.symbol, apiOrder.side, apiOrder.type, apiOrder.size, apiOrder.price, apiOrder.limitFee, apiOrder.timeInForce, apiOrder.triggerPrice, apiOrder.trailingPercent, apiOrder.reduceOnly);
        pro_1.Trace.print(result);
    }));
    it('GET Open Orders', () => __awaiter(void 0, void 0, void 0, function* () {
        const { orders } = yield apexClient.privateApi.openOrders();
        pro_1.Trace.print(orders);
    }));
    it('POST Cancel all Open Orders', () => __awaiter(void 0, void 0, void 0, function* () {
        const symbol = `BTC-${currentPerpetual}`;
        // const symbol = 'BTC-USDT';
        yield apexClient.privateApi.cancelAllOrder(symbol);
    }));
    it('GET All Order History', () => __awaiter(void 0, void 0, void 0, function* () {
        const { orders } = yield apexClient.privateApi.historyOrders();
        pro_1.Trace.print(orders);
    }));
    it('GET Order ID', () => __awaiter(void 0, void 0, void 0, function* () {
        const orderId = '557260254170054997';
        const order = yield apexClient.privateApi.getOrder(orderId);
        pro_1.Trace.print(order);
    }));
    it('POST Cancel Order', () => __awaiter(void 0, void 0, void 0, function* () {
        const orderId = '557260254170054997';
        const result = yield apexClient.privateApi.cancelOrder(orderId);
        pro_1.Trace.print(result);
    }));
    it('POST Cancel Order By ClientOrderId', () => __awaiter(void 0, void 0, void 0, function* () {
        const clientOrderId = '3773562820849392';
        const result = yield apexClient.privateApi.cancelOrderByClientOrderId(clientOrderId);
        pro_1.Trace.print(result);
    }));
    it('GET Order by clientOrderId', () => __awaiter(void 0, void 0, void 0, function* () {
        const orderId = '3773562820849392';
        const order = yield apexClient.privateApi.getOrderByClientOrderId(orderId);
        pro_1.Trace.print(order);
    }));
    it('GET Funding Rate', () => __awaiter(void 0, void 0, void 0, function* () {
        const { fundingValues, totalSize } = yield apexClient.privateApi.fundingRate(currentPerpetual);
        pro_1.Trace.print(fundingValues, totalSize);
    }));
    it('GET User Historial Profit and Loss', () => __awaiter(void 0, void 0, void 0, function* () {
        const { historicalPnl, totalSize } = yield apexClient.privateApi.historicalPNL();
        pro_1.Trace.print(historicalPnl, totalSize);
    }));
    it("GET Yesterday's Profit & Loss", () => __awaiter(void 0, void 0, void 0, function* () {
        const yesterdayPNL = yield apexClient.privateApi.yesterdayPNL();
        pro_1.Trace.print(yesterdayPNL);
    }));
    it('GET Account Balance', () => __awaiter(void 0, void 0, void 0, function* () {
        const accountBalance = yield apexClient.privateApi.accountBalance();
        pro_1.Trace.print(accountBalance);
    }));
});
