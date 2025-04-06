export class ClientConfig {
}
export class ENV {
    constructor(url, networkId) {
        this.url = url;
        this.networkId = networkId;
        this.isProd = +networkId === 1;
        this.registerChainId = +networkId === 1 ? 1 : 5;
    }
}
export const PROD = new ENV('https://pro.apex.exchange', 1);
export const QA = new ENV('https://qa.pro.apex.exchange', 5);
