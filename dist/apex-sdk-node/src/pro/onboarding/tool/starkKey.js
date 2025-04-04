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
exports.genNonce = exports.genStarkKey = exports.simplifyOnboarding = exports.basicOnboarding = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_js_1 = __importDefault(require("crypto-js"));
// import queryString from 'query-string';
const bn_js_1 = __importDefault(require("bn.js"));
const starkex_lib_1 = require("../../starkex-lib");
const constants_1 = require("../constants");
const eth_signing_1 = require("../eth-signing");
const interface_1 = require("../interface");
const __1 = require("..");
const qs_1 = __importDefault(require("qs"));
const KEY_DERIVATION_SUPPORTED_SIGNING_METHODS = [
    interface_1.SigningMethod.TypedData,
    interface_1.SigningMethod.MetaMask,
    interface_1.SigningMethod.MetaMaskLatest,
    interface_1.SigningMethod.CoinbaseWallet,
    interface_1.SigningMethod.Personal,
];
const genStarkKey = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (signingMethod = interface_1.SigningMethod.TypedData, account, env
// registerChainId: number,
) {
    if (!account) {
        throw new Error('Invalid Account');
    }
    const signer = new eth_signing_1.SignOnboardingAction(__1.web3, env.registerChainId);
    const sig = yield signer.sign(account, signingMethod, constants_1.genStarkKeyMessage, env);
    const signature = typeof sig === 'string' ? sig : sig.value;
    const l2KeyHash = typeof sig === 'string' ? '' : sig.l2KeyHash;
    const keyPair = (0, starkex_lib_1.keyPairFromData)(Buffer.from((0, starkex_lib_1.stripHexPrefix)(signature), 'hex'));
    return { key: keyPair, l2KeyHash, signer };
});
exports.genStarkKey = genStarkKey;
const genNonce = (address_1, publicKey_1, env_1, ...args_1) => __awaiter(void 0, [address_1, publicKey_1, env_1, ...args_1], void 0, function* (address, publicKey, env, params = {}) {
    const qrs = "?" + qs_1.default.stringify(Object.assign({ ethAddress: address, starkKey: publicKey, chainId: params.chainId }, params));
    const res = yield axios_1.default.post(`${env.url}/api/v1/generate-nonce${qrs}`, {}, {
        headers: {
            'Content-Type': "application/x-www-form-urlencoded; charset=UTF-8"
        }
    });
    return res.data;
});
exports.genNonce = genNonce;
const genNewSignature = (_a) => __awaiter(void 0, [_a], void 0, function* ({ account, privateKey, publicKey, nonce, }) {
    const signHash = crypto_js_1.default.SHA256(`${publicKey}${account}${nonce}`.toLowerCase());
    // console.log('=======================');
    // console.log('source: ', (`${this.keyPair.publicKey}${this.account}${nonce}`).toLowerCase())
    // console.log('to: ', signHash.toString())
    // console.log('=======================');
    const EC_ORDER = '3618502788666131213697322783095070105526743751716087489154079457884512865583';
    const bn1 = new bn_js_1.default(signHash.toString(), 16);
    const bn2 = new bn_js_1.default(EC_ORDER, 10);
    const apiKeyHash = `${bn1.toString(16)}|${bn1.mod(bn2).toString(16)}`;
    const signature = yield (0, starkex_lib_1.genSimplifyOnBoardingSignature)(privateKey, bn1.mod(bn2));
    return {
        apiKeyHash,
        simplifySignature: signature,
    };
});
const basicOnboarding = (env_1, nonce_1, ...args_1) => __awaiter(void 0, [env_1, nonce_1, ...args_1], void 0, function* (env, nonce, signingMethod = interface_1.SigningMethod.TypedData, account, keyPair, token) {
    if (!account) {
        throw new Error('请先链接钱包');
    }
    if (!KEY_DERIVATION_SUPPORTED_SIGNING_METHODS.includes(signingMethod)) {
        throw new Error('Unsupported signing method for API key derivation');
    }
    const signer = new eth_signing_1.SignOnboardingAction(__1.web3, env.registerChainId);
    const message = {
        action: 'ApeX Onboarding',
        onlySignOn: 'https://pro.apex.exchange',
        nonce: nonce,
    };
    const signature = yield signer.sign(account, signingMethod, message, env);
    const qrs = "?" + qs_1.default.stringify({
        starkKey: keyPair.publicKey,
        starkKeyYCoordinate: keyPair.publicKeyYCoordinate,
        ethereumAddress: account,
        token: token || 'USDC',
    });
    const res = yield axios_1.default.post(`${env.url}/api/v2/onboarding${qrs}`, {}, {
        headers: {
            'Content-Type': "application/x-www-form-urlencoded; charset=UTF-8",
            'APEX-SIGNATURE': typeof signature === 'string' ? signature : signature.value,
            'Apex-Ethereum-Address': account
        }
    });
    return res;
});
exports.basicOnboarding = basicOnboarding;
const simplifyOnboarding = (env_1, nonce_1, ...args_1) => __awaiter(void 0, [env_1, nonce_1, ...args_1], void 0, function* (env, nonce, signingMethod = interface_1.SigningMethod.TypedData, account, keyPair, token) {
    if (!account) {
        throw new Error('请先链接钱包');
    }
    if (!KEY_DERIVATION_SUPPORTED_SIGNING_METHODS.includes(signingMethod)) {
        throw new Error('Unsupported signing method for API key derivation');
    }
    const { privateKey, publicKey } = keyPair;
    const { apiKeyHash, simplifySignature } = yield genNewSignature({
        account: account,
        privateKey,
        publicKey,
        nonce,
    });
    const qrs = "?" + qs_1.default.stringify({
        starkKey: keyPair.publicKey,
        starkKeyYCoordinate: keyPair.publicKeyYCoordinate,
        ethereumAddress: account,
        token: token || 'USDC',
    });
    const res = yield axios_1.default.post(`${env.url}/api/v2/onboarding${qrs}`, {}, {
        headers: {
            'Content-Type': "application/x-www-form-urlencoded; charset=UTF-8",
            'APEX-SIGNATURE': simplifySignature,
            'Apex-Ethereum-Address': account
        }
    });
    return res;
});
exports.simplifyOnboarding = simplifyOnboarding;
