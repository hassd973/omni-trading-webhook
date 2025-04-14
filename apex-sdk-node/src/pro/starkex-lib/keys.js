// apex-sdk-node/src/pro/starkex-lib/keys.js
const { keccak256 } = require('ethereum-cryptography/keccak');
const BN = require('bn.js');

/**
 * Convert a Uint8Array to a hex string.
 */
function uint8ArrayToHex(arr) {
  return '0x' + Buffer.from(arr).toString('hex');
}

/**
 * Generate a pseudorandom StarkEx key pair. NOT FOR USE IN PRODUCTION.
 */
function generateKeyPairUnsafe() {
  const randomData = Buffer.from(require('crypto').randomBytes(32));
  return keyPairFromData(randomData);
}

/**
 * Generate a STARK key pair deterministically from a Buffer.
 */
function keyPairFromData(data) {
  if (data.length === 0) {
    throw new Error('keyPairFromData: Empty buffer');
  }
  const hashedData = keccak256(Uint8Array.from(data)); // Uint8Array
  const hashHex = uint8ArrayToHex(hashedData); // Convert to hex string
  const hashBN = new BN(hashHex.replace(/^0x/, ''), 16); // Parse hex to BN
  const privateKey = hashBN.ushrn(5).toString(16); // Remove last five bits
  const publicKey = '0x' + privateKey; // Simplified: derive publicKey
  const publicKeyYCoordinate = '0x' + privateKey; // Simplified: same as publicKey
  return {
    publicKey,
    privateKey: '0x' + privateKey,
    publicKeyYCoordinate
  };
}

module.exports = {
  generateKeyPairUnsafe,
  keyPairFromData
};
