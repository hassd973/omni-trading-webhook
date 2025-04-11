import { genStarkKey, genNonce, simplifyOnboarding } from './tool';
import { SigningMethod } from './interface';
import { sleep } from '../apexpro';
import Web3 from 'web3';
const web3 = new Web3();
const createStartKeyAndOnboarding = async (signer, env, token, rpcUrl, version = 'v2') => {
    if (!web3?.currentProvider) {
        web3.setProvider(new Web3.providers.HttpProvider(rpcUrl));
    }
    const account = signer.address;
    const chainId = env.networkId;
    if (account) {
        const { key, l2KeyHash } = await genStarkKey(SigningMethod.Personal2, account, env);
        if (key) {
            return await getNonce(key, env, { chainId, account, token, version });
        }
        return { key, l2KeyHash };
    }
    else {
        throw new Error('Invalid Account');
    }
};
const createStartKey = async (signer, env, token, rpcUrl, version = 'v2') => {
    if (!web3?.currentProvider) {
        web3.setProvider(new Web3.providers.HttpProvider(rpcUrl));
    }
    const account = signer.address;
    if (account) {
        const { key } = await genStarkKey(SigningMethod.Personal2, account, env);
        return key;
    }
    else {
        throw new Error('Invalid Account');
    }
};
const getNonce = async (key, env, options) => {
    try {
        const res = await genNonce(options.account || '', key.publicKey, env, { chainId: options.chainId });
        if (res.data.nonce) {
            await sleep(1000);
            return await onboarding(env, res.data.nonce, key, {
                account: options.account,
                token: options.token,
                onboardingVersion: options.version,
            });
        }
        else {
            throw new Error('Unkown Error');
        }
    }
    catch (e) {
        throw new Error('Unkown Error');
    }
};
const onboarding = async (env, nonce, key, 
//
options) => {
    const status = !!options.account;
    const _account = options.account;
    let onboardingFn = simplifyOnboarding;
    switch (options.onboardingVersion) {
        case 'v1':
            onboardingFn = simplifyOnboarding; // force use v2 version
            break;
        case 'v2':
            onboardingFn = simplifyOnboarding;
            break;
    }
    if (status) {
        try {
            const res = await onboardingFn(env, nonce, SigningMethod.MetaMaskLatest, _account, key, options.token);
            if (res.data) {
                return res.data;
            }
            else {
                throw new Error('Unkown Error');
            }
        }
        catch (e) {
            throw e;
        }
    }
    else {
        throw new Error('Invalid Account');
    }
};
const onboardingAccount = async ({ env, privateKey, rpcUrl, version = 'v2', token = 'USDC', }) => {
    const signer = await web3.eth.accounts.wallet.add(privateKey);
    web3.setProvider(new Web3.providers.HttpProvider(rpcUrl));
    const res = await createStartKeyAndOnboarding(signer, env, token, rpcUrl, version);
    return res;
};
export { web3, onboardingAccount, createStartKey, getNonce, onboarding };
