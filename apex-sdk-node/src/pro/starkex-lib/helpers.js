const BN = require('bn.js');
const { keccak256 } = require('ethereum-cryptography/keccak');
const { starkEc } = require('./lib/starkware/crypto-js');

function clientIdToNonce(clientId) {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = (hash * 31 + clientId.charCodeAt(i)) & 0xffffffff;
  }
  return hash;
}

function assetToBaseQuantumNumber(asset, humanAmount, multiplier) {
  const amount = parseFloat(humanAmount);
  const mult = parseInt(multiplier.replace(/^1e/, '1'));
  return Math.floor(amount * mult).toString();
}

function toQuantumsExact(humanAmount, multiplier) {
  return assetToBaseQuantumNumber(null, humanAmount, multiplier);
}

function isoTimestampToEpochHours(isoTimestamp) {
  const date = new Date(isoTimestamp);
  return Math.floor(date.getTime() / (1000 * 3600));
}

function isoTimestampToEpochSeconds(isoTimestamp) {
  return isoTimestampToEpochHours(isoTimestamp) * 3600;
}

function addOrderExpirationBufferHours(epochHours) {
  return (parseInt(epochHours) + 24).toString();
}

function getSignedAssetName(symbol) {
  return symbol;
}

function getSignedAssetId(assetName, oracleName) {
  const input = `${assetName}:${oracleName}`;
  const hash = keccak256(Buffer.from(input));
  return '0x' + Buffer.from(hash).toString('hex').slice(0, 64);
}

function asSimpleSignature(signature) {
  return {
    r: signature.r.toString(16),
    s: signature.s.toString(16)
  };
}

function serializeSignature(signature) {
  return signature.r.padStart(64, '0') + signature.s.padStart(64, '0');
}

function deserializeSignature(signature) {
  if (typeof signature !== 'string' || signature.length !== 128) {
    throw new Error('Invalid signature format');
  }
  return {
    r: new BN(signature.slice(0, 64), 16),
    s: new BN(signature.slice(64), 16)
  };
}

function asEcKeyPairPublic(publicKey, useSecondYCoordinate) {
  throw new Error('asEcKeyPairPublic not implemented; provide publicKeyYCoordinate');
}

function asEcKeyPair(privateKey) {
  return starkEc.keyFromPrivate(privateKey, 'hex');
}

module.exports = {
  clientIdToNonce,
  assetToBaseQuantumNumber,
  toQuantumsExact,
  isoTimestampToEpochHours,
  isoTimestampToEpochSeconds,
  addOrderExpirationBufferHours,
  getSignedAssetName,
  getSignedAssetId,
  asSimpleSignature,
  serializeSignature,
  deserializeSignature,
  asEcKeyPairPublic,
  asEcKeyPair
};
