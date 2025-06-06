import { ethers } from "ethers";
import Web3 from "web3";
import { SignatureTypes } from "../interface/main";
/**
 * Ethereum signed message prefix without message length.
 */
export const PREPEND_PERSONAL = "\x19Ethereum Signed Message:\n";
/**
 * Ethereum signed message prefix, 32-byte message, with message length represented as a string.
 */
export const PREPEND_DEC = "\x19Ethereum Signed Message:\n32";
/**
 * Ethereum signed message prefix, 32-byte message, with message length as a one-byte integer.
 */
export const PREPEND_HEX = "\x19Ethereum Signed Message:\n\x20";
export const EIP712_DOMAIN_STRING = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
export const EIP712_DOMAIN_STRUCT = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
];
export const EIP712_DOMAIN_STRING_NO_CONTRACT = "EIP712Domain(string name,string version,uint256 chainId)";
export const EIP712_DOMAIN_STRUCT_NO_CONTRACT = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
];
export function isValidSigType(sigType) {
    switch (sigType) {
        case SignatureTypes.NO_PREPEND:
        case SignatureTypes.DECIMAL:
        case SignatureTypes.HEXADECIMAL:
        case SignatureTypes.PERSONAL:
            return true;
        default:
            return false;
    }
}
/**
 * Recover the address used to sign a given hash or message.
 *
 * The string `hashOrMessage` is a hash, unless the signature has type SignatureTypes.PERSONAL, in
 * which case it is the signed message.
 */
export function ecRecoverTypedSignature(hashOrMessage, typedSignature) {
    const sigType = parseInt(typedSignature.slice(-2), 16);
    let prependedHash;
    switch (sigType) {
        case SignatureTypes.NO_PREPEND:
            prependedHash = hashOrMessage;
            break;
        case SignatureTypes.PERSONAL: {
            const fullMessage = `${PREPEND_PERSONAL}${hashOrMessage.length}${hashOrMessage}`;
            prependedHash = Web3.utils.soliditySha3({ t: "string", v: fullMessage });
            break;
        }
        case SignatureTypes.DECIMAL:
            prependedHash = Web3.utils.soliditySha3({ t: "string", v: PREPEND_DEC }, { t: "bytes32", v: hashOrMessage });
            break;
        case SignatureTypes.HEXADECIMAL:
            prependedHash = Web3.utils.soliditySha3({ t: "string", v: PREPEND_HEX }, { t: "bytes32", v: hashOrMessage });
            break;
        default:
            throw new Error(`Invalid signature type: ${sigType}`);
    }
    const signature = typedSignature.slice(0, -2);
    // Non-null assertion operator is safe, hash is null only on empty input.
    return ethers.utils.recoverAddress(ethers.utils.arrayify(prependedHash), signature);
}
export function createTypedSignature(signature, sigType) {
    if (!isValidSigType(sigType)) {
        throw new Error(`Invalid signature type: ${sigType}`);
    }
    return `${fixRawSignature(signature)}0${sigType}`;
}
/**
 * Fixes any signatures that don't have a 'v' value of 27 or 28
 */
export function fixRawSignature(signature) {
    const stripped = stripHexPrefix(signature);
    if (stripped.length !== 130) {
        throw new Error(`Invalid raw signature: ${signature}`);
    }
    const rs = stripped.substr(0, 128);
    const v = stripped.substr(128, 2);
    switch (v) {
        case "00":
            return `0x${rs}1b`;
        case "01":
            return `0x${rs}1c`;
        case "1b":
        case "1c":
            return `0x${stripped}`;
        default:
            throw new Error(`Invalid v value: ${v}`);
    }
}
// ============ Byte Helpers ============
export function stripHexPrefix(input) {
    if (input.indexOf("0x") === 0) {
        return input.substr(2);
    }
    return input;
}
export function addressesAreEqual(addressOne, addressTwo) {
    if (!addressOne || !addressTwo) {
        return false;
    }
    return (stripHexPrefix(addressOne).toLowerCase() ===
        stripHexPrefix(addressTwo).toLowerCase());
}
export function hashString(input) {
    const hash = Web3.utils.soliditySha3({
        t: "string",
        v: input,
    });
    if (hash === null) {
        throw new Error(`soliditySha3 input was empty: ${input}`);
    }
    return hash;
}
