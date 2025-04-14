// apex-sdk-node/src/pro/starkex-lib/signable/conditional-transfer.js
const BN = require('bn.js');
const { COLLATERAL_ASSET, COLLATERAL_ASSET_ID_BY_NETWORK_ID } = require('../constants');
const { isoTimestampToEpochHours } = require('../helpers');
const { getPedersenHash } = require('../crypto/proxies');
const { decToBn, hexToBn, intToBn, factToCondition } = require('../lib/util');
const { CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS, TRANSFER_FEE_ASSET_ID_BN } = require('./constants');
const { getCacheablePedersenHash } = require('./hashes');
const { StarkSignable } = require('./stark-signable');

// Fees are not supported for conditional transfers
const MAX_AMOUNT_FEE_BN = new BN(0);
const CONDITIONAL_TRANSFER_PREFIX = 5;
const CONDITIONAL_TRANSFER_PADDING_BITS = 81;

// Temporary helpers until helpers.js provides them
function clientIdToNonce(clientId) {
  // Simple hash to number
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = (hash * 31 + clientId.charCodeAt(i)) & 0xffffffff;
  }
  return hash;
}

function toQuantumsExact(humanAmount, asset) {
  // Convert humanAmount to quanta (e.g., 1.5 USDC to 1500000 for 1e6 decimals)
  const decimals = asset === 'USDC' ? 1e6 : 1e6; // Assume USDC for now
  const amount = parseFloat(humanAmount);
  if (isNaN(amount)) throw new Error('Invalid humanAmount');
  return Math.floor(amount * decimals).toString();
}

class SignableConditionalTransfer extends StarkSignable {
  static fromTransfer(transfer, networkId) {
    const nonce = clientIdToNonce(transfer.clientId);
    const quantumsAmount = toQuantumsExact(transfer.humanAmount, COLLATERAL_ASSET);
    const expirationEpochHours = isoTimestampToEpochHours(transfer.expirationIsoTimestamp);

    return new SignableConditionalTransfer({
      senderPositionId: transfer.senderPositionId,
      receiverPositionId: transfer.receiverPositionId,
      receiverPublicKey: transfer.receiverPublicKey,
      condition: factToCondition(transfer.factRegistryAddress, transfer.fact),
      quantumsAmount,
      nonce,
      expirationEpochHours
    }, networkId);
  }

  async calculateHash() {
    const senderPositionIdBn = decToBn(this.message.senderPositionId);
    const receiverPositionIdBn = decToBn(this.message.receiverPositionId);
    const receiverPublicKeyBn = hexToBn(this.message.receiverPublicKey);
    const conditionBn = hexToBn(this.message.condition);
    const quantumsAmountBn = decToBn(this.message.quantumsAmount);
    const nonceBn = decToBn(this.message.nonce);
    const expirationEpochHoursBn = intToBn(this.message.expirationEpochHours);

    if (senderPositionIdBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.positionId) {
      throw new Error('SignableConditionalTransfer: senderPositionId exceeds max value');
    }
    if (receiverPositionIdBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.positionId) {
      throw new Error('SignableConditionalTransfer: receiverPositionId exceeds max value');
    }
    if (receiverPublicKeyBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.receiverPublicKey) {
      throw new Error('SignableConditionalTransfer: receiverPublicKey exceeds max value');
    }
    if (conditionBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.condition) {
      throw new Error('SignableConditionalTransfer: condition exceeds max value');
    }
    if (quantumsAmountBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.quantumsAmount) {
      throw new Error('SignableConditionalTransfer: quantumsAmount exceeds max value');
    }
    if (nonceBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.nonce) {
      throw new Error('SignableConditionalTransfer: nonce exceeds max value');
    }
    if (expirationEpochHoursBn.bitLength() > CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.expirationEpochHours) {
      throw new Error('SignableConditionalTransfer: expirationEpochHours exceeds max value');
    }

    const assetIds = await getCacheablePedersenHash(hexToBn(COLLATERAL_ASSET_ID_BY_NETWORK_ID()), TRANSFER_FEE_ASSET_ID_BN);
    const transferPart1 = await getPedersenHash(await getPedersenHash(assetIds, receiverPublicKeyBn), conditionBn);
    const transferPart2 = new BN(senderPositionIdBn.toString(), 10)
      .iushln(CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.positionId)
      .iadd(receiverPositionIdBn)
      .iushln(CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.positionId)
      .iadd(senderPositionIdBn)
      .iushln(CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.nonce)
      .iadd(nonceBn);
    const transferPart3 = new BN(CONDITIONAL_TRANSFER_PREFIX)
      .iushln(CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.quantumsAmount)
      .iadd(quantumsAmountBn)
      .iushln(CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.quantumsAmount)
      .iadd(MAX_AMOUNT_FEE_BN)
      .iushln(CONDITIONAL_TRANSFER_FIELD_BIT_LENGTHS.expirationEpochHours)
      .iadd(expirationEpochHoursBn)
      .iushln(CONDITIONAL_TRANSFER_PADDING_BITS);

    return getPedersenHash(await getPedersenHash(transferPart1, transferPart2), transferPart3);
  }

  toStarkware() {
    return this.message;
  }
}

module.exports = { SignableConditionalTransfer };
