const BN = require('bn.js');
const BigNumber = require('bignumber.js');
const { COLLATERAL_ASSET, COLLATERAL_ASSET_ID_BY_NETWORK_ID } = require('../constants');
const { isoTimestampToEpochHours } = require('../helpers');
const { getPedersenHash } = require('../crypto/proxies');
const { decToBn, hexToBn, intToBn } = require('../lib/util');
const { WITHDRAWAL_FIELD_BIT_LENGTHS } = require('./constants');
const { StarkSignable } = require('./stark-signable');
const { getCurrency, getCurrencyV2, getPerpetual } = require('../main');

const WITHDRAWAL_PREFIX = 7;
const WITHDRAWAL_PADDING_BITS = 49;

// Temporary helpers until helpers.js provides them
function clientIdToNonce(clientId) {
  // Simple hash to number
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = (hash * 31 + clientId.charCodeAt(i)) & 0xffffffff;
  }
  return hash;
}

function assetToBaseQuantumNumber(asset, humanAmount, multiplier) {
  // Convert humanAmount to quanta (e.g., 1.5 to 1500000 for 1e6)
  const amount = parseFloat(humanAmount);
  const mult = parseInt(multiplier.replace(/^1e/, '1'));
  return Math.floor(amount * mult).toString();
}

/**
 * Wrapper object to convert a withdrawal, and hash, sign, and verify its signature.
 */
class SignableWithdrawal extends StarkSignable {
  static fromWithdrawal = SignableWithdrawal.fromWithdrawalWithClientId;

  static fromWithdrawalWithClientId(withdrawal, networkId, asset) {
    const nonce = clientIdToNonce(withdrawal.clientId).toString();
    return SignableWithdrawal.fromWithdrawalWithNonce(
      {
        ...withdrawal,
        clientId: undefined,
        nonce
      },
      networkId,
      asset
    );
  }

  static fromWithdrawalWithNonce(withdrawal, networkId, asset) {
    const positionId = withdrawal.positionId;
    const nonce = withdrawal.nonce;

    // Use assetToBaseQuantumNumber with resolution from currency info
    const currencys = getPerpetual() ? getCurrencyV2() : getCurrency();
    const currencyInfo = currencys.find((item) => item.id === asset);
    const quantum = `1e${currencyInfo.starkExResolution}`;
    const quantumsAmount = withdrawal.humanAmount
      ? assetToBaseQuantumNumber(asset, withdrawal.humanAmount, quantum)
      : '';

    const expirationEpochHours = isoTimestampToEpochHours(withdrawal.expirationIsoTimestamp);

    return new SignableWithdrawal(
      {
        positionId,
        nonce,
        quantumsAmount,
        expirationEpochHours,
        ethAddress: withdrawal.ethAddress || ''
      },
      networkId
    );
  }

  constructor(message, networkId) {
    super(message, networkId);
  }

  async calculateHash() {
    const ethAddressBN = hexToBn(this.message.ethAddress);
    const positionIdBn = decToBn(this.message.positionId);
    const nonceBn = decToBn(this.message.nonce);
    const quantumsAmountBn = decToBn(this.message.quantumsAmount);
    const expirationEpochHoursBn = intToBn(this.message.expirationEpochHours);

    if (positionIdBn.bitLength() > WITHDRAWAL_FIELD_BIT_LENGTHS.positionId) {
      throw new Error('SignableWithdrawal: positionId exceeds max value');
    }
    if (nonceBn.bitLength() > WITHDRAWAL_FIELD_BIT_LENGTHS.nonce) {
      throw new Error('SignableWithdrawal: nonce exceeds max value');
    }
    if (quantumsAmountBn.bitLength() > WITHDRAWAL_FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableWithdrawal: quantumsAmount exceeds max value');
    }
    if (expirationEpochHoursBn.bitLength() > WITHDRAWAL_FIELD_BIT_LENGTHS.expirationEpochHours) {
      throw new Error('SignableWithdrawal: expirationEpochHours exceeds max value');
    }

    const packedWithdrawalBn = new BN(WITHDRAWAL_PREFIX)
      .iushln(WITHDRAWAL_FIELD_BIT_LENGTHS.positionId)
      .iadd(positionIdBn)
      .iushln(WITHDRAWAL_FIELD_BIT_LENGTHS.nonce)
      .iadd(nonceBn)
      .iushln(WITHDRAWAL_FIELD_BIT_LENGTHS.quantumsAmount)
      .iadd(quantumsAmountBn)
      .iushln(WITHDRAWAL_FIELD_BIT_LENGTHS.expirationEpochHours)
      .iadd(expirationEpochHoursBn)
      .iushln(WITHDRAWAL_PADDING_BITS);

    return getPedersenHash(
      await getPedersenHash(hexToBn(COLLATERAL_ASSET_ID_BY_NETWORK_ID()), ethAddressBN),
      packedWithdrawalBn
    );
  }

  async getNonce() {
    return this.message.nonce;
  }

  toStarkware() {
    return this.message;
  }
}

module.exports = { SignableWithdrawal };
