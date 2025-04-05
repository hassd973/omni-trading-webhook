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
const mock_1 = require("../src/mock");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const interface_1 = require("../src/omni/interface");
const Tool_1 = require("../src/omni/tool/Tool");
const src_1 = require("../src");
const starkex_lib_1 = require("../src/pro/starkex-lib");
describe('Omni&Pro Api Example', () => {
    let apexClient;
    let OMNI_apexClient;
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        // pro
        apexClient = new src_1.ApexClientV2(src_1.QA);
        const apiKeyCredentials = {
            key: mock_1.proUser.key,
            passphrase: mock_1.proUser.passphrase,
            secret: mock_1.proUser.secret,
        };
        const startPrivateKey = mock_1.proUser.privateKey;
        const accountId = mock_1.proUser.accountId;
        yield apexClient.init(apiKeyCredentials, startPrivateKey, accountId);
        (0, starkex_lib_1.setPerpetual)('USDC');
        // omni
        OMNI_apexClient = new src_1.ApexClient.omni(src_1.OMNI_QA);
        const OMNI_apiKeyCredentials = {
            key: mock_1.omniUser.key,
            passphrase: mock_1.omniUser.passphrase,
            secret: mock_1.omniUser.secret,
        };
        const seed = mock_1.omniUser.seed;
        yield OMNI_apexClient.init(OMNI_apiKeyCredentials, seed);
    }));
    it('GET Accounts', () => __awaiter(void 0, void 0, void 0, function* () {
        // pro
        const account = yield apexClient.privateApi.getAccountV2(apexClient.clientConfig.accountId, apexClient.account.ethereumAddress);
        Tool_1.Trace.print(account);
        // omni
        const OMNI_account = yield OMNI_apexClient.privateApi.getAccount(OMNI_apexClient.clientConfig.accountId, OMNI_apexClient.account.ethereumAddress);
        Tool_1.Trace.print(OMNI_account);
    }));
    it('POST Creating Orders', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const base = 'BTC';
        // pro
        const perp = 'USDC';
        const symbol = base + '-' + perp;
        const price = '46000';
        const size = '0.01';
        const baseCoinRealPrecision = (_b = (_a = apexClient.symbols) === null || _a === void 0 ? void 0 : _a[symbol]) === null || _b === void 0 ? void 0 : _b.baseCoinRealPrecision;
        const takerFeeRate = (_e = (_d = (_c = apexClient === null || apexClient === void 0 ? void 0 : apexClient.account) === null || _c === void 0 ? void 0 : _c.accounts) === null || _d === void 0 ? void 0 : _d.find((i) => (i === null || i === void 0 ? void 0 : i.token) === perp)) === null || _e === void 0 ? void 0 : _e.takerFeeRate;
        const limitFee = new bignumber_js_1.default(price)
            .multipliedBy(takerFeeRate || '0')
            .multipliedBy(size)
            .toFixed(baseCoinRealPrecision || 0, bignumber_js_1.default.ROUND_UP);
        const apiOrder = {
            limitFee,
            price,
            reduceOnly: false,
            side: interface_1.OrderSide.BUY,
            size,
            symbol,
            timeInForce: 'GOOD_TIL_CANCEL',
            type: interface_1.OrderType.LIMIT,
            clientOrderId: (0, src_1.generateRandomClientId)(),
            positionId: apexClient.clientConfig.accountId,
            trailingPercent: '',
            triggerPrice: '',
        };
        const result = yield apexClient.privateApi.createOrderV2(apiOrder.clientOrderId, apiOrder.positionId, apiOrder.symbol, apiOrder.side, apiOrder.type, apiOrder.size, apiOrder.price, apiOrder.limitFee, apiOrder.timeInForce, apiOrder.triggerPrice, apiOrder.trailingPercent, apiOrder.reduceOnly);
        Tool_1.Trace.print(result);
        // omni
        const OMNI_symbol = base + `-USDT`;
        const OMNI_price = '46000';
        const OMNI_size = '1';
        const OMNI_baseCoinRealPrecision = (_g = (_f = OMNI_apexClient === null || OMNI_apexClient === void 0 ? void 0 : OMNI_apexClient.symbols) === null || _f === void 0 ? void 0 : _f[OMNI_symbol]) === null || _g === void 0 ? void 0 : _g.baseCoinRealPrecision;
        const OMNI_takerFeeRate = OMNI_apexClient.account.contractAccount.takerFeeRate;
        const OMNI_makerFeeRate = OMNI_apexClient.account.contractAccount.makerFeeRate;
        const OMNI_limitFee = new bignumber_js_1.default(OMNI_price)
            .multipliedBy(OMNI_takerFeeRate || '0')
            .multipliedBy(OMNI_size)
            .toFixed(OMNI_baseCoinRealPrecision || 0, bignumber_js_1.default.ROUND_UP);
        const OMNI_apiOrder = {
            pairId: (_h = OMNI_apexClient.symbols[OMNI_symbol]) === null || _h === void 0 ? void 0 : _h.l2PairId,
            makerFeeRate: OMNI_makerFeeRate,
            takerFeeRate: OMNI_takerFeeRate,
            symbol: OMNI_symbol,
            side: interface_1.OrderSide.BUY,
            type: interface_1.OrderType.LIMIT,
            size: OMNI_size,
            price: OMNI_price,
            limitFee: OMNI_limitFee.toString(),
            reduceOnly: false,
            timeInForce: 'GOOD_TIL_CANCEL',
            expiration: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60),
            trailingPercent: '',
            triggerPrice: '',
        };
        const OMNI_result = yield OMNI_apexClient.privateApi.createOrder(OMNI_apiOrder);
        Tool_1.Trace.print(OMNI_result);
    }));
});
