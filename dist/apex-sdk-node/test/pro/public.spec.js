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
const pro_1 = require("../../src/pro");
describe('Public Api Example', () => {
    let apexClient;
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        // init prod client
        // apexClient = new ApexClient(PROD);
        // init qa
        apexClient = new pro_1.ApexClient(pro_1.QA);
    }));
    it('GET System Time', () => __awaiter(void 0, void 0, void 0, function* () {
        const time = yield apexClient.publicApi.time();
        pro_1.Trace.print(time);
    }));
    it('GET All Config Data', () => __awaiter(void 0, void 0, void 0, function* () {
        const symbols = yield apexClient.publicApi.symbols();
        pro_1.Trace.print(symbols);
    }));
    it('GET Market Depth', () => __awaiter(void 0, void 0, void 0, function* () {
        const depth = yield apexClient.publicApi.depth('BTCUSDC');
        pro_1.Trace.print(depth);
    }));
    it('GET Newest Trading Data', () => __awaiter(void 0, void 0, void 0, function* () {
        const trades = yield apexClient.publicApi.trades('BTCUSDC');
        pro_1.Trace.print(trades);
    }));
    //
    it('GET Candlestick Chart Data', () => __awaiter(void 0, void 0, void 0, function* () {
        const kline = yield apexClient.publicApi.klines('BTCUSDC', '1', undefined, undefined, 100);
        pro_1.Trace.print(kline);
    }));
    it('GET Ticker Data', () => __awaiter(void 0, void 0, void 0, function* () {
        const tickers = yield apexClient.publicApi.tickers('BTCUSDC');
        pro_1.Trace.print(tickers);
    }));
    // update v2
    it('GET Funding Rate History', () => __awaiter(void 0, void 0, void 0, function* () {
        const historyFunding = yield apexClient.publicApi.historyFunding('BTC-USDC');
        // const historyFunding = await apexClient.publicApi.historyFunding('BTC-USDT');
        pro_1.Trace.print(historyFunding);
    }));
    it('GET Check If User Exists', () => __awaiter(void 0, void 0, void 0, function* () {
        const checkUserExist = yield apexClient.publicApi.checkUserExist('0x0000000000000000000000000000000000000000');
        pro_1.Trace.print(checkUserExist);
    }));
});
