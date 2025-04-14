// apex-sdk-node/src/pro/starkex-lib/signable/index.js
const BN = require('bn.js');
const { asEcKeyPair } = require('../helpers');
const { sign } = require('../crypto/proxies');

// Temporary helpers until helpers.js provides them
function asSimpleSignature(signature) {
  return {
    r: signature.r.toString(16),
    s: signature.s.toString(16)
  };
}

function serializeSignature(signature) {
  // Concatenate r and s as 64-char hex (no '0x')
  return signature.r.padStart(64, '0') + signature.s.padStart(64, '0');
}

// Stub for hashInWorkerThread
let hashInWorkerThread = (a, b) => {
  throw new Error('Cannot use hashInWorkerThread() since worker_threads is not available');
};

try {
  require('worker_threads');
  hashInWorkerThread = require('./hash-in-worker-thread').hashInWorkerThread;
} catch (error) {
  // Intentionally empty
}

// Generate simplified onboarding signature
async function genSimplifyOnBoardingSignature(privateKey, apikeyHash) {
  const keyString = typeof privateKey === 'string' ? privateKey : privateKey.privateKey;
  const ecSignature = await sign(asEcKeyPair(keyString), apikeyHash);
  return serializeSignature(asSimpleSignature(ecSignature));
}

module.exports = {
  SignableConditionalTransfer: require('./conditional-transfer').SignableConditionalTransfer,
  preComputeHashes: require('./hashes').preComputeHashes,
  SignableOraclePrice: require('./oracle-price').SignableOraclePrice,
  SignableOrder: require('./order').SignableOrder,
  StarkSignable: require('./stark-signable').StarkSignable,
  SignableTransfer: require('./transfer').SignableTransfer,
  SignableWithdrawal: require('./withdrawal').SignableWithdrawal,
  hashInWorkerThread,
  genSimplifyOnBoardingSignature
};
