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
const useProd = false;
const privateKey = '42b81f4a8becf2ca03ec734c002c69d7150989a00cbb00b439d9af782545451a';
describe('Onboarding Example', () => {
    let env;
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        // init qa client
        env = new pro_1.ENV(useProd ? 'https://pro.apex.exchange' : 'https://qa.pro.apex.exchange', useProd ? 1 : 5);
    }));
    it('Onboarding USDC', () => __awaiter(void 0, void 0, void 0, function* () {
        const v2 = yield (0, pro_1.onboardingAccount)({
            env,
            privateKey,
            rpcUrl: 'https://ethereum-goerli.publicnode.com',
        });
        pro_1.Trace.print(v2);
    }));
    it('Onboarding USDT', () => __awaiter(void 0, void 0, void 0, function* () {
        const v2 = yield (0, pro_1.onboardingAccount)({
            env,
            privateKey,
            rpcUrl: 'https://ethereum-goerli.publicnode.com',
            token: 'USDT'
        });
        pro_1.Trace.print(v2);
    }));
    it('Create StarkKey', () => __awaiter(void 0, void 0, void 0, function* () {
        const signer = yield pro_1.web3.eth.accounts.wallet.add(privateKey);
        const keyPair = yield (0, pro_1.createStartKey)(signer, env, 'USDC', 'https://ethereum-goerli.publicnode.com');
        pro_1.Trace.print(keyPair);
    }));
});
