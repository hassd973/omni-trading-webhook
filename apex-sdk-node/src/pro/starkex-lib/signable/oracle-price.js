// apex-sdk-node/src/pro/starkex-lib/signable/oracle-price.js
const Big = require('big.js');
const BN = require('bn.js');
const { isoTimestampToEpochHours } = require('../helpers');
const { getPedersenHash } = require('../crypto/proxies');
const { decToBn, hexToBn, intToBn } = require('../lib/util');
const { ORACLE_PRICE_DECIMALS, ORACLE_PRICE_FIELD_BIT_LENGTHS } = require('./constants');
const { StarkSignable } = require('./stark-signable');
const { keccak256 } = require('ethereum-cryptography/keccak');

// Temporary helpers until helpers.js provides them
function getSignedAssetName(symbol) {
  // Return symbol as-is (e.g., 'BTC-USD')
  return symbol;
}

function getSignedAssetId(assetName, oracleName) {
  // Hash assetName and oracleName to a hex string
  const input = `${assetName}:${oracleName}`;
  const hash = keccak256(Buffer.from(input));
  return '0x' + Buffer.from(hash).toString('hex').slice(0, 64);
}

function isoTimestampToEpochSeconds(isoTimestamp) {
  // Convert ISO timestamp to seconds using isoTimestampToEpochHours
  const hours = isoTimestampToEpochHours(isoTimestamp);
  return Math.floor(hours * 3600);
}

/**
 * Wrapper object to hash, sign, and verify an oracle price.
 */
class SignableOraclePrice extends StarkSignable {
  static fromPriceWithMarket(params, networkId) {
    if (typeof params.symbol !== 'string') {
      throw new Error('SignableOraclePrice.fromPrice: market must be a string');
    }
    const assetName = getSignedAssetName(params.symbol);
    return SignableOraclePrice.fromPriceWithAssetName(
      {
        ...params,
        assetName
      },
      networkId
    );
  }

  static fromPriceWithAssetName(params, networkId) {
    if (typeof params.assetName !== 'string') {
      throw new Error('SignableOraclePrice.fromPrice: assetName must be a string');
    }
    if (typeof params.oracleName !== 'string') {
      throw new Error('SignableOraclePrice.fromPrice: oracleName must be a string');
    }
    if (typeof params.humanPrice !== 'string') {
      throw new Error('SignableOraclePrice.fromPrice: humanPrice must be a string');
    }
    if (typeof params.isoTimestamp !== 'string') {
      throw new Error('SignableOraclePrice.fromPrice: isoTimestamp must be a string');
    }

    const signedAssetId = getSignedAssetId(params.assetName, params.oracleName);

    const signedPrice = new Big(params.humanPrice);
    signedPrice.e += ORACLE_PRICE_DECIMALS;

    if (!signedPrice.mod(1).eq(0)) {
      throw new Error('SignableOraclePrice.fromPrice: humanPrice can have at most 18 decimals of precision');
    }

    const expirationEpochSeconds = isoTimestampToEpochSeconds(params.isoTimestamp);

    return new SignableOraclePrice(
      {
        signedAssetId,
        signedPrice: signedPrice.toFixed(0),
        expirationEpochSeconds
      },
      networkId
    );
  }

  async calculateHash() {
    const priceBn = decToBn(this.message.signedPrice);
    const timestampEpochSecondsBn = intToBn(this.message.expirationEpochSeconds);
    const signedAssetId = hexToBn(this.message.signedAssetId);

    if (priceBn.bitLength() > ORACLE_PRICE_FIELD_BIT_LENGTHS.price) {
      throw new Error('SignableOraclePrice: price exceeds max value');
    }
    if (timestampEpochSecondsBn.bitLength() > ORACLE_PRICE_FIELD_BIT_LENGTHS.timestampEpochSeconds) {
      throw new Error('SignableOraclePrice: timestampEpochSeconds exceeds max value');
    }

    const priceAndTimestamp = priceBn
      .iushln(ORACLE_PRICE_FIELD_BIT_LENGTHS.timestampEpochSeconds)
      .iadd(timestampEpochSecondsBn);

    return getPedersenHash(signedAssetId, priceAndTimestamp);
  }
}

module.exports = { SignableOraclePrice };
