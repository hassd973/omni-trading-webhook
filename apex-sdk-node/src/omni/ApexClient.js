import { PublicApi } from './PublicApi';
import { PrivateApi } from './PrivateApi';
import { ClientConfig, PROD } from './Constant';
import { Clock } from './tool/Clock';
import { ApiTool } from './tool/ApiTool';
import { ZkLinkSigner } from '../packages/node-dist/zklink-sdk-node';
import { getSymbolsWithBaseInfo } from './tool/Tool';
export class ApexClientOmni {
    constructor(env = PROD) {
        this.env = env;
        this.apiTool = new ApiTool(env);
        this.publicApi = new PublicApi(this.apiTool);
    }
    async init(apiKeyCredentials, seed) {
        const clientConfig = new ClientConfig();
        clientConfig.apiTool = this.apiTool;
        clientConfig.networkId = this.env.networkId;
        clientConfig.clock = new Clock();
        clientConfig.apiKeyCredentials = apiKeyCredentials;
        clientConfig.client = this;
        this.clientConfig = clientConfig;
        this.seed = seed;
        this.initZkSigner();
        this.privateApi = new PrivateApi(clientConfig);
        await this.initClock(clientConfig);
        await this.initConfig(clientConfig);
    }
    initZkSigner() {
        const signer = ZkLinkSigner.ethSig(this.seed);
        this.signer = signer;
        this.clientConfig.signer = this.signer;
        return signer;
    }
    async initClock(clientConfig) {
        const { time } = await this.publicApi.time();
        this.clientConfig.clock.setTimestampAdjustment(time - new Date().getTime());
    }
    async initConfig(clientConfig) {
        this.user = await this.privateApi.user();
        if (!this.user?.ethereumAddress)
            throw new Error('Ethereum address is not found');
        this.account = await this.privateApi.getAccount(this.clientConfig.accountId, this.user?.ethereumAddress);
        clientConfig.zkAccountId = this.account.spotAccount.zkAccountId;
        clientConfig.accountId = this.account.id;
        this.checkAccountId();
        // this.checkL2Key();
        await this.initSymbol();
    }
    checkAccountId() {
        if (this.account.id !== this.clientConfig.accountId) {
            throw new Error('Account Id is not match, please check your account id.');
        }
    }
    checkL2Key() {
        // todo
    }
    async initSymbol() {
        const { contractConfig } = await this.publicApi.symbols();
        const { perpetualContract: perpetual = [], tokens: tokens_contract, assets: assets_contract, } = contractConfig;
        const symbols_perpetual = getSymbolsWithBaseInfo(perpetual, assets_contract, tokens_contract, 'perpetual');
        this.symbols = symbols_perpetual;
        return symbols_perpetual;
    }
}
