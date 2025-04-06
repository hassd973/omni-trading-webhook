import BN from 'bn.js';
import { COLLATERAL_ASSET_ID_BY_NETWORK_ID } from '../constants';
import { isoTimestampToEpochHours, clientIdToNonce, assetToBaseQuantumNumber } from '../helpers';
import { getPedersenHash } from '../lib/crypto';
import { decToBn, hexToBn, intToBn } from '../lib/util';
import { WITHDRAWAL_FIELD_BIT_LENGTHS } from './constants';
import { StarkSignable } from './stark-signable';
import { getCurrency, getCurrencyV2, getPerpetual } from '../main';
const WITHDRAWAL_PREFIX = 7;
const WITHDRAWAL_PADDING_BITS = 49;
/**
 * Wrapper object to convert a withdrawal, and hash, sign, and verify its signature.
 */
export class SignableWithdrawal extends StarkSignable {
    static fromWithdrawalWithClientId(withdrawal, networkId, asset) {
        // Make the nonce by hashing the client-provided ID.
        const nonce = clientIdToNonce(withdrawal.clientId).toString(); // Fix: Convert number to string
        return SignableWithdrawal.fromWithdrawalWithNonce({
            ...withdrawal,
            clientId: undefined,
            nonce,
        }, networkId, asset);
    }
    static fromWithdrawalWithNonce(withdrawal, networkId, asset) {
        const positionId = withdrawal.positionId;
        const nonce = withdrawal.nonce;
        // Use assetToBaseQuantumNumber with resolution from currency info
        const currencys = getPerpetual() ? getCurrencyV2() : getCurrency();
        const currencyInfo = currencys.find((item) => item.id === asset);
        const quantum = `1e${currencyInfo.starkExResolution}`; // Convert resolution to string (e.g., "1e6")
        const quantumsAmount = withdrawal.humanAmount
            ? assetToBaseQuantumNumber(asset, withdrawal.humanAmount, quantum)
            : '';
        // Convert to a Unix timestamp (in hours).
        const expirationEpochHours = isoTimestampToEpochHours(withdrawal.expirationIsoTimestamp);
        return new SignableWithdrawal({
            positionId,
            nonce,
            quantumsAmount,
            expirationEpochHours,
            ethAddress: withdrawal.ethAddress || '',
        }, networkId);
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
        return getPedersenHash(await getPedersenHash(hexToBn(COLLATERAL_ASSET_ID_BY_NETWORK_ID()), ethAddressBN), packedWithdrawalBn);
    }
    async getNonce() {
        return this.message.nonce; // No .toString() needed since nonce is already a string
    }
    toStarkware() {
        return this.message;
    }
}
SignableWithdrawal.fromWithdrawal = SignableWithdrawal.fromWithdrawalWithClientId; // Alias.
