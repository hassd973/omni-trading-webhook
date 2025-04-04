"use strict";
/**
 * Wrappers for crypto functions, allowing implementations to be swapped out.
 */
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
exports.setGlobalStarkHashImplementationNoSanityCheck = setGlobalStarkHashImplementationNoSanityCheck;
exports.setGlobalStarkSigningImplementationNoSanityCheck = setGlobalStarkSigningImplementationNoSanityCheck;
exports.setGlobalStarkVerificationImplementationNoSanityCheck = setGlobalStarkVerificationImplementationNoSanityCheck;
exports.setGlobalStarkHashImplementation = setGlobalStarkHashImplementation;
exports.setGlobalStarkSigningImplementation = setGlobalStarkSigningImplementation;
exports.setGlobalStarkVerificationImplementation = setGlobalStarkVerificationImplementation;
exports.getPedersenHash = getPedersenHash;
exports.sign = sign;
exports.verify = verify;
const bn_js_1 = __importDefault(require("bn.js"));
const helpers_1 = require("../../helpers");
const starkware_1 = require("../starkware");
const TEST_SIGNATURE = {
    r: 'edf3922fdf0c1b98a861a38874120a437e33c08841923317aeb8ec6bad1400',
    s: 'a658327ad247b8e816aadd7758d96450f8d43c691aadf768cadd8784f3b8ef',
};
const TEST_KEY_PAIR = (0, helpers_1.asEcKeyPair)('1');
// Global state for all STARK signables.
let globalHashFunction = starkware_1.pedersen;
let globalSigningFunction = starkware_1.sign;
let globalVerificationFunction = starkware_1.verify;
/**
 * Set the hash function implementation that will be used for all StarkSignable objects.
 */
function setGlobalStarkHashImplementationNoSanityCheck(fn) {
    globalHashFunction = fn;
}
/**
 * Set the signing implementation that will be used for all StarkSignable objects.
 */
function setGlobalStarkSigningImplementationNoSanityCheck(fn) {
    globalSigningFunction = fn;
}
/**
 * Set the signature verification implementation that will be used for all StarkSignable objects.
 */
function setGlobalStarkVerificationImplementationNoSanityCheck(fn) {
    globalVerificationFunction = fn;
}
/**
 * Set the hash function implementation that will be used for all StarkSignable objects.
 */
function setGlobalStarkHashImplementation(fn) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield fn(new bn_js_1.default(0), new bn_js_1.default(1));
        if (!result.eq(new bn_js_1.default('2001140082530619239661729809084578298299223810202097622761632384561112390979'))) {
            throw new Error('setGlobalStarkHashImplementation: Sanity check failed');
        }
        setGlobalStarkHashImplementationNoSanityCheck(fn);
    });
}
/**
 * Set the signing implementation that will be used for all StarkSignable objects.
 */
function setGlobalStarkSigningImplementation(fn) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield fn(TEST_KEY_PAIR, new bn_js_1.default(1));
        if (!(result.r.eq(new bn_js_1.default(TEST_SIGNATURE.r, 16)) && result.s.eq(new bn_js_1.default(TEST_SIGNATURE.s, 16)))) {
            // If the result doesn't match the test signature, it may still be valid, so check with the
            // signature verification function.
            const isValid = globalVerificationFunction(TEST_KEY_PAIR, new bn_js_1.default(1), (0, helpers_1.asSimpleSignature)(result));
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            if (!isValid) {
                throw new Error('setGlobalStarkSigningImplementation: Sanity check failed');
            }
        }
        setGlobalStarkSigningImplementationNoSanityCheck(fn);
    });
}
/**
 * Set the signature verification implementation that will be used for all StarkSignable objects.
 */
function setGlobalStarkVerificationImplementation(fn) {
    return __awaiter(this, void 0, void 0, function* () {
        const isValid = yield fn(TEST_KEY_PAIR, new bn_js_1.default(1), TEST_SIGNATURE);
        if (!isValid) {
            throw new Error('setGlobalStarkVerificationImplementation: Sanity check failed');
        }
        const isValid2 = yield fn(TEST_KEY_PAIR, new bn_js_1.default(2), TEST_SIGNATURE);
        if (isValid2) {
            throw new Error('setGlobalStarkVerificationImplementation: Sanity check failed');
        }
        setGlobalStarkVerificationImplementationNoSanityCheck(fn);
    });
}
/**
 * Calculate a pedersen hash.
 */
function getPedersenHash(left, right) {
    return __awaiter(this, void 0, void 0, function* () {
        return globalHashFunction(left, right);
    });
}
/**
 * Sign a message.
 */
function sign(key, message) {
    return __awaiter(this, void 0, void 0, function* () {
        return globalSigningFunction(key, message);
    });
}
/**
 * Verify a signature.
 */
function verify(key, message, signature) {
    return __awaiter(this, void 0, void 0, function* () {
        return globalVerificationFunction(key, message, signature);
    });
}
