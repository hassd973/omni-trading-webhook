// apex-sdk-node/src/pro/starkex-lib/crypto/proxies.js
/**
 * Wrappers for crypto functions, allowing implementations to be swapped out.
 */
const BN = require('bn.js');
const elliptic = require('elliptic');
const { asEcKeyPair } = require('../helpers');
const { pedersen: defaultHash, sign: defaultSign, verify: defaultVerify } = require('./starkware');

// Temporary asSimpleSignature until helpers.js provides it
function asSimpleSignature(signature) {
  return {
    r: signature.r.toString(16),
    s: signature.s.toString(16)
  };
}

const TEST_SIGNATURE = {
  r: 'edf3922fdf0c1b98a861a38874120a437e33c08841923317aeb8ec6bad1400',
  s: 'a658327ad247b8e816aadd7758d96450f8d43c691aadf768cadd8784f3b8ef'
};
const TEST_KEY_PAIR = asEcKeyPair('1');

// Global state for all STARK signables
let globalHashFunction = defaultHash;
let globalSigningFunction = defaultSign;
let globalVerificationFunction = defaultVerify;

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
async function setGlobalStarkHashImplementation(fn) {
  const result = await fn(new BN(0), new BN(1));
  if (!result.eq(new BN('2001140082530619239661729809084578298299223810202097622761632384561112390979'))) {
    throw new Error('setGlobalStarkHashImplementation: Sanity check failed');
  }
  setGlobalStarkHashImplementationNoSanityCheck(fn);
}

/**
 * Set the signing implementation that will be used for all StarkSignable objects.
 */
async function setGlobalStarkSigningImplementation(fn) {
  const result = await fn(TEST_KEY_PAIR, new BN(1));
  if (!(result.r.eq(new BN(TEST_SIGNATURE.r, 16)) && result.s.eq(new BN(TEST_SIGNATURE.s, 16)))) {
    const isValid = await globalVerificationFunction(TEST_KEY_PAIR, new BN(1), asSimpleSignature(result));
    if (!isValid) {
      throw new Error('setGlobalStarkSigningImplementation: Sanity check failed');
    }
  }
  setGlobalStarkSigningImplementationNoSanityCheck(fn);
}

/**
 * Set the signature verification implementation that will be used for all StarkSignable objects.
 */
async function setGlobalStarkVerificationImplementation(fn) {
  const isValid = await fn(TEST_KEY_PAIR, new BN(1), TEST_SIGNATURE);
  if (!isValid) {
    throw new Error('setGlobalStarkVerificationImplementation: Sanity check failed');
  }
  const isValid2 = await fn(TEST_KEY_PAIR, new BN(2), TEST_SIGNATURE);
  if (isValid2) {
    throw new Error('setGlobalStarkVerificationImplementation: Sanity check failed');
  }
  setGlobalStarkVerificationImplementationNoSanityCheck(fn);
}

/**
 * Calculate a pedersen hash.
 */
async function getPedersenHash(left, right) {
  return globalHashFunction(left, right);
}

/**
 * Sign a message.
 */
async function sign(key, message) {
  return globalSigningFunction(key, message);
}

/**
 * Verify a signature.
 */
async function verify(key, message, signature) {
  return globalVerificationFunction(key, message, signature);
}

module.exports = {
  setGlobalStarkHashImplementationNoSanityCheck,
  setGlobalStarkSigningImplementationNoSanityCheck,
  setGlobalStarkVerificationImplementationNoSanityCheck,
  setGlobalStarkHashImplementation,
  setGlobalStarkSigningImplementation,
  setGlobalStarkVerificationImplementation,
  getPedersenHash,
  sign,
  verify
};
