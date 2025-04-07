import BN from 'bn.js';
import { COLLATERAL_ASSET } from '../constants';
import { isoTimestampToEpochHours, clientIdToNonce, assetToBaseQuantumNumber } from '../helpers';
import { getPedersenHash } from '../lib';
import { decToBn, hexToBn, intToBn } from '../lib/util';
import { ConditionalTransferParams, NetworkId, StarkwareConditionalTransfer } from '../types';
import { StarkSignable } from './stark-signable';

export class SignableConditionalTransfer extends StarkSignable<StarkwareConditionalTransfer> {
  static fromTransfer(transfer: ConditionalTransferParams, networkId: NetworkId): SignableConditionalTransfer {
    const nonce = clientIdToNonce(transfer.clientId).toString();
    const quantumsAmount = assetToBaseQuantumNumber(COLLATERAL_ASSET, transfer.humanAmount, '1e6');
    const expirationEpochHours = isoTimestampToEpochHours(transfer.expirationIsoTimestamp).toString();
    const condition = transfer.fact;

    return new SignableConditionalTransfer(
      {
        senderPositionId: transfer.senderPositionId,
        receiverPositionId: transfer.receiverPositionId,
        receiverPublicKey: transfer.receiverPublicKey,
        quantumsAmount,
        nonce,
        expirationEpochHours,
        condition,
      },
      networkId,
    );
  }

  constructor(message: StarkwareConditionalTransfer, networkId: NetworkId) {
    super(message, networkId);
  }

  protected async calculateHash(): Promise<BN> {
    const senderPositionIdBn = decToBn(this.message.senderPositionId);
    const receiverPositionIdBn = decToBn(this.message.receiverPositionId);
    const receiverPublicKeyBn = hexToBn(this.message.receiverPublicKey);
    const quantumsAmountBn = decToBn(this.message.quantumsAmount);
    const nonceBn = decToBn(this.message.nonce);
    const expirationEpochHoursBn = intToBn(this.message.expirationEpochHours);
    const conditionBn = hexToBn(this.message.condition);

    const part1 = await getPedersenHash(senderPositionIdBn, receiverPositionIdBn);
    const part2 = await getPedersenHash(nonceBn, expirationEpochHoursBn);
    return getPedersenHash(part1, part2);
  }

  toStarkware(): StarkwareConditionalTransfer {
    return this.message;
  }
}
