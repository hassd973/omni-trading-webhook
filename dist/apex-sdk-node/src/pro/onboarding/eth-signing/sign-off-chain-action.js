import BigNumber from 'bignumber.js';
import * as ethers from 'ethers';
import _ from 'lodash';
import Web3 from 'web3';
import { SigningMethod, SignatureTypes } from '../interface/main';
import { EIP712_DOMAIN_STRING_NO_CONTRACT, EIP712_DOMAIN_STRUCT_NO_CONTRACT, addressesAreEqual, createTypedSignature, ecRecoverTypedSignature, hashString, stripHexPrefix, } from './helpers';
import { Signer } from './signer';
const PERSONAL_SIGN_DOMAIN_PARAMS = ['name', 'version', 'chainId'];
export class SignOffChainAction extends Signer {
    constructor(web3, networkId, actionStruct, { domain = 'ApeX', version = '1.0', } = {}) {
        super(web3);
        this.networkId = networkId;
        this.actionStruct = actionStruct;
        this.domain = domain;
        this.version = version;
    }
    async sign(signer, signingMethod, message, env) {
        const walletAccount = this.web3.eth.accounts.wallet[signer]; // Fixed type assertion
        switch (signingMethod) {
            case SigningMethod.Hash:
            case SigningMethod.UnsafeHash:
            case SigningMethod.Compatibility: {
                const hash = this.getHash(message);
                const rawSignature = walletAccount
                    ? this.web3.eth.accounts.sign(hash, walletAccount.privateKey).signature
                    : await this.web3.eth.sign(hash, signer);
                const hashSig = createTypedSignature(rawSignature, SignatureTypes.DECIMAL);
                if (signingMethod === SigningMethod.Hash) {
                    return hashSig;
                }
                const unsafeHashSig = createTypedSignature(rawSignature, SignatureTypes.NO_PREPEND);
                if (signingMethod === SigningMethod.UnsafeHash) {
                    return unsafeHashSig;
                }
                return this.verify(unsafeHashSig, signer, message) ? unsafeHashSig : hashSig;
            }
            case SigningMethod.TypedData: {
                if (!walletAccount?.privateKey) {
                    throw new Error('Wallet account or private key not found');
                }
                const wallet = new ethers.Wallet(walletAccount.privateKey);
                const rawSignature = await wallet._signTypedData(this.getDomainData(), { [this.domain]: this.actionStruct }, message);
                return createTypedSignature(rawSignature, SignatureTypes.NO_PREPEND);
            }
            case SigningMethod.MetaMask:
            case SigningMethod.MetaMaskLatest:
            case SigningMethod.CoinbaseWallet: {
                const data = {
                    types: {
                        EIP712Domain: EIP712_DOMAIN_STRUCT_NO_CONTRACT,
                        [this.domain]: [...this.actionStruct], // Create a new array to avoid mutation
                    },
                    domain: this.getDomainData(),
                    primaryType: this.domain,
                    message,
                };
                // Type assertion for message with nonce
                const msg = message;
                if (msg.nonce) {
                    data.types[this.domain].push({ type: 'string', name: 'nonce' });
                }
                return this.ethSignTypedDataInternal(signer, data, signingMethod);
            }
            case SigningMethod.Personal: {
                const messageString = this.getPersonalSignMessage(message);
                return this.ethSignPersonalInternal(signer, messageString);
            }
            case SigningMethod.Personal2: {
                if (!env)
                    throw new Error('ENV is required for Personal2 signing method');
                const messageString = this.getPersonalSignMessage(message).replace('chainId', 'envId');
                return this.ethSignPersonalInternal(signer, messageString, env);
            }
            default:
                throw new Error(`Invalid signing method: ${signingMethod}`);
        }
    }
    verify(typedSignature, expectedSigner, message) {
        if (stripHexPrefix(typedSignature).length !== 130) { // 66 * 2 = 132 including '0x'
            throw new Error(`Unable to verify signature with invalid length: ${typedSignature}`);
        }
        const sigType = parseInt(typedSignature.slice(-2), 16);
        let hashOrMessage;
        switch (sigType) {
            case SignatureTypes.NO_PREPEND:
            case SignatureTypes.DECIMAL:
            case SignatureTypes.HEXADECIMAL:
                hashOrMessage = this.getHash(message);
                break;
            case SignatureTypes.PERSONAL:
                hashOrMessage = this.getPersonalSignMessage(message);
                break;
            default:
                throw new Error(`Invalid signature type: ${sigType}`);
        }
        const signer = ecRecoverTypedSignature(hashOrMessage, typedSignature);
        return addressesAreEqual(signer, expectedSigner);
    }
    getPersonalSignMessage(message) {
        const json = JSON.stringify({
            ..._.pick(this.getDomainData(), PERSONAL_SIGN_DOMAIN_PARAMS),
            ..._.pick(message, _.keys(message).sort()),
        }, null, 2);
        return json
            .replace('{\n', '')
            .replace('\n}', '')
            .replace(/"/g, '')
            .replace(/\s+/g, '')
            .replace(/:/g, ': ')
            .replace(/,/g, '\n')
            .replace('L2Key', 'L2 Key')
            .replace('https: //', 'https://');
    }
    getDomainHash() {
        const hash = Web3.utils.soliditySha3({ type: 'bytes32', value: hashString(EIP712_DOMAIN_STRING_NO_CONTRACT) }, { type: 'bytes32', value: hashString(this.domain) }, { type: 'bytes32', value: hashString(this.version) }, { type: 'uint256', value: new BigNumber(this.networkId).toFixed(0) });
        if (!hash)
            throw new Error('Failed to generate domain hash');
        return hash;
    }
    getDomainData() {
        return {
            name: this.domain,
            version: this.version,
            chainId: this.networkId,
        };
    }
}
