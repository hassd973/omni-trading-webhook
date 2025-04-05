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
exports.StarkSignable = void 0;
const helpers_1 = require("../helpers");
const crypto_1 = require("../lib/crypto");
const crypto_js_1 = require("../lib/starkware/crypto-js");
/**
 * Base class for a STARK key signable message.
 */
class StarkSignable {
    constructor(message, networkId) {
        this._hashBN = null;
        this.message = message;
        this.networkId = networkId;
        // Sanity check.
        // if (!COLLATERAL_ASSET_ID_BY_NETWORK_ID()) {
        //   throw new Error(
        //     `Unknown network ID or unknown collateral asset for network: ${networkId}`
        //   );
        // }
    }
    /**
     * Return the message hash as a hex string, no 0x prefix.
     */
    getHash() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getHashBN()).toString(16).padStart(63, '0');
        });
    }
    getHashBN() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._hashBN === null) {
                this._hashBN = yield this.calculateHash();
            }
            return this._hashBN;
        });
    }
    /**
     * Sign the message with the given private key, represented as a hex string or hex string pair.
     */
    sign(privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashBN = yield this.getHashBN();
            const ecSignature = yield (0, crypto_1.sign)((0, helpers_1.asEcKeyPair)(privateKey), hashBN);
            const res = (0, helpers_1.serializeSignature)((0, helpers_1.asSimpleSignature)(ecSignature));
            return res;
        });
    }
    /**
     * Verify the signature is valid for a given public key.
     */
    verifySignature(signature_1, publicKey_1) {
        return __awaiter(this, arguments, void 0, function* (signature, publicKey, publicKeyYCoordinate = null) {
            const signatureStruct = (0, helpers_1.deserializeSignature)(signature);
            // If y-coordinate is available, save time by using it, instead of having to infer it.
            if (publicKeyYCoordinate !== null) {
                const ecPublicKey = crypto_js_1.starkEc.keyFromPublic({
                    x: publicKey,
                    y: publicKeyYCoordinate,
                });
                return (0, crypto_1.verify)(ecPublicKey, yield this.getHashBN(), signatureStruct);
            }
            // Return true if the signature is valid for either of the two possible y-coordinates.
            //
            // Compare with:
            // https://github.com/starkware-libs/starkex-resources/blob/1eb84c6a9069950026768013f748016d3bd51d54/crypto/starkware/crypto/signature/signature.py#L151
            const hashBN = yield this.getHashBN();
            return ((yield (0, crypto_1.verify)((0, helpers_1.asEcKeyPairPublic)(publicKey, false), hashBN, signatureStruct)) ||
                (0, crypto_1.verify)((0, helpers_1.asEcKeyPairPublic)(publicKey, true), hashBN, signatureStruct));
        });
    }
}
exports.StarkSignable = StarkSignable;
