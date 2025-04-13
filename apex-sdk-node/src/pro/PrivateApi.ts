import { addOrderExpirationBufferHours, isoTimestampToEpochHours, SignableOrder } from './starkex-lib';
import cryptojs from 'crypto-js';
import {
  AccountBalanceObject,
  AccountObject,
  BasicException,
  FundingRateObject,
  generateRandomClientId,
  HistoricalPNLObject,
  isNullOrBlank,
  ISO8601,
  Market,
  OrderObject,
  OrderSide,
  OrderWithClientId,
  Trace,
  UserObject,
  WorstPriceObject,
} from './apexpro';
import qs from 'qs';
import { ClientConfig } from './Constant';

export class PrivateApi {
  private clientConfig: ClientConfig;

  constructor(clientConfig: ClientConfig) {
    this.clientConfig = clientConfig;
  }

  private async request<T = any>(
    path: string,
    method: 'get' | 'post' | 'put' | 'delete',
    data: any = {},
    config: any = {
      headers: {},
      form: true,
    },
  ): Promise<T> {
    let params = qs.stringify(data, {
      filter(prefix, value) {
        if (value) {
          return value;
        }
        return;
      },
      sort(a, b) {
        return a.localeCompare(b);
      },
    });
    if (['get', 'delete'].indexOf(method.toLowerCase()) >= 0) {
      if (Object.keys(data).length > 0) {
        if (params) {
          path = path + '?' + params;
        }
        params = '';
      }
    }
    const isoTimestamp: ISO8601 = this.clientConfig.clock.getAdjustedIsoString();
    const headers = {
      'APEX-SIGNATURE': this.sign(path, method, isoTimestamp, params),
      'APEX-API-KEY': this.clientConfig.apiKeyCredentials.key,
      'APEX-TIMESTAMP': new Date(isoTimestamp).getTime(),
      'APEX-PASSPHRASE': this.clientConfig.apiKeyCredentials.passphrase,
    };
    config.headers = {
      ...config.headers,
      ...headers,
    };
    return this.clientConfig.apiTool.apiRequest(path, method, params, config);
  }

  private sign(
    requestPath: string,
    method: 'get' | 'post' | 'put' | 'delete',
    isoTimestamp: ISO8601,
    params: string,
  ): string {
    const messageString: string =
      new Date(isoTimestamp).getTime() + method.toUpperCase() + requestPath + (isNullOrBlank(params) ? '' : params);
    Trace.print(messageString);
    const key = Buffer.from(this.clientConfig.apiKeyCredentials.secret).toString('base64');
    const hash = cryptojs.HmacSHA256(messageString, key);
    return hash.toString(cryptojs.enc.Base64);
  }

  private async getSignature(signature: string, signatureFunc: () => Promise<string>): Promise<string> {
    if (signature) {
      return signature;
    }
    if (!this.clientConfig.starkKeyPair) {
      throw new BasicException('StarkKeyPair Uninitialized');
    }
    return await signatureFunc();
  }

  async user(): Promise<UserObject> {
    return this.request('/api/v1/user', 'get');
  }

  async getAccount(id: string, ethereumAddress: string): Promise<AccountObject> {
    return this.request('/api/v1/account', 'get', {
      id,
      ethereumAddress,
    });
  }

  async getAccountV2(id: string, ethereumAddress: string): Promise<AccountObject> {
    return this.request('/api/v2/account', 'get', {
      id,
      ethereumAddress,
    });
  }

  async tradeHistory(
    symbol?: string,
    status?: 'PENDING' | 'OPEN' | 'FILLED' | 'CANCELED' | 'EXPIRED' | 'UNTRIGGERED',
    side?: 'BUY' | 'SELL',
    limit?: number,
    beginTimeInclusive?: number,
    endTimeExclusive?: number,
    page?: number,
    orderType?: 'ACTIVE' | 'CONDITION' | 'HISTORY',
  ): Promise<{ orders: OrderObject[] }> {
    return this.request('/api/v1/fills', 'get', {
      symbol,
      status,
      side,
      limit,
      beginTimeInclusive,
      endTimeExclusive,
      page,
      orderType,
    });
  }

  async tradeHistoryV2(
    token: 'USDC' | 'USDT',
    symbol?: string,
    status?: 'PENDING' | 'OPEN' | 'FILLED' | 'CANCELED' | 'EXPIRED' | 'UNTRIGGERED',
    side?: 'BUY' | 'SELL',
    limit?: number,
    beginTimeInclusive?: number,
    endTimeExclusive?: number,
    page?: number,
    orderType?: 'ACTIVE' | 'CONDITION' | 'HISTORY',
  ): Promise<{ orders: OrderObject[] }> {
    return this.request('/api/v2/fills', 'get', {
      token,
      symbol,
      status,
      side,
      limit,
      beginTimeInclusive,
      endTimeExclusive,
      page,
      orderType,
    });
  }

