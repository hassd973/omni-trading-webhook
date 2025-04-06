import { keccak256 } from 'ethereum-cryptography/keccak';
import { asEcKeyPair, asSimpleKeyPair } from './helpers';
import { hexToBn, randomBuffer } from './lib/util';
/**
 * Convert a Uint8Array to a hex string.
 */
function uint8ArrayToHex(arr) {
    return '0x' + Buffer.from(arr).toString('hex');
}
/**
 * Generate a pseudorandom StarkEx key pair. NOT FOR USE IN PRODUCTION.
 */
export function generateKeyPairUnsafe() {
    return keyPairFromData(randomBuffer(32));
}
/**
 * Generate a STARK key pair deterministically from a Buffer.
 */
export function keyPairFromData(data) {
    if (data.length === 0) {
        throw new Error('keyPairFromData: Empty buffer');
    }
    const hashedData = keccak256(Uint8Array.from(data)); // Uint8Array
    const hashHex = uint8ArrayToHex(hashedData); // Convert to hex string
    const hashBN = hexToBn(hashHex); // Now works with string
    const privateKey = hashBN.iushrn(5).toString('hex'); // Remove the last five bits
    return asSimpleKeyPair(asEcKeyPair(privateKey));
}
