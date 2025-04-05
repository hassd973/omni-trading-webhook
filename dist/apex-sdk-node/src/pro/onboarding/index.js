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
exports.onboarding = exports.getNonce = exports.createStartKey = exports.onboardingAccount = exports.web3 = void 0;
if (!options) {
    throw new Error("Options are required.");
}
const tool_1 = require("./tool");
const interface_1 = require("./interface");
const apexpro_1 = require("../apexpro");
const web3_1 = __importDefault(require("web3"));
const web3 = new web3_1.default();
exports.web3 = web3;
const createStartKeyAndOnboarding = (signer_1, env_1, token_1, rpcUrl_1, ...args_1) => __awaiter(void 0, [signer_1, env_1, token_1, rpcUrl_1, ...args_1], void 0, function* (signer, env, token, rpcUrl, version = 'v2') {
    if (!(web3 === null || web3 === void 0 ? void 0 : web3.currentProvider)) {
        web3.setProvider(new web3_1.default.providers.HttpProvider(rpcUrl));
    }
    const account = signer.address;
    const chainId = env.networkId;
    if (account) {
        const { key, l2KeyHash } = yield (0, tool_1.genStarkKey)(interface_1.SigningMethod.Personal2, account, env);
        if (key) {
            return yield getNonce(key, env, { chainId, account, token, version });
        }
        return { key, l2KeyHash };
    }
    else {
        throw new Error('Invalid Account');
    }
});
const createStartKey = (signer_1, env_1, token_1, rpcUrl_1, ...args_1) => __awaiter(void 0, [signer_1, env_1, token_1, rpcUrl_1, ...args_1], void 0, function* (signer, env, token, rpcUrl, version = 'v2') {
    if (!(web3 === null || web3 === void 0 ? void 0 : web3.currentProvider)) {
        web3.setProvider(new web3_1.default.providers.HttpProvider(rpcUrl));
    }
    const account = signer.address;
    if (account) {
        const { key } = yield (0, tool_1.genStarkKey)(interface_1.SigningMethod.Personal2, account, env);
        return key;
    }
    else {
        throw new Error('Invalid Account');
    }
});
exports.createStartKey = createStartKey;
const getNonce = (key, env, options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield (0, tool_1.genNonce)(options.account || '', key.publicKey, env, { chainId: options.chainId });
        if (res.data.nonce) {
            yield (0, apexpro_1.sleep)(1000);
            return yield onboarding(env, res.data.nonce, key, {
                account: options.account,
                token: options.token,
                onboardingVersion: options.version,
            });
        }
        else {
            throw new Error('Unkown Error');
        }
    }
    catch (e) {
        throw new Error('Unkown Error');
    }
});
exports.getNonce = getNonce;
const onboarding = (env, nonce, key, 
//
options) => __awaiter(void 0, void 0, void 0, function* () {
    const status = !!options.account;
    const _account = options.account;
    let onboardingFn = tool_1.simplifyOnboarding;
    switch (options.onboardingVersion) {
        case 'v1':
            onboardingFn = tool_1.simplifyOnboarding; // force use v2 version
            break;
        case 'v2':
            onboardingFn = tool_1.simplifyOnboarding;
            break;
    }
    if (status) {
        try {
            const res = yield onboardingFn(env, nonce, interface_1.SigningMethod.MetaMaskLatest, _account, key, options.token);
            if (res.data) {
                return res.data;
            }
            else {
                throw new Error('Unkown Error');
            }
        }
        catch (e) {
            throw e;
        }
    }
    else {
        throw new Error('Invalid Account');
    }
});
exports.onboarding = onboarding;
const onboardingAccount = (_a) => __awaiter(void 0, [_a], void 0, function* ({ env, privateKey, rpcUrl, version = 'v2', token = 'USDC', }) {
    const signer = yield web3.eth.accounts.wallet.add(privateKey);
    web3.setProvider(new web3_1.default.providers.HttpProvider(rpcUrl));
    const res = yield createStartKeyAndOnboarding(signer, env, token, rpcUrl, version);
    return res;
});
exports.onboardingAccount = onboardingAccount;