  async getWorstPrice(symbol: string, size: string, side: 'BUY' | 'SELL'): Promise<WorstPriceObject> {
    return this.request('/api/v1/get-worst-price', 'get', {
      symbol,
      size,
      side,
    });
  }

  async getWorstPriceV2(symbol: string, size: string, side: 'BUY' | 'SELL'): Promise<WorstPriceObject> {
    return this.request('/api/v2/get-worst-price', 'get', {
      symbol,
      size,
      side,
    });
  }

  async createOrder(
    clientId: string,
    positionId: string,
    symbol: string,
    side: 'BUY' | 'SELL',
    type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TAKE_PROFIT_LIMIT' | 'TAKE_PROFIT_MARKET',
    size: string,
    price: string,
    limitFee: string,
    timeInForce?: 'GOOD_TIL_CANCEL' | 'FILL_OR_KILL' | 'IMMEDIATE_OR_CANCEL' | 'POST_ONLY',
    triggerPrice?: string,
    trailingPercent?: string,
    reduceOnly?: boolean,
    brokerId?: string
  ): Promise<OrderObject> {
    clientId = clientId || generateRandomClientId();
    const expirationIsoTimestamp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const signature: string = await this.getSignature('', async () => {
      const orderToSign: OrderWithClientId = {
        positionId,
        humanSize: size,
        limitFee,
        symbol,
        side,
        expirationIsoTimestamp,
        clientId,
        humanPrice: price,
      };

      const starkOrder = SignableOrder.fromOrder(orderToSign, this.clientConfig.networkId);
      return starkOrder.sign(this.clientConfig.starkKeyPair);
    });
    const order = {
      clientId,
      expiration: new Date(addOrderExpirationBufferHours(expirationIsoTimestamp)).getTime(),
      limitFee,
      price,
      reduceOnly,
      side,
      signature,
      size,
      symbol,
      timeInForce,
      triggerPrice,
      trailingPercent,
      type,
      brokerId
    };
    return this.request('/api/v1/create-order', 'post', order);
  }

  async createOrderV2(
    clientId: string,
    positionId: string,
    symbol: string,
    side: 'BUY' | 'SELL',
    type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TAKE_PROFIT_LIMIT' | 'TAKE_PROFIT_MARKET',
    size: string,
    price: string,
    limitFee: string,
    timeInForce?: 'GOOD_TIL_CANCEL' | 'FILL_OR_KILL' | 'IMMEDIATE_OR_CANCEL' | 'POST_ONLY',
    triggerPrice?: string,
    trailingPercent?: string,
    reduceOnly?: boolean,
    brokerId?: string
  ): Promise<OrderObject> {
    clientId = clientId || generateRandomClientId();
    const expirationIsoTimestamp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const signature: string = await this.getSignature('', async () => {
      const orderToSign: OrderWithClientId = {
        positionId,
        humanSize: size,
        limitFee,
        symbol,
        side,
        expirationIsoTimestamp,
        clientId,
        humanPrice: price,
      };

      const starkOrder = SignableOrder.fromOrder(orderToSign, this.clientConfig.networkId);
      return starkOrder.sign(this.clientConfig.starkKeyPair);
    });
    const order = {
      clientId,
      expiration: new Date(addOrderExpirationBufferHours(expirationIsoTimestamp)).getTime(),
      limitFee,
      price,
      reduceOnly,
      side,
      signature,
      size,
      symbol,
      timeInForce,
      triggerPrice,
      trailingPercent,
      type,
      brokerId
    };
    return this.request('/api/v2/create-order', 'post', order);
  }

  async cancelOrder(id: string): Promise<number> {
    return this.request('/api/v1/delete-order', 'post', {
      id,
    });
  }

  async cancelOrderV2(id: string): Promise<number> {
    return this.request('/api/v2/delete-order', 'post', {
      id,
    });
  }

  async cancelOrderByClientOrderId(id: string): Promise<number> {
    return this.request('/api/v1/delete-client-order-id', 'post', {
      id,
    });
  }

  async cancelOrderByClientOrderIdV2(id: string): Promise<number> {
    return this.request('/api/v2/delete-client-order-id', 'post', {
      id,
    });
  }

  async cancelAllOrder(symbol?: string): Promise<void> {
    return this.request('/api/v1/delete-open-orders', 'post', {
      symbol,
    });
  }

  async cancelAllOrderV2(token: 'USDC' | 'USDT', symbol?: string): Promise<void> {
    return this.request('/api/v2/delete-open-orders', 'post', {
      token,
      symbol,
    });
  }

  async openOrders(): Promise<{ orders: OrderObject[] }> {
    return this.request('/api/v1/open-orders', 'get', {});
  }

  async openOrdersV2(token: 'USDC' | 'USDT'): Promise<{ orders: OrderObject[] }> {
    return this.request('/api/v1/open-orders', 'get', { token });
  }

  async getOrder(id: string): Promise<OrderObject> {
    return this.request('/api/v1/get-order', 'get', { id });
  }

  async getOrderV2(id: string): Promise<OrderObject> {
    return this.request('/api/v2/get-order', 'get', { id });
  }

