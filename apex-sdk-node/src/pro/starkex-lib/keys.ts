import { keccak256 } from 'ethereum-cryptography/keccak';
import BN from 'bn.js'; // Add missing BN import

import { asEcKeyPair, asSimpleKeyPair } from './helpers';
import { hexToBn, randomBuffer } from './lib/util';
import { KeyPairWithYCoordinate } from './types';

/**
 * Generate a pseudorandom StarkEx key pair. NOT FOR USE IN PRODUCTION.
 */
export function generateKeyPairUnsafe(): KeyPairWithYCoordinate {
  return keyPairFromData(randomBuffer(32));
}

/**
 * Generate a STARK key pair deterministically from a Buffer.
 */
export function keyPairFromData(data: Buffer): KeyPairWithYCoordinate {
  if (data.length === 0) {
    throw new Error('keyPairFromData: Empty buffer');
  }
  const hashedData = keccak256(Uint8Array.from(data)); // Fix: Convert Buffer to Uint8Array
  const hashBN = hexToBn(hashedData); // Use hex string directly
  const privateKey = hashBN.iushrn(5).toString('hex'); // Remove the last five bits
  return asSimpleKeyPair(asEcKeyPair(privateKey));
}
