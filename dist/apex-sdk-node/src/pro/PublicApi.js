export class PublicApi {
    constructor(apiTool) {
        this.apiTool = apiTool;
    }
    async time() {
        return this.apiTool.apiRequest('/api/v1/time', 'get');
    }
    async symbols() {
        return this.apiTool.apiRequest('/api/v1/symbols', 'get');
    }
    async symbolsV2() {
        return this.apiTool.apiRequest('/api/v2/symbols', 'get');
    }
    async depth(symbol, limit = 100) {
        return this.apiTool.apiRequest('/api/v1/depth', 'get', {
            symbol,
            limit,
        });
    }
    async trades(symbol, limit, from) {
        return this.apiTool.apiRequest('/api/v1/trades', 'get', {
            symbol,
            limit,
            from,
        });
    }
    async klines(symbol, interval, start, end, limit) {
        return this.apiTool.apiRequest('/api/v1/klines', 'get', {
            symbol,
            interval,
            start,
            end,
            limit,
        });
    }
    async tickers(symbol) {
        return this.apiTool.apiRequest('/api/v1/ticker', 'get', { symbol });
    }
    async historyFunding(symbol, limit, beginTimeInclusive, endTimeExclusive, page) {
        return this.apiTool.apiRequest('/api/v1/history-funding', 'get', {
            symbol,
            limit,
            beginTimeInclusive,
            endTimeExclusive,
            page,
        });
    }
    async historyFundingV2(symbol, limit, beginTimeInclusive, endTimeExclusive, page) {
        return this.apiTool.apiRequest('/api/v2/history-funding', 'get', {
            symbol,
            limit,
            beginTimeInclusive,
            endTimeExclusive,
            page,
        });
    }
    async checkUserExist(ethAddress) {
        return this.apiTool.apiRequest('/api/v1/check-user-exist', 'get', {
            ethAddress,
        });
    }
}
