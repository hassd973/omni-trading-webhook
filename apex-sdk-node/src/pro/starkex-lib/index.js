// apex-sdk-node/src/pro/starkex-lib/index.js
const constants = require('./constants');
const helpers = require('./helpers');
const keys = require('./keys');
const lib = require('./lib');
const signable = require('./signable');
const types = require('./types');
const main = require('./main');
const conditionalTransfer = require('./signable/conditional-transfer');

module.exports = {
  ...constants,
  ...helpers,
  ...keys,
  ...lib,
  ...signable,
  ...types,
  ...main,
  ...conditionalTransfer,
  // Explicit named exports from helpers
  addOrderExpirationBufferHours: helpers.addOrderExpirationBufferHours,
  isoTimestampToEpochHours: helpers.isoTimestampToEpochHours,
  stripHexPrefix: helpers.stripHexPrefix,
  asEcKeyPair: helpers.asEcKeyPair,
  asSimpleKeyPair: helpers.asSimpleKeyPair,
  // Explicit named exports from lib
  setConfig: lib.setConfig,
  setConfigV2: lib.setConfigV2,
  setCurrency: lib.setCurrency,
  setCurrencyV2: lib.setCurrencyV2,
  setPerpetual: lib.setPerpetual,
  setSymbols: lib.setSymbols,
  setSymbolsV2: lib.setSymbolsV2,
  genSimplifyOnBoardingSignature: lib.genSimplifyOnBoardingSignature,
  keyPairFromData: lib.keyPairFromData,
  KeyPair: lib.KeyPair,
  // Explicit named exports from signable
  SignableOrder: signable.SignableOrder,
  SignableConditionalTransfer: conditionalTransfer.SignableConditionalTransfer
};
