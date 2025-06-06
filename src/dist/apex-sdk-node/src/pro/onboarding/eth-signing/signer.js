import { promisify } from 'es6-promisify';
import { ethers } from 'ethers';
import Web3 from 'web3';
import { SignatureTypes, SigningMethod } from '../interface/main';
import { createTypedSignature, stripHexPrefix } from './helpers';
import { web3 } from '..';
export class Signer {
    // ============ Constructor ============
    constructor(web3) {
        this.web3 = web3;
    }
    // ============ Functions ============
    /**
     * Returns a signable EIP712 Hash of a struct
     */
    getEIP712Hash(structHash) {
        const hash = Web3.utils.soliditySha3({ t: 'bytes2', v: '0x1901' }, { t: 'bytes32', v: this.getDomainHash() }, { t: 'bytes32', v: structHash });
        // Non-null assertion operator is safe, hash is null only on empty input.
        return hash;
    }
    async ethSignTypedDataInternal(signer, data, signingMethod) {
        let rpcMethod;
        let rpcData;
        const provider = this.web3.currentProvider;
        if (!provider) {
            throw new Error('Cannot sign since Web3 currentProvider is null');
        }
        if (typeof provider === 'string') {
            throw new Error('Cannot sign since Web3 currentProvider is a string');
        }
        let sendAsync;
        switch (signingMethod) {
            case SigningMethod.TypedData:
                sendAsync = promisify(provider.send.bind(provider));
                rpcMethod = 'eth_signTypedData';
                rpcData = data;
                break;
            case SigningMethod.MetaMask:
                sendAsync = promisify(provider.sendAsync.bind(provider));
                rpcMethod = 'eth_signTypedData_v3';
                rpcData = JSON.stringify(data);
                break;
            case SigningMethod.MetaMaskLatest:
                sendAsync = promisify((provider.sendAsync || provider.send).bind(provider));
                rpcMethod = 'eth_signTypedData_v4';
                rpcData = JSON.stringify(data);
                break;
            case SigningMethod.CoinbaseWallet:
                sendAsync = promisify(provider.sendAsync.bind(provider));
                rpcMethod = 'eth_signTypedData_v4';
                rpcData = data;
                break;
            default:
                throw new Error(`Invalid signing method ${signingMethod}`);
        }
        const response = await sendAsync({
            method: rpcMethod,
            params: [signer, rpcData],
            jsonrpc: '2.0',
            id: Date.now(),
        });
        const res = typeof response === 'string' ? { error: null, result: `${response}`.slice(2, 132) } : response;
        if (res.error) {
            throw new Error(res.error.message);
        }
        return `0x${stripHexPrefix(res.result)}0${SignatureTypes.NO_PREPEND}`;
    }
    /**
     * Sign a message with `personal_sign`.
     */
    async ethSignPersonalInternal(signer, message, env) {
        const provider = this.web3.currentProvider;
        if (!provider) {
            throw new Error('Cannot sign since Web3 currentProvider is null');
        }
        if (typeof provider === 'string') {
            throw new Error('Cannot sign since Web3 currentProvider is a string');
        }
        const sendAsync = promisify(provider.sendAsync || provider.send).bind(provider);
        const rpcMethod = 'personal_sign';
        let response;
        try {
            const msg = web3.utils.utf8ToHex(message);
            if (web3.eth.accounts.wallet[0]?.privateKey) {
                const tempRes = await web3.eth.accounts.sign(msg, web3.eth.accounts.wallet[0].privateKey);
                response = tempRes.signature;
            }
            else {
                response = await sendAsync({
                    method: rpcMethod,
                    params: [msg, signer],
                    jsonrpc: '2.0',
                    id: Date.now(),
                });
            }
        }
        catch (e) {
            throw new Error('Invalid personal_sign');
        }
        const signedMsg = response.result ? response.result : response;
        const verifiedAddress = ethers.utils.verifyMessage(message, signedMsg);
        const ifValid = verifiedAddress.toLowerCase() === signer.toLowerCase();
        if (!ifValid) {
            throw new Error('Invalid signature');
        }
        const res = typeof response === 'string' ? { error: null, result: `${response}`.slice(2, 132) } : response;
        if (res.error) {
            throw new Error(res.error.message);
        }
        const kL2KeyHashProd = '0x3978602b67f89ae820dcc57869dfab215c0a48f7510d95baef4cef262ad38350';
        const kL2KeyHashTestnet = '0x0be1ca974483d76bfb1b0b934b192f880e1e64c4872bfe471402337a70736366';
        const kL2KeyHash = env && env.isProd ? kL2KeyHashProd : kL2KeyHashTestnet;
        const bytes = ethers.utils.toUtf8Bytes(message);
        const personalSignMessageHash = ethers.utils.sha256(bytes);
        if (!ethers.BigNumber.from(personalSignMessageHash).eq(kL2KeyHash)) {
            throw new Error('personal_sign content hash mismatch');
        }
        return {
            value: createTypedSignature(res.result, SignatureTypes.PERSONAL),
            l2KeyHash: personalSignMessageHash,
        };
    }
}
