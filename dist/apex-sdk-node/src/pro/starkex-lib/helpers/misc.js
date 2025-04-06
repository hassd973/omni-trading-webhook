import { SHA256, enc } from 'crypto-js';
import BN from 'bn.js';
import { hexToBn, utf8ToBn } from '../lib/util';
import { ORACLE_PRICE_FIELD_BIT_LENGTHS, ORDER_FIELD_BIT_LENGTHS, STARK_ORDER_SIGNATURE_EXPIRATION_BUFFER_HOURS, } from '../signable/constants';
const MAX_NONCE = new BN(2).pow(new BN(ORDER_FIELD_BIT_LENGTHS.nonce));
const ONE_SECOND_MS = 1000;
const ONE_HOUR_MS = 60 * 60 * ONE_SECOND_MS;
/**
 * Generate a nonce deterministically from an arbitrary string provided by a client.
 */
export function nonceFromClientId(clientId) {
    const hash = SHA256(clientId);
    return hexToBn(hash.toString(enc.Hex)).mod(MAX_NONCE).toString();
}
/**
 * Generate a nonce from a client ID (string or number).
 */
export function clientIdToNonce(clientId) {
    const input = typeof clientId === 'number' ? clientId.toString() : clientId;
    const hash = SHA256(input);
    const hexHash = hash.toString(enc.Hex);
    const slicedHex = hexHash.slice(0, 8); // Take first 8 chars for a 32-bit number
    return hexToBn('0x' + slicedHex).toNumber();
}
/**
 * Convert an ISO timestamp to an epoch timestamp in seconds, rounding down.
 */
export function isoTimestampToEpochSeconds(isoTimestamp) {
    return Math.floor(new Date(isoTimestamp).getTime() / ONE_SECOND_MS);
}
/**
 * Convert an ISO timestamp to an epoch timestamp in hours, rounding up.
 */
export function isoTimestampToEpochHours(isoTimestamp) {
    return Math.ceil(new Date(Number(isoTimestamp)).getTime() / ONE_HOUR_MS);
}
/**
 * Add expiration buffer to ensure an order signature is valid when it arrives on-chain.
 */
export function addOrderExpirationBufferHours(expirationEpochHours) {
    return expirationEpochHours + STARK_ORDER_SIGNATURE_EXPIRATION_BUFFER_HOURS;
}
/**
 * Get the asset name to be signed by a price oracle. It is the market name with the hyphen removed.
 */
export function getSignedAssetName(market) {
    return market.replace('-', '');
}
/**
 * Get the asset ID to be signed by a price oracle. It consists of an asset name and oracle name.
 */
export function getSignedAssetId(assetName, oracleName) {
    const assetNameBn = utf8ToBn(assetName, ORACLE_PRICE_FIELD_BIT_LENGTHS.assetName);
    const oracleNameBn = utf8ToBn(oracleName, ORACLE_PRICE_FIELD_BIT_LENGTHS.oracleName);
    const signedAssetIdBn = assetNameBn.iushln(ORACLE_PRICE_FIELD_BIT_LENGTHS.oracleName).iadd(oracleNameBn);
    return signedAssetIdBn.toString(16);
}
