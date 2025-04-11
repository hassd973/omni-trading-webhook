import {
  SymbolInfoObject,
  OrderObject,
  ApiTool,
  DepthObject,
  GetHistoryFundingOptions,
  HistoryFundingObject,
  KlineObject,
  PerpetualObject,
  TickerObject, // ✅ Required for tickers()
} from './apexpro';

export class PublicApi {
  private apiTool: ApiTool;

  constructor(apiTool: ApiTool) {
    this.apiTool = apiTool;
  }

  async time(): Promise<{ time: number }> {
    return this.apiTool.apiRequest('/api/v1/time', 'get');
  }

  async symbols(): Promise<SymbolInfoObject[]> {
    return this.apiTool.apiRequest('/api/v1/symbols', 'get');
  }

  async symbolsV2(): Promise<PerpetualObject[]> {
    return this.apiTool.apiRequest('/api/v2/symbols', 'get');
  }

  async depth(symbol: string, limit: number = 100): Promise<DepthObject> {
    return this.apiTool.apiRequest('/api/v1/depth', 'get', {
      symbol,
      limit,
    });
  }

  async trades(
    symbol: string,
    limit?: number,
    from?: string
  ): Promise<OrderObject[]> {
    return this.apiTool.apiRequest('/api/v1/trades', 'get', {
      symbol,
      limit,
      from,
    });
  }

  async klines(
    symbol: string,
    interval: '1' | '5' | '15' | '30' | '60' | '120' | '240' | '360' | '720' | 'D' | 'M' | 'W',
    start?: number,
    end?: number,
    limit?: number,
  ): Promise<KlineObject[]> {
    return this.apiTool.apiRequest('/api/v1/klines', 'get', {
      symbol,
      interval,
      start,
      end,
      limit,
    });
  }

  async tickers(symbol: string): Promise<TickerObject[]> {
    return this.apiTool.apiRequest('/api/v1/ticker', 'get', { symbol });
  }

  async historyFunding(
    symbol: string,
    limit?: number,
    beginTimeInclusive?: number,
    endTimeExclusive?: number,
    page?: number
  ): Promise<HistoryFundingObject[]> {
    return this.apiTool.apiRequest('/api/v1/history-funding', 'get', {
      symbol,
      limit,
      beginTimeInclusive,
      endTimeExclusive,
      page,
    });
  }

  async historyFundingV2(
    symbol: string,
    limit?: number,
    beginTimeInclusive?: number,
    endTimeExclusive?: number,
    page?: number
  ): Promise<HistoryFundingObject[]> {
    return this.apiTool.apiRequest('/api/v2/history-funding', 'get', {
      symbol,
      limit,
      beginTimeInclusive,
      endTimeExclusive,
      page,
    });
  }

  async checkUserExist(ethAddress: string): Promise<boolean> {
    return this.apiTool.apiRequest('/api/v1/check-user-exist', 'get', {
      ethAddress,
    });
  }
}

