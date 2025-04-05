import { keccak256 } from 'ethereum-cryptography/keccak';
import { toHex } from 'ethereum-cryptography/utils';
export function deriveZkKey(seed) {
    const hash = keccak256(Buffer.from(seed));
    return toHex(hash);
}
