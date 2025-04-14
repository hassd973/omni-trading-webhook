// apex-sdk-node/src/pro/starkex-lib/signable/stark-signable.js
const BN = require('bn.js');
const { asEcKeyPair } = require('../helpers');
const { sign, verify } = require('../crypto/proxies');
const { starkEc } = require('../lib/starkware/crypto-js');

// Temporary helpers until helpers.js provides them
function asEcKeyPairPublic(publicKey, useSecondYCoordinate) {
  // Stub: Requires starkEc implementation
  throw new Error('asEcKeyPairPublic not implemented; provide publicKeyYCoordinate');
}

function asSimpleSignature(signature) {
  return {
    r: signature.r.toString(16),
    s: signature.s.toString(16)
  };
}

function deserializeSignature(signature) {
  // Expect 128-char hex (64 for r, 64 for s)
  if (typeof signature !== 'string' || signature.length !== 128) {
    throw new Error('Invalid signature format');
  }
  return {
    r: new BN(signature.slice(0, 64), 16),
    s: new BN(signature.slice(64), 16)
  };
}

function serializeSignature(signature) {
  // Concatenate r and s as 64-char hex
  return signature.r.padStart(64, '0') + signature.s.padStart(64, '0');
}

/**
 * Base class for a STARK key signable message.
 */
class StarkSignable {
  constructor(message, networkId) {
    this.message = message;
    this.networkId = networkId;
    this._hashBN = null;
  }

  /**
   * Return the message hash as a hex string, no 0x prefix.
   */
  async getHash() {
    return (await this.getHashBN()).toString(16).padStart(63, '0');
  }

  async getHashBN() {
    if (this._hashBN === null) {
      this._hashBN = await this.calculateHash();
    }
    return this._hashBN;
  }

  /**
   * Sign the message with the given private key.
   */
  async sign(privateKey) {
    const keyString = typeof privateKey === 'string' ? privateKey : privateKey.privateKey;
    const hashBN = await this.getHashBN();
    const ecSignature = await sign(asEcKeyPair(keyString), hashBN);
    return serializeSignature(asSimpleSignature(ecSignature));
  }

  /**
   * Verify the signature is valid for a given public key.
   */
  async verifySignature(signature, publicKey, publicKeyYCoordinate = null) {
    const signatureStruct = deserializeSignature(signature);

    // If y-coordinate is provided, use it
    if (publicKeyYCoordinate !== null) {
      const ecPublicKey = starkEc.keyFromPublic({
        x: publicKey,
        y: publicKeyYCoordinate
      });
      return verify(ecPublicKey, await this.getHashBN(), signatureStruct);
    }

    // Try both y-coordinates
    try {
      return (
        (await verify(asEcKeyPairPublic(publicKey, false), await this.getHashBN(), signatureStruct)) ||
        (await verify(asEcKeyPairPublic(publicKey, true), await this.getHashBN(), signatureStruct))
      );
    } catch (e) {
      return false; // Fallback if asEcKeyPairPublic is unimplemented
    }
  }

  /**
   * Calculate the message hash (abstract).
   */
  async calculateHash() {
    throw new Error('calculateHash must be implemented by subclass');
  }
}

module.exports = { StarkSignable };