  async getOrderByClientOrderId(id: string): Promise<OrderObject> {
    return this.request('/api/v1/order-by-client-order-id', 'get', { id });
  }

  async historyOrders(
    symbol?: string,
    status?: 'PENDING' | 'OPEN' | 'FILLED' | 'CANCELED' | 'EXPIRED' | 'UNTRIGGERED',
    side?: 'BUY' | 'SELL',
    limit?: number,
    beginTimeInclusive?: number,
    endTimeExclusive?: number,
    page?: number,
    orderType?: 'ACTIVE' | 'CONDITION' | 'HISTORY',
  ): Promise<{ orders: OrderObject[]; totalSize: number }> {
    return this.request('/api/v1/history-orders', 'get', {
      symbol,
      status,
      side,
      limit,
      beginTimeInclusive,
      endTimeExclusive,
      page,
      orderType,
    });
  }

  async historyOrdersV2(
    token: 'USDC' | 'USDT',
    symbol?: string,
    status?: 'PENDING' | 'OPEN' | 'FILLED' | 'CANCELED' | 'EXPIRED' | 'UNTRIGGERED',
    side?: 'BUY' | 'SELL',
    limit?: number,
    beginTimeInclusive?: number,
    endTimeExclusive?: number,
    page?: number,
    orderType?: 'ACTIVE' | 'CONDITION' | 'HISTORY',
  ): Promise<{ orders: OrderObject[]; totalSize: number }> {
    return this.request('/api/v2/history-orders', 'get', {
      token,
      symbol,
      status,
      side,
      limit,
      beginTimeInclusive,
      endTimeExclusive,
      page,
      orderType,
    });
  }

  async fundingRate(
    symbol?: string,
    limit?: number,
    page?: number,
    beginTimeInclusive?: number,
    endTimeExclusive?: number,
    side?: 'BUY' | 'SELL',
    status?: 'PENDING' | 'OPEN' | 'FILLED' | 'CANCELED' | 'EXPIRED' | 'UNTRIGGERED',
  ): Promise<{ fundingValues: FundingRateObject[]; totalSize: number }> {
    return this.request('/api/v1/funding', 'get', {
      symbol,
      limit,
      page,
      beginTimeInclusive,
      endTimeExclusive,
      side,
      status,
    });
  }

  async fundingRateV2(
    token: 'USDC' | 'USDT',
    symbol?: string,
    limit?: number,
    page?: number,
    beginTimeInclusive?: number,
    endTimeExclusive?: number,
    side?: 'BUY' | 'SELL',
    status?: 'PENDING' | 'OPEN' | 'FILLED' | 'CANCELED' | 'EXPIRED' | 'UNTRIGGERED',
  ): Promise<{ fundingValues: FundingRateObject[]; totalSize: number }> {
    return this.request('/api/v2/funding', 'get', {
      token,
      symbol,
      limit,
      page,
      beginTimeInclusive,
      endTimeExclusive,
      side,
      status,
    });
  }

  async historicalPNL(
    beginTimeInclusive?: number,
    endTimeExclusive?: number,
    type?: number,
    symbol?: string,
    page?: number,
    limit?: number,
  ): Promise<{ historicalPnl: HistoricalPNLObject[]; totalSize: number }> {
    return this.request('/api/v1/historical-pnl', 'get', {
      beginTimeInclusive,
      endTimeExclusive,
      type,
      symbol,
      page,
      limit,
    });
  }

  async historicalPNLV2(
    token: 'USDC' | 'USDT',
    beginTimeInclusive?: number,
    endTimeExclusive?: number,
    type?: number,
    symbol?: string,
    page?: number,
    limit?: number,
  ): Promise<{ historicalPnl: HistoricalPNLObject[]; totalSize: number }> {
    return this.request('/api/v2/historical-pnl', 'get', {
      token,
      beginTimeInclusive,
      endTimeExclusive,
      type,
      symbol,
      page,
      limit,
    });
  }

  async yesterdayPNL(): Promise<string> {
    return this.request('/api/v1/yesterday-pnl', 'get', {});
  }

  async yesterdayPNLV2(token: 'USDC' | 'USDT'): Promise<string> {
    return this.request('/api/v2/yesterday-pnl', 'get', { token });
  }

  async setInitialMarginRate(symbol: string, initialMarginRate: string): Promise<void> {
    return this.request('/api/v1/set-initial-margin-rate', 'post', {
      symbol,
      initialMarginRate,
    });
  }

  async setInitialMarginRateV2(symbol: string, initialMarginRate: string): Promise<void> {
    return this.request('/api/v2/set-initial-margin-rate', 'post', {
      symbol,
      initialMarginRate,
    });
  }

  async accountBalance(): Promise<AccountBalanceObject> {
    return this.request('/api/v1/account-balance', 'get', {});
  }

  async accountBalanceV2(): Promise<AccountBalanceObject> {
    return this.request('/api/v2/account-balance', 'get', {});
  }
}
