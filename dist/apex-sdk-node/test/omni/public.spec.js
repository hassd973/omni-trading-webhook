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
const Tool_1 = require("../../src/omni/tool/Tool");
const src_1 = require("../../src");
describe('Omni Public Api Example', () => {
    let apexClient;
    const env = src_1.OMNI_QA;
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        apexClient = new src_1.ApexClient.omni(env);
    }));
    it('GET System Time', () => __awaiter(void 0, void 0, void 0, function* () {
        const time = yield apexClient.publicApi.time();
        Tool_1.Trace.print(time);
    }));
    it('GET All Config Data', () => __awaiter(void 0, void 0, void 0, function* () {
        const symbols = yield apexClient.publicApi.symbols();
        Tool_1.Trace.print(symbols);
    }));
    it('GET Market Depth', () => __awaiter(void 0, void 0, void 0, function* () {
        const depth = yield apexClient.publicApi.depth('BTCUSDC');
        Tool_1.Trace.print(depth);
    }));
    it('GET Newest Trading Data', () => __awaiter(void 0, void 0, void 0, function* () {
        const trades = yield apexClient.publicApi.trades('BTCUSDC');
        Tool_1.Trace.print(trades);
    }));
    //
    it('GET Candlestick Chart Data', () => __awaiter(void 0, void 0, void 0, function* () {
        const kline = yield apexClient.publicApi.klines('BTCUSDC', '1', undefined, undefined, 100);
        Tool_1.Trace.print(kline);
    }));
    it('GET Ticker Data', () => __awaiter(void 0, void 0, void 0, function* () {
        const tickers = yield apexClient.publicApi.tickers('BTCUSDC');
        Tool_1.Trace.print(tickers);
    }));
    // update v2
    it('GET Funding Rate History', () => __awaiter(void 0, void 0, void 0, function* () {
        const historyFunding = yield apexClient.publicApi.historyFunding('BTC-USDC');
        // const historyFunding = await apexClient.publicApi.historyFunding('BTC-USDT');
        Tool_1.Trace.print(historyFunding);
    }));
    it('GET Check If User Exists', () => __awaiter(void 0, void 0, void 0, function* () {
        const checkUserExist = yield apexClient.publicApi.checkUserExist('0x0000000000000000000000000000000000000000');
        Tool_1.Trace.print(checkUserExist);
    }));
});
