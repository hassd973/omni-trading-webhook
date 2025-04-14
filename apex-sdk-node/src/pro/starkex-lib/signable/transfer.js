const BN = require('bn.js');
const { COLLATERAL_ASSET, COLLATERAL_ASSET_ID_BY_NETWORK_ID } = require('../constants');
const { isoTimestampToEpochHours } = require('../helpers');
const { getPedersenHash } = require('../crypto/proxies');
const { decToBn, hexToBn, intToBn } = require('../lib/util');
const { TRANSFER_FEE_ASSET_ID_BN, TRANSFER_FIELD_BIT_LENGTHS } = require('./constants');
const { getCacheablePedersenHash } = require('./hashes');
const { StarkSignable } = require('./stark-signable');

// Note: Fees are not supported for transfers.
const MAX_AMOUNT_FEE_BN = new BN(0);

const TRANSFER_PREFIX = 4;
const TRANSFER_PADDING_BITS = 81;

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
  // Convert humanAmount to quanta (e.g., 1.5 USDC to 1500000 for 1e6)
  const amount = parseFloat(humanAmount);
  const mult = parseInt(multiplier.replace(/^1e/, '1'));
  return Math.floor(amount * mult).toString();
}

/**
 * Wrapper object to convert a transfer, and hash, sign, and verify its signature.
 */
class SignableTransfer extends StarkSignable {
  static fromTransfer(transfer, networkId) {
    const nonce = clientIdToNonce(transfer.clientId).toString();
    const quantumsAmount = assetToBaseQuantumNumber(COLLATERAL_ASSET, transfer.humanAmount, '1e6');
    const expirationEpochHours = isoTimestampToEpochHours(transfer.expirationIsoTimestamp);

    return new SignableTransfer(
      {
        senderPositionId: transfer.senderPositionId,
        receiverPositionId: transfer.receiverPositionId,
        receiverPublicKey: transfer.receiverPublicKey,
        quantumsAmount,
        nonce,
        expirationEpochHours
      },
      networkId
    );
  }

  constructor(message, networkId) {
    super(message, networkId);
  }

  async calculateHash() {
    const senderPositionIdBn = decToBn(this.message.senderPositionId);
    const receiverPositionIdBn = decToBn(this.message.receiverPositionId);
    const receiverPublicKeyBn = hexToBn(this.message.receiverPublicKey);
    const quantumsAmountBn = decToBn(this.message.quantumsAmount);
    const nonceBn = decToBn(this.message.nonce);
    const expirationEpochHoursBn = intToBn(this.message.expirationEpochHours);

    if (senderPositionIdBn.bitLength() > TRANSFER_FIELD_BIT_LENGTHS.positionId) {
      throw new Error('SignableTransfer: senderPositionId exceeds max value');
    }
    if (receiverPositionIdBn.bitLength() > TRANSFER_FIELD_BIT_LENGTHS.positionId) {
      throw new Error('SignableTransfer: receiverPositionId exceeds max value');
    }
    if (receiverPublicKeyBn.bitLength() > TRANSFER_FIELD_BIT_LENGTHS.receiverPublicKey) {
      throw new Error('SignableTransfer: receiverPublicKey exceeds max value');
    }
    if (quantumsAmountBn.bitLength() > TRANSFER_FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableTransfer: quantumsAmount exceeds max value');
    }
    if (nonceBn.bitLength() > TRANSFER_FIELD_BIT_LENGTHS.nonce) {
      throw new Error('SignableTransfer: nonce exceeds max value');
    }
    if (expirationEpochHoursBn.bitLength() > TRANSFER_FIELD_BIT_LENGTHS.expirationEpochHours) {
      throw new Error('SignableTransfer: expirationEpochHours exceeds max value');
    }

    const assetIds = await getCacheablePedersenHash(
      hexToBn(COLLATERAL_ASSET_ID_BY_NETWORK_ID()),
      TRANSFER_FEE_ASSET_ID_BN
    );

    const transferPart1 = await getPedersenHash(assetIds, receiverPublicKeyBn);
    const transferPart2 = new BN(senderPositionIdBn.toString(), 10)
      .iushln(TRANSFER_FIELD_BIT_LENGTHS.positionId)
      .iadd(receiverPositionIdBn)
      .iushln(TRANSFER_FIELD_BIT_LENGTHS.positionId)
      .iadd(senderPositionIdBn)
      .iushln(TRANSFER_FIELD_BIT_LENGTHS.nonce)
      .iadd(nonceBn);
    const transferPart3 = new BN(TRANSFER_PREFIX)
      .iushln(TRANSFER_FIELD_BIT_LENGTHS.quantumsAmount)
      .iadd(quantumsAmountBn)
      .iushln(TRANSFER_FIELD_BIT_LENGTHS.quantumsAmount)
      .iadd(MAX_AMOUNT_FEE_BN)
      .iushln(TRANSFER_FIELD_BIT_LENGTHS.expirationEpochHours)
      .iadd(expirationEpochHoursBn)
      .iushln(TRANSFER_PADDING_BITS);

    return getPedersenHash(await getPedersenHash(transferPart1, transferPart2), transferPart3);
  }

  async getNonce() {
    return this.message.nonce;
  }

  toStarkware() {
    return this.message;
  }
}

module.exports = { SignableTransfer };
