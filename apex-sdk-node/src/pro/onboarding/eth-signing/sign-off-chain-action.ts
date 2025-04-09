import BigNumber from 'bignumber.js';
import * as ethers from 'ethers';
import _ from 'lodash';
import Web3 from 'web3';

import { SigningMethod, SignatureTypes, Address, Account } from '../interface/main';
import {
  EIP712_DOMAIN_STRING_NO_CONTRACT,
  EIP712_DOMAIN_STRUCT_NO_CONTRACT,
  addressesAreEqual,
  createTypedSignature,
  ecRecoverTypedSignature,
  hashString,
  stripHexPrefix,
} from './helpers';
import { Signer } from './signer';
import { ENV } from '../../Constant';

const PERSONAL_SIGN_DOMAIN_PARAMS = ['name', 'version', 'chainId'];

type EIP712Struct = {
  type: string;
  name: string;
}[];

export abstract class SignOffChainAction<M extends {}> extends Signer {
  protected readonly networkId: number;
  private readonly actionStruct: EIP712Struct;
  private readonly domain: string;
  private readonly version: string;

  constructor(
    web3: Web3,
    networkId: number,
    actionStruct: EIP712Struct,
    {
      domain = 'ApeX',
      version = '1.0',
    }: {
      domain?: string;
      version?: string;
    } = {},
  ) {
    super(web3);
    this.networkId = networkId;
    this.actionStruct = actionStruct;
    this.domain = domain;
    this.version = version;
  }

  public abstract getHash(message: M): string;

  public async sign(
    signer: string,
    signingMethod: SigningMethod,
    message: M,
    env?: ENV,
  ): Promise<string | { value: string; l2KeyHash: string }> {
    const walletAccount: Account | undefined = this.web3.eth.accounts.wallet[signer as any];
    switch (signingMethod) {
      case SigningMethod.Hash:
      case SigningMethod.UnsafeHash:
      case SigningMethod.Compatibility: {
        const hash = this.getHash(message);
        const rawSignature = walletAccount
          ? this.web3.eth.accounts.sign(hash, walletAccount.privateKey).signature
          : await this.web3.eth.sign(hash, signer);
        const hashSig = createTypedSignature(rawSignature, SignatureTypes.DECIMAL);
        if (signingMethod === SigningMethod.Hash) return hashSig;
        const unsafeHashSig = createTypedSignature(rawSignature, SignatureTypes.NO_PREPEND);
        if (signingMethod === SigningMethod.UnsafeHash) return unsafeHashSig;
        // Extract string signature for verify
        const signatureToVerify = typeof unsafeHashSig === 'string' ? unsafeHashSig : unsafeHashSig.value;
        return this.verify(signatureToVerify, signer, message) ? unsafeHashSig : hashSig;
      }
      case SigningMethod.TypedData: {
        if (!walletAccount?.privateKey) {
          throw new Error('Wallet account or private key not found for TypedData signing');
        }
        const wallet = new ethers.Wallet(walletAccount.privateKey);
        const rawSignature = await wallet._signTypedData(
          this.getDomainData(),
          { [this.domain]: this.actionStruct },
          message,
        );
        return createTypedSignature(rawSignature, SignatureTypes.NO_PREPEND);
      }
      case SigningMethod.MetaMask:
      case SigningMethod.MetaMaskLatest:
      case SigningMethod.CoinbaseWallet: {
        const data = {
          types: {
            EIP712Domain: EIP712_DOMAIN_STRUCT_NO_CONTRACT,
            [this.domain]: [...this.actionStruct],
          },
          domain: this.getDomainData(),
          primaryType: this.domain,
          message,
        };

        const msg = message as any;
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
        if (!env) throw new Error('ENV is required for Personal2 signing method');
        const messageString = this.getPersonalSignMessage(message).replace('chainId', 'envId');
        return this.ethSignPersonalInternal(signer, messageString, env);
      }
      default:
        throw new Error(`Invalid signing method: ${signingMethod}`);
    }
  }

  public verify(typedSignature: string, expectedSigner: Address, message: M): boolean {
    if (stripHexPrefix(typedSignature).length !== 130) {
      throw new Error(`Invalid signature length: ${typedSignature}, expected 130 hex chars`);
    }

    const sigType = parseInt(typedSignature.slice(-2), 16);
    let hashOrMessage: string;

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

  public getPersonalSignMessage(message: M): string {
    const json = JSON.stringify(
      {
        ..._.pick(this.getDomainData(), PERSONAL_SIGN_DOMAIN_PARAMS),
        ..._.pick(message, _.keys(message).sort()),
      },
      null,
      2,
    );

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

  public getDomainHash(): string {
    const hash = Web3.utils.soliditySha3(
      { type: 'bytes32', value: hashString(EIP712_DOMAIN_STRING_NO_CONTRACT) },
      { type: 'bytes32', value: hashString(this.domain) },
      { type: 'bytes32', value: hashString(this.version) },
      { type: 'uint256', value: new BigNumber(this.networkId).toFixed(0) },
    );

    if (!hash) throw new Error('Failed to generate domain hash');
    return hash;
  }

  private getDomainData() {
    return {
      name: this.domain,
      version: this.version,
      chainId: this.networkId,
    };
  }
}
