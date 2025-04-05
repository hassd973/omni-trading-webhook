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
exports.ApexClientOmni = void 0;
const PublicApi_1 = require("./PublicApi");
const PrivateApi_1 = require("./PrivateApi");
const Constant_1 = require("./Constant");
const Clock_1 = require("./tool/Clock");
const ApiTool_1 = require("./tool/ApiTool");
const zklink_sdk_node_1 = require("../packages/node-dist/zklink-sdk-node");
const Tool_1 = require("./tool/Tool");
class ApexClientOmni {
    constructor(env = Constant_1.PROD) {
        this.env = env;
        this.apiTool = new ApiTool_1.ApiTool(env);
        this.publicApi = new PublicApi_1.PublicApi(this.apiTool);
    }
    init(apiKeyCredentials, seed) {
        return __awaiter(this, void 0, void 0, function* () {
            const clientConfig = new Constant_1.ClientConfig();
            clientConfig.apiTool = this.apiTool;
            clientConfig.networkId = this.env.networkId;
            clientConfig.clock = new Clock_1.Clock();
            clientConfig.apiKeyCredentials = apiKeyCredentials;
            clientConfig.client = this;
            this.clientConfig = clientConfig;
            this.seed = seed;
            this.initZkSigner();
            this.privateApi = new PrivateApi_1.PrivateApi(clientConfig);
            yield this.initClock(clientConfig);
            yield this.initConfig(clientConfig);
        });
    }
    initZkSigner() {
        const signer = zklink_sdk_node_1.ZkLinkSigner.ethSig(this.seed);
        this.signer = signer;
        this.clientConfig.signer = this.signer;
        return signer;
    }
    initClock(clientConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const { time } = yield this.publicApi.time();
            this.clientConfig.clock.setTimestampAdjustment(time - new Date().getTime());
        });
    }
    initConfig(clientConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            this.user = yield this.privateApi.user();
            if (!((_a = this.user) === null || _a === void 0 ? void 0 : _a.ethereumAddress))
                throw new Error('Ethereum address is not found');
            this.account = yield this.privateApi.getAccount(this.clientConfig.accountId, (_b = this.user) === null || _b === void 0 ? void 0 : _b.ethereumAddress);
            clientConfig.zkAccountId = this.account.spotAccount.zkAccountId;
            clientConfig.accountId = this.account.id;
            this.checkAccountId();
            // this.checkL2Key();
            yield this.initSymbol();
        });
    }
    checkAccountId() {
        if (this.account.id !== this.clientConfig.accountId) {
            throw new Error('Account Id is not match, please check your account id.');
        }
    }
    checkL2Key() {
        // todo
    }
    initSymbol() {
        return __awaiter(this, void 0, void 0, function* () {
            const { contractConfig } = yield this.publicApi.symbols();
            const { perpetualContract: perpetual = [], tokens: tokens_contract, assets: assets_contract, } = contractConfig;
            const symbols_perpetual = (0, Tool_1.getSymbolsWithBaseInfo)(perpetual, assets_contract, tokens_contract, 'perpetual');
            this.symbols = symbols_perpetual;
            return symbols_perpetual;
        });
    }
}
exports.ApexClientOmni = ApexClientOmni;
