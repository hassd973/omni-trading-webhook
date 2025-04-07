export interface OrderWithNonce {
  nonce: string;
  positionId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  expirationIsoTimestamp: string;
  limitFee: string;
  amount?: string;
  quoteAmount?: string;     // Added to fix TS2339
  assetIdSynthetic?: string;
  assetIdCollateral?: string;
}

export interface OrderWithNonceAndQuoteAmount extends OrderWithNonce {
  quoteAmount?: string;     // Already optional, no change needed
}

// Ensure other related types are consistent
export interface OrderWithClientId {
  clientId: string;
  positionId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  expirationIsoTimestamp: string;
  limitFee: string;
  amount?: string;
  quoteAmount?: string;     // Optional for consistency
  assetIdSynthetic?: string;
  assetIdCollateral?: string;
}

export interface OrderWithClientIdAndQuoteAmount extends OrderWithClientId {
  quoteAmount?: string;
}

export enum StarkwareOrderType {
  LIMIT_ORDER_WITH_FEES = 'LIMIT_ORDER_WITH_FEES',
}

export interface StarkwareOrder {
  orderType: StarkwareOrderType;
  nonce: string;
  quantumsAmountSynthetic: string;
  quantumsAmountCollateral: string;
  quantumsAmountFee: string;
  assetIdSynthetic: string;
  assetIdCollateral: string;
  assetIdFee: string;
  positionId: string;
  isBuyingSynthetic: boolean;
  expirationEpochHours: number;
}

export type NetworkId = number;
