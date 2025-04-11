import { COLLATERAL_ASSET } from '../constants';
import { isoTimestampToEpochHours, clientIdToNonce, assetToBaseQuantumNumber } from '../helpers';
import { getPedersenHash } from '../lib';
import { decToBn, hexToBn, intToBn } from '../lib/util';
import { StarkSignable } from './stark-signable';
export class SignableConditionalTransfer extends StarkSignable {
    static fromTransfer(transfer, networkId) {
        const nonce = clientIdToNonce(transfer.clientId).toString();
        const quantumsAmount = assetToBaseQuantumNumber(COLLATERAL_ASSET, transfer.humanAmount, '1e6');
        const expirationEpochHours = isoTimestampToEpochHours(transfer.expirationIsoTimestamp); // Fixed: Removed .toString()
        const condition = transfer.fact;
        return new SignableConditionalTransfer({
            senderPositionId: transfer.senderPositionId,
            receiverPositionId: transfer.receiverPositionId,
            receiverPublicKey: transfer.receiverPublicKey,
            quantumsAmount,
            nonce,
            expirationEpochHours,
            condition,
        }, networkId);
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
        const expirationEpochHoursBn = intToBn(this.message.expirationEpochHours); // Works with number input
        const conditionBn = hexToBn(this.message.condition);
        const part1 = await getPedersenHash(senderPositionIdBn, receiverPositionIdBn);
        const part2 = await getPedersenHash(nonceBn, expirationEpochHoursBn);
        return getPedersenHash(part1, part2);
    }
    toStarkware() {
        return this.message;
    }
}
